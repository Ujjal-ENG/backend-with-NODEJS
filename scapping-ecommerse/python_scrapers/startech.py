from __future__ import annotations

from typing import Any
from urllib.parse import quote_plus

import requests
from bs4 import BeautifulSoup

from .base import BaseScraper, ScraperContext
from .common import is_discounted, normalize_deal

STARTECH_CATEGORY_URLS = [
    "https://www.startech.com.bd/laptop-notebook",
    "https://www.startech.com.bd/mobile-phone",
    "https://www.startech.com.bd/headphone",
]


def category_from_url(url: str) -> str:
    if any(keyword in url for keyword in ("mobile", "headphone", "laptop")):
        return "gadgets"
    return "gadgets"


def _node_text(node: Any, selector: str) -> str:
    target = node.select_one(selector)
    return target.get_text(" ", strip=True) if target else ""


def _node_attr(node: Any, selector: str, attr_name: str) -> str | None:
    target = node.select_one(selector)
    if not target:
        return None
    return target.get(attr_name)


def parse_startech_products(
    html: str,
    source: str = "startech",
    category: str = "gadgets",
) -> list[dict[str, Any]]:
    soup = BeautifulSoup(html or "", "html.parser")
    deals: list[dict[str, Any]] = []

    for node in soup.select(".p-item"):
        title = _node_text(node, ".p-item-name a")
        product_url = _node_attr(node, ".p-item-name a", "href")
        image_url = _node_attr(node, ".p-item-img img", "src")
        price_current = _node_text(node, ".price-new") or _node_text(node, ".p-item-price")
        price_original = _node_text(node, ".price-old")

        deal = normalize_deal(
            {
                "source": source,
                "category": category,
                "title": title,
                "priceCurrent": price_current,
                "priceOriginal": price_original,
                "discountLabel": "price drop" if price_original else None,
                "imageUrl": image_url,
                "productUrl": product_url,
            }
        )

        if deal and is_discounted(deal):
            deals.append(deal)

    return deals


class StartechScraper(BaseScraper):
    def __init__(self, max_deals_per_source: int | None = None):
        super().__init__(source="startech", max_deals_per_source=max_deals_per_source)

    def search_products(self, query: str, context: ScraperContext) -> dict[str, Any]:
        warnings: list[str] = []
        encoded = quote_plus(query)
        url = f"https://www.startech.com.bd/product/search?search={encoded}"

        robots = self.can_fetch(url, context, warnings)
        if not robots.allowed:
            return {"warnings": warnings, "products": []}

        self.delay(context.config)

        try:
            response = context.session.get(url, timeout=context.config.request_timeout_ms / 1000)
        except requests.RequestException as exc:
            warnings.append(f"Startech search failed ({exc})")
            return {"warnings": warnings, "products": []}

        if response.status_code < 200 or response.status_code >= 300:
            warnings.append(f"Startech search failed ({response.status_code})")
            return {"warnings": warnings, "products": []}

        products = parse_startech_products(response.text, self.source, "gadgets")
        return {"warnings": warnings, "products": products}

    def scrape(self, context: ScraperContext) -> dict[str, Any]:
        deals: list[dict[str, Any]] = []
        warnings: list[str] = []

        for base_url in STARTECH_CATEGORY_URLS:
            category = category_from_url(base_url)

            for page in range(1, context.config.max_pages_per_source + 1):
                url = base_url if page == 1 else f"{base_url}?page={page}"

                robots = self.can_fetch(url, context, warnings)
                if not robots.allowed:
                    continue

                self.delay(context.config)

                try:
                    response = context.session.get(url, timeout=context.config.request_timeout_ms / 1000)
                except requests.RequestException as exc:
                    warnings.append(f"Startech request failed ({exc}) for {url}")
                    break

                if response.status_code < 200 or response.status_code >= 300:
                    warnings.append(f"Startech request failed ({response.status_code}) for {url}")
                    break

                parsed_deals = parse_startech_products(response.text, self.source, category)
                if not parsed_deals:
                    break

                deals.extend(parsed_deals)

        return {
            "status": "partial" if warnings else "ok",
            "warnings": warnings,
            "deals": self.clamp_deals(deals, context.config.max_deals_per_source),
        }
