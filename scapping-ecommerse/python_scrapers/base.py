from __future__ import annotations

import os
import random
import time
from dataclasses import dataclass, field
from typing import Sequence

import requests

from .robots import RobotsCheck, RobotsService

DEFAULT_USER_AGENT = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/123 Safari/537.36"
)


def _env_int(name: str, default: int) -> int:
    value = os.getenv(name)
    if value in (None, ""):
        return default

    try:
        return int(value)
    except ValueError:
        return default


def _env_list(name: str) -> tuple[str, ...]:
    raw = os.getenv(name, "")
    if not raw:
        return ()
    return tuple(item.strip() for item in raw.split(",") if item.strip())


@dataclass(slots=True)
class ScraperConfig:
    user_agent: str = DEFAULT_USER_AGENT
    request_timeout_ms: int = 15000
    request_delay_ms: int = 900
    request_jitter_ms: int = 300
    max_pages_per_source: int = 5
    max_deals_per_source: int = 50
    facebook_access_token: str = ""
    facebook_page_ids: Sequence[str] = ()

    @classmethod
    def from_env(cls) -> "ScraperConfig":
        return cls(
            user_agent=os.getenv("SCRAPER_USER_AGENT", DEFAULT_USER_AGENT),
            request_timeout_ms=_env_int("REQUEST_TIMEOUT_MS", 15000),
            request_delay_ms=_env_int("REQUEST_DELAY_MS", 900),
            request_jitter_ms=_env_int("REQUEST_JITTER_MS", 300),
            max_pages_per_source=_env_int("MAX_PAGES_PER_SOURCE", 5),
            max_deals_per_source=_env_int("MAX_DEALS_PER_SOURCE", 50),
            facebook_access_token=os.getenv("FACEBOOK_ACCESS_TOKEN", ""),
            facebook_page_ids=_env_list("FACEBOOK_PAGE_IDS"),
        )


@dataclass(slots=True)
class ScraperContext:
    config: ScraperConfig = field(default_factory=ScraperConfig.from_env)
    session: requests.Session = field(default_factory=requests.Session)
    robots_service: RobotsService | None = None

    def __post_init__(self) -> None:
        self.session.headers.setdefault("User-Agent", self.config.user_agent)
        self.session.headers.setdefault("Accept-Language", "en-US,en;q=0.9")

        if self.robots_service is None:
            self.robots_service = RobotsService(
                session=self.session,
                user_agent=self.config.user_agent,
                timeout_seconds=self.config.request_timeout_ms / 1000,
            )


class BaseScraper:
    def __init__(self, source: str, max_deals_per_source: int | None = None):
        self.source = source
        self.max_deals_per_source = max_deals_per_source

    def scrape(self, context: ScraperContext) -> dict:
        raise NotImplementedError(f"Scraper {self.source} must implement scrape(context)")

    def delay(self, config: ScraperConfig) -> None:
        jitter = random.randint(0, max(config.request_jitter_ms, 0))
        time.sleep((config.request_delay_ms + jitter) / 1000)

    def can_fetch(self, url: str, context: ScraperContext, warnings: list[str]) -> RobotsCheck:
        assert context.robots_service is not None
        result = context.robots_service.can_fetch(url)

        if result.warning:
            warnings.append(result.warning)
        if not result.allowed:
            warnings.append(f"Blocked by robots.txt: {url}")

        return result

    @staticmethod
    def to_absolute(url: str | None, fallback_origin: str = "") -> str | None:
        if not url:
            return None
        if url.startswith(("http://", "https://")):
            return url
        if url.startswith("//"):
            return f"https:{url}"
        if fallback_origin:
            return f"{fallback_origin}{'' if url.startswith('/') else '/'}{url}"
        return url

    def clamp_deals(self, deals: list[dict], max_deals: int | None = None) -> list[dict]:
        limit = max_deals if max_deals is not None else self.max_deals_per_source
        return deals[:limit] if limit else deals
