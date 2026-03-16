from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from .base import ScraperConfig, ScraperContext
from .facebook_graph import FacebookGraphScraper
from .generic_url import parse_generic_html, scrape_generic_url
from .startech import StartechScraper, parse_startech_products


def _print_json(data: Any) -> None:
    print(json.dumps(data, ensure_ascii=False, indent=2))


def _load_context(args: argparse.Namespace) -> ScraperContext:
    config = ScraperConfig.from_env()

    if args.user_agent:
        config.user_agent = args.user_agent
    if args.timeout_ms is not None:
        config.request_timeout_ms = args.timeout_ms
    if args.delay_ms is not None:
        config.request_delay_ms = args.delay_ms
    if args.jitter_ms is not None:
        config.request_jitter_ms = args.jitter_ms
    if args.max_pages is not None:
        config.max_pages_per_source = args.max_pages
    if args.max_deals is not None:
        config.max_deals_per_source = args.max_deals
    if getattr(args, "facebook_access_token", None):
        config.facebook_access_token = args.facebook_access_token
    if getattr(args, "facebook_page_ids", None):
        config.facebook_page_ids = tuple(args.facebook_page_ids)

    return ScraperContext(config=config)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Python ports of the existing TypeScript scrapers.")
    parser.add_argument("--timeout-ms", type=int, help="Request timeout in milliseconds.")
    parser.add_argument("--delay-ms", type=int, help="Base delay between requests in milliseconds.")
    parser.add_argument("--jitter-ms", type=int, help="Random delay jitter in milliseconds.")
    parser.add_argument("--max-pages", type=int, help="Maximum pages to scrape per source.")
    parser.add_argument("--max-deals", type=int, help="Maximum deals to return per source.")
    parser.add_argument("--user-agent", help="Override the scraper user-agent header.")

    subparsers = parser.add_subparsers(dest="command", required=True)

    startech = subparsers.add_parser("startech", help="Run the Startech scraper.")
    startech_sub = startech.add_subparsers(dest="action", required=True)

    startech_scrape = startech_sub.add_parser("scrape", help="Scrape the configured Startech categories.")
    startech_scrape.set_defaults(handler=handle_startech_scrape)

    startech_search = startech_sub.add_parser("search", help="Search Startech products by query.")
    startech_search.add_argument("query", help="Search term.")
    startech_search.set_defaults(handler=handle_startech_search)

    startech_parse_file = startech_sub.add_parser("parse-file", help="Parse a saved Startech HTML file.")
    startech_parse_file.add_argument("path", help="Path to the HTML file.")
    startech_parse_file.add_argument("--source", default="startech")
    startech_parse_file.add_argument("--category", default="gadgets")
    startech_parse_file.set_defaults(handler=handle_startech_parse_file)

    generic = subparsers.add_parser("generic-url", help="Scrape a generic product or listing URL.")
    generic.add_argument("url", nargs="?", help="The page URL to scrape.")
    generic.add_argument("--html-file", help="Parse a local HTML file instead of fetching over HTTP.")
    generic.add_argument("--page-url", help="Base URL to use with --html-file.")
    generic.set_defaults(handler=handle_generic_url)

    facebook = subparsers.add_parser("facebook-graph", help="Run the Facebook Graph scraper.")
    facebook.add_argument("--facebook-access-token", help="Graph API access token.")
    facebook.add_argument("--facebook-page-ids", nargs="+", help="One or more Facebook page IDs.")
    facebook.set_defaults(handler=handle_facebook_graph)

    return parser


def handle_startech_scrape(args: argparse.Namespace) -> None:
    context = _load_context(args)
    scraper = StartechScraper(max_deals_per_source=context.config.max_deals_per_source)
    _print_json(scraper.scrape(context))


def handle_startech_search(args: argparse.Namespace) -> None:
    context = _load_context(args)
    scraper = StartechScraper(max_deals_per_source=context.config.max_deals_per_source)
    _print_json(scraper.search_products(args.query, context))


def handle_startech_parse_file(args: argparse.Namespace) -> None:
    html = Path(args.path).read_text(encoding="utf-8")
    _print_json(parse_startech_products(html, source=args.source, category=args.category))


def handle_generic_url(args: argparse.Namespace) -> None:
    if args.html_file:
        if not args.page_url:
            raise SystemExit("--page-url is required when using --html-file.")
        html = Path(args.html_file).read_text(encoding="utf-8")
        _print_json(parse_generic_html(args.page_url, html))
        return

    if not args.url:
        raise SystemExit("A URL is required unless --html-file is used.")

    context = _load_context(args)
    _print_json(scrape_generic_url(args.url, context))


def handle_facebook_graph(args: argparse.Namespace) -> None:
    context = _load_context(args)
    scraper = FacebookGraphScraper(max_deals_per_source=context.config.max_deals_per_source)
    _print_json(scraper.scrape(context))


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    args.handler(args)
    return 0
