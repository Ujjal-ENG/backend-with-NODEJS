from __future__ import annotations

from dataclasses import dataclass
from typing import Any
from urllib.parse import urlsplit
from urllib.robotparser import RobotFileParser

import requests


@dataclass(slots=True)
class RobotsCheck:
    allowed: bool
    warning: str | None = None


class RobotsService:
    def __init__(self, session: requests.Session, user_agent: str, timeout_seconds: float = 15.0):
        self.session = session
        self.user_agent = user_agent
        self.timeout_seconds = timeout_seconds
        self._cache: dict[str, tuple[RobotFileParser | None, str | None]] = {}

    def can_fetch(self, url: str) -> RobotsCheck:
        parsed = urlsplit(url)
        origin = f"{parsed.scheme}://{parsed.netloc}"

        if origin not in self._cache:
            self._cache[origin] = self._load_parser(origin)

        parser, warning = self._cache[origin]
        if parser is None:
            return RobotsCheck(allowed=True, warning=warning)

        try:
            allowed = parser.can_fetch(self.user_agent, url)
        except Exception:
            return RobotsCheck(
                allowed=True,
                warning=warning or f"Robots parsing failed for {origin}; proceeding cautiously.",
            )

        return RobotsCheck(allowed=bool(allowed), warning=warning)

    def _load_parser(self, origin: str) -> tuple[RobotFileParser | None, str | None]:
        robots_url = f"{origin}/robots.txt"
        parser = RobotFileParser()
        parser.set_url(robots_url)

        try:
            response = self.session.get(
                robots_url,
                timeout=self.timeout_seconds,
                headers={"Accept": "text/plain,*/*;q=0.1"},
            )
        except requests.RequestException as exc:
            return None, f"Robots check failed for {robots_url}: {exc}; proceeding cautiously."

        if response.status_code == 404:
            parser.parse([])
            return parser, None

        if response.status_code < 200 or response.status_code >= 300:
            return (
                None,
                f"Robots check failed for {robots_url} (HTTP {response.status_code}); proceeding cautiously.",
            )

        parser.parse(response.text.splitlines())
        return parser, None
