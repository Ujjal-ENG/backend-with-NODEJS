from __future__ import annotations

import hashlib
import math
import re
from datetime import datetime, timezone
from typing import Any, Mapping
from urllib.parse import urlsplit, urlunsplit

CURRENCY_BDT = "BDT"
DISCOUNT_LIKE_PATTERN = re.compile(r"(discount|offer|sale|off|deal|save)", re.IGNORECASE)


def _clean_text(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def _normalize_number(value: float | None) -> int | float | None:
    if value is None or not math.isfinite(value):
        return None
    return int(value) if value.is_integer() else value


def normalize_price_object(value: Any) -> float | None:
    if not isinstance(value, Mapping):
        return None

    raw = value.get("Lo")
    if isinstance(raw, (int, float)) and math.isfinite(raw):
        return float(raw)
    return None


def parse_price(value: Any) -> float | None:
    if value in (None, ""):
        return None

    if isinstance(value, (int, float)):
        return float(value) if math.isfinite(value) else None

    from_object = normalize_price_object(value)
    if from_object is not None:
        return from_object

    text = re.sub(r"[^0-9.]", "", str(value).replace(",", ""))
    if not text:
        return None

    try:
        parsed = float(text)
    except ValueError:
        return None
    return parsed if math.isfinite(parsed) else None


def calc_discount_percent(current: Any, original: Any) -> int | None:
    current_price = parse_price(current)
    original_price = parse_price(original)

    if current_price is None or original_price is None:
        return None
    if current_price <= 0 or original_price <= 0 or original_price <= current_price:
        return None

    return round(((original_price - current_price) / original_price) * 100)


def normalize_url(url: Any) -> str | None:
    if not url:
        return None

    try:
        parsed = urlsplit(str(url))
    except ValueError:
        return None

    if not parsed.scheme or not parsed.netloc:
        return None

    return urlunsplit((parsed.scheme, parsed.netloc, parsed.path, parsed.query, ""))


def _create_id(source: str, product_url: str | None, title: str) -> str:
    stable = f"{source}|{product_url or ''}|{title or ''}"
    return hashlib.sha1(stable.encode("utf-8")).hexdigest()[:16]


def _to_iso_timestamp(value: Any) -> str:
    if isinstance(value, datetime):
        dt = value
    elif value:
        text = str(value).strip()
        if text.endswith("Z"):
            text = f"{text[:-1]}+00:00"

        try:
            dt = datetime.fromisoformat(text)
        except ValueError:
            dt = datetime.now(timezone.utc)
    else:
        dt = datetime.now(timezone.utc)

    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)

    return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def is_discount_like(raw_discount_label: Any = "") -> bool:
    return bool(DISCOUNT_LIKE_PATTERN.search(str(raw_discount_label or "")))


def normalize_deal(raw: Mapping[str, Any]) -> dict[str, Any] | None:
    source = _clean_text(raw.get("source")).lower()
    title = _clean_text(raw.get("title"))
    product_url = normalize_url(raw.get("productUrl"))
    category = "grocery" if raw.get("category") == "grocery" else "gadgets"

    if not source or not title or not product_url:
        return None

    price_current = parse_price(raw.get("priceCurrent"))
    maybe_original = parse_price(raw.get("priceOriginal"))
    price_original = (
        maybe_original
        if maybe_original is not None
        and price_current is not None
        and maybe_original > price_current
        else None
    )

    if price_current is None or price_current <= 0:
        return None

    raw_discount_percent = parse_price(raw.get("discountPercent"))
    derived_discount = calc_discount_percent(price_current, price_original)
    if raw_discount_percent is not None and raw_discount_percent > 0:
        discount_percent: int | None = round(raw_discount_percent)
    else:
        discount_percent = derived_discount

    discount_label = _clean_text(raw.get("discountLabel") or "") or None

    return {
        "id": _create_id(source, product_url, title),
        "title": title,
        "category": category,
        "source": source,
        "priceCurrent": _normalize_number(price_current),
        "priceOriginal": _normalize_number(price_original),
        "discountPercent": discount_percent,
        "discountLabel": discount_label,
        "currency": CURRENCY_BDT,
        "imageUrl": raw.get("imageUrl") or None,
        "productUrl": product_url,
        "scrapedAt": _to_iso_timestamp(raw.get("scrapedAt")),
    }


def is_discounted(deal: Mapping[str, Any] | None) -> bool:
    if not deal:
        return False

    discount_percent = deal.get("discountPercent")
    price_original = deal.get("priceOriginal")
    price_current = deal.get("priceCurrent")

    if isinstance(discount_percent, (int, float)) and discount_percent > 0:
        return True
    if (
        isinstance(price_original, (int, float))
        and isinstance(price_current, (int, float))
        and price_original > price_current
    ):
        return True
    return is_discount_like(deal.get("discountLabel"))


def normalize_number(value: Any) -> int | float | None:
    parsed = parse_price(value)
    return _normalize_number(parsed)
