from __future__ import annotations

import re
from typing import Any

import requests

from .base import BaseScraper, ScraperContext
from .common import normalize_deal

DISCOUNT_PATTERN = re.compile(r"(discount|offer|sale|off|deal|save)", re.IGNORECASE)


def extract_price(text: str) -> int | None:
    if not text:
        return None

    match = re.search(r"(?:৳|Tk|BDT)?\s*([0-9]{2,7})", str(text), re.IGNORECASE)
    if not match:
        return None

    try:
        parsed = int(match.group(1))
    except ValueError:
        return None
    return parsed


class FacebookGraphScraper(BaseScraper):
    def __init__(self, max_deals_per_source: int | None = None):
        super().__init__(source="facebook", max_deals_per_source=max_deals_per_source)

    def scrape(self, context: ScraperContext) -> dict[str, Any]:
        warnings: list[str] = []
        deals: list[dict[str, Any]] = []

        token = context.config.facebook_access_token
        page_ids = list(context.config.facebook_page_ids or [])

        if not token or not page_ids:
            warnings.append(
                "Facebook integration not configured (FACEBOOK_ACCESS_TOKEN / FACEBOOK_PAGE_IDS)."
            )
            return {
                "status": "partial",
                "warnings": warnings,
                "deals": deals,
            }

        for page_id in page_ids:
            url = f"https://graph.facebook.com/v21.0/{page_id}/posts"
            params = {
                "fields": "message,permalink_url,created_time,full_picture",
                "limit": "20",
                "access_token": token,
            }

            self.delay(context.config)

            try:
                response = context.session.get(
                    url,
                    params=params,
                    timeout=context.config.request_timeout_ms / 1000,
                    headers={"Accept": "application/json"},
                )
            except requests.RequestException as exc:
                warnings.append(f"Facebook Graph API failed ({exc}) for page {page_id}")
                continue

            if response.status_code < 200 or response.status_code >= 300:
                warnings.append(f"Facebook Graph API failed ({response.status_code}) for page {page_id}")
                continue

            try:
                posts = response.json().get("data") or []
            except ValueError:
                warnings.append(f"Facebook Graph API returned invalid JSON for page {page_id}")
                continue

            for post in posts:
                if not isinstance(post, dict):
                    continue

                message = post.get("message") or ""
                if not DISCOUNT_PATTERN.search(message):
                    continue

                price = extract_price(message)
                deal = normalize_deal(
                    {
                        "source": self.source,
                        "category": "gadgets",
                        "title": message[:120] or f"Deal from {page_id}",
                        "priceCurrent": price or 1,
                        "priceOriginal": None,
                        "discountLabel": "facebook-offer",
                        "imageUrl": post.get("full_picture") or None,
                        "productUrl": post.get("permalink_url"),
                        "scrapedAt": post.get("created_time"),
                    }
                )

                if deal:
                    deals.append(deal)

        return {
            "status": "partial" if warnings else "ok",
            "warnings": warnings,
            "deals": self.clamp_deals(deals, context.config.max_deals_per_source),
        }
