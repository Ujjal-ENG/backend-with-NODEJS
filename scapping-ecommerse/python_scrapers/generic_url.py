from __future__ import annotations

import json
import logging
import re
from typing import Any
from urllib.parse import urljoin, urlsplit

import requests
from bs4 import BeautifulSoup

from .base import ScraperContext
from .common import normalize_number, parse_price

logger = logging.getLogger(__name__)

CARD_SELECTORS = [
    ".product-item",
    ".product-card",
    ".p-item",
    ".single-product",
    ".product-thumb",
    '[class*="product-"]',
    ".card-product",
    ".item-card",
    ".listing-item",
]

PRICE_PATTERN = re.compile(r"(?:৳|tk|bdt|price[:\s]*)\s*([0-9,]+(?:\.[0-9]+)?)", re.IGNORECASE)


def slug_to_title(pathname: str = "") -> str:
    slug = pathname.rstrip("/").split("/")[-1] if pathname else ""
    if not slug:
        return "Unknown Product"
    return re.sub(r"\s+", " ", requests.utils.unquote(slug).replace("-", " ").replace("_", " ")).strip()


def _content(soup: BeautifulSoup, selector: str, attr_name: str = "content") -> str | None:
    node = soup.select_one(selector)
    if not node:
        return None
    value = node.get(attr_name)
    return value.strip() if isinstance(value, str) and value.strip() else None


def _text(soup: BeautifulSoup, selector: str) -> str:
    node = soup.select_one(selector)
    return node.get_text(" ", strip=True) if node else ""


def _is_product_type(raw_type: Any) -> bool:
    if isinstance(raw_type, str):
        return raw_type == "Product" or "Product" in raw_type
    if isinstance(raw_type, list):
        return any(_is_product_type(entry) for entry in raw_type)
    return False


def _image_value(value: Any) -> str | None:
    if isinstance(value, list):
        return str(value[0]) if value else None
    if value:
        return str(value)
    return None


def parse_json_ld_products(soup: BeautifulSoup) -> list[dict[str, Any]]:
    products: list[dict[str, Any]] = []

    for node in soup.select('script[type="application/ld+json"]'):
        raw = node.string or node.get_text()
        if not raw or not raw.strip():
            continue

        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            continue

        candidates = parsed if isinstance(parsed, list) else [parsed]
        for item in candidates:
            if not isinstance(item, dict) or not _is_product_type(item.get("@type")):
                continue

            offer = item.get("offers")
            price = None

            if isinstance(offer, dict) and offer.get("price") is not None:
                price = parse_price(offer.get("price"))
            elif isinstance(offer, dict) and offer.get("lowPrice") is not None:
                price = parse_price(offer.get("lowPrice"))
            elif isinstance(offer, list):
                for entry in offer:
                    if not isinstance(entry, dict):
                        continue
                    candidate = parse_price(entry.get("price"))
                    if candidate is not None:
                        price = candidate
                        break

            products.append(
                {
                    "title": item.get("name") or None,
                    "price": normalize_number(price),
                    "image": _image_value(item.get("image")),
                    "currency": offer.get("priceCurrency", "BDT") if isinstance(offer, dict) else "BDT",
                }
            )

    return products


def extract_meta_price(soup: BeautifulSoup) -> int | float | None:
    candidates = [
        _content(soup, 'meta[property="product:price:amount"]'),
        _content(soup, 'meta[property="og:price:amount"]'),
        _content(soup, '[itemprop="price"]'),
        _text(soup, '[itemprop="price"]'),
    ]

    for value in candidates:
        parsed = normalize_number(value)
        if parsed is not None:
            return parsed
    return None


def extract_price_from_text(text: str) -> int | float | None:
    matches: list[float] = []
    for match in PRICE_PATTERN.finditer(text or ""):
        parsed = parse_price(match.group(1))
        if parsed is not None and parsed > 10:
            matches.append(parsed)
        if len(matches) >= 10:
            break

    if not matches:
        return None
    return normalize_number(min(matches))


def parse_generic_html(url: str, html: str) -> dict[str, Any]:
    parsed_url = urlsplit(url)
    if not parsed_url.scheme or not parsed_url.netloc:
        raise ValueError("Invalid URL provided.")

    soup = BeautifulSoup(html or "", "html.parser")

    title = (
        _content(soup, 'meta[property="og:title"]')
        or _content(soup, 'meta[name="title"]')
        or _text(soup, "h1")
        or _text(soup, "title")
        or slug_to_title(parsed_url.path)
    )

    description = (
        _content(soup, 'meta[property="og:description"]')
        or _content(soup, 'meta[name="description"]')
        or ""
    )

    image = (
        _content(soup, 'meta[property="og:image"]')
        or _content(soup, 'meta[property="og:image:url"]')
        or None
    )

    json_ld_products = parse_json_ld_products(soup)
    meta_price = extract_meta_price(soup)

    price_text = " ".join(
        [
            _text(soup, ".price"),
            _text(soup, '[class*="price"]'),
            _text(soup, '[id*="price"]'),
            soup.get_text(" ", strip=True)[:10000],
        ]
    )
    text_price = extract_price_from_text(price_text)
    price = json_ld_products[0]["price"] if json_ld_products and json_ld_products[0]["price"] is not None else meta_price or text_price

    products: list[dict[str, Any]] = []

    for product in json_ld_products:
        if product.get("title") and product.get("price") is not None:
            products.append(
                {
                    "title": product["title"],
                    "price": product["price"],
                    "image": product.get("image"),
                    "url": url,
                }
            )

    for selector in CARD_SELECTORS:
        for node in soup.select(selector):
            card_title = (
                _text(node, "h2")
                or _text(node, "h3")
                or _text(node, "h4")
                or _text(node, ".title")
                or _text(node, ".product-name")
                or _text(node, "a[title]")
                or _text(node, ".p-item-name a")
                or (node.select_one("a[title]").get("title", "").strip() if node.select_one("a[title]") else "")
            )

            link_node = node.select_one("a[href]")
            image_node = node.select_one("img")
            card_link = link_node.get("href", "").strip() if link_node else ""
            card_image = ""
            if image_node:
                card_image = image_node.get("src", "").strip() or image_node.get("data-src", "").strip()

            price_node = node.select_one('[class*="price"], .price, .amount')
            card_price_text = price_node.get_text(" ", strip=True) if price_node else node.get_text(" ", strip=True)
            card_price = extract_price_from_text(card_price_text)

            if card_title and card_price is not None:
                products.append(
                    {
                        "title": card_title,
                        "price": card_price,
                        "image": urljoin(url, card_image) if card_image else None,
                        "url": urljoin(url, card_link) if card_link else url,
                    }
                )

        if len(products) > 5:
            break

    logger.info("Generic URL scraped", extra={"url": url, "products_found": len(products)})

    return {
        "url": url,
        "hostname": parsed_url.hostname,
        "title": title,
        "description": description,
        "image": image,
        "price": price,
        "products": products,
    }


def scrape_generic_url(url: str, context: ScraperContext | None = None) -> dict[str, Any]:
    ctx = context or ScraperContext()
    assert ctx.robots_service is not None

    try:
        parsed_url = urlsplit(url)
    except ValueError as exc:
        raise ValueError("Invalid URL provided.") from exc

    if not parsed_url.scheme or not parsed_url.netloc:
        raise ValueError("Invalid URL provided.")

    robots = ctx.robots_service.can_fetch(url)
    if robots.allowed is False:
        raise RuntimeError(f"URL is disallowed by robots policy: {url}")

    try:
        response = ctx.session.get(url, timeout=ctx.config.request_timeout_ms / 1000)
    except requests.RequestException as exc:
        raise RuntimeError(f"Failed to fetch URL ({exc}).") from exc

    if response.status_code < 200 or response.status_code >= 300:
        raise RuntimeError(f"Failed to fetch URL (HTTP {response.status_code}).")

    return parse_generic_html(url, response.text)
