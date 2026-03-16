# Live BD Deals Scraper (Express + EJS, No DB)

Node.js + TypeScript web app that scrapes live discounted gadgets and grocery deals from Bangladeshi sources and renders them in a clean webpage.

## Features

- Sources: Daraz, Pickaboo, Ryans, Startech, Chaldal, Shwapno, optional Facebook Graph API
- No database: data is live-scraped and cached in memory for 15 minutes
- SSR homepage + JSON API
- URL-based cross-site price comparison (`/api/compare`)
- Source/website + query finder with cross-site alternatives (`/api/source-search`)
- Per-source status and warnings (ok/partial/blocked/timeout/error)
- Filter by category/source/search/sort
- Manual protected refresh endpoint
- Render-ready deployment config

## Tech Stack

- Node.js + TypeScript + Express
- EJS templating
- Axios + Cheerio
- Puppeteer for challenge/dynamic pages
- node-cron for periodic refresh
- In-memory cache only

## Project Structure

```text
src/
  app.ts
  server.ts
  config.ts
  routes/
  services/
  scrapers/
  lib/
  views/
  public/
tests/
  unit/
  integration/
  fixtures/
```

## Setup (Local)

1. Install dependencies:

```bash
pnpm install
```

2. Copy env file:

```bash
cp .env.example .env
```

3. Update required values in `.env`:

- `REFRESH_TOKEN`
- Optional: `FACEBOOK_ACCESS_TOKEN`, `FACEBOOK_PAGE_IDS`

4. Run in development:

```bash
pnpm dev
```

5. Open:

- Web: `http://localhost:3000/`
- API: `http://localhost:3000/api/deals`
- Health: `http://localhost:3000/health`

## API

### `GET /api/deals`

Query params:

- `category=all|gadgets|grocery`
- `source=daraz,startech,...`
- `q=<search text>`
- `sort=discount|price_asc|price_desc|latest`
- `page=<number>`
- `perPage=<number>`

Returns:

- `meta`
- `sources[]`
- `deals[]`

### `POST /api/refresh?token=YOUR_REFRESH_TOKEN`

Forces a fresh scrape and updates cache.

### `GET /api/compare?url=PRODUCT_URL`

Compares one input product URL against currently scraped deals across sources.

Optional query:

- `refresh=1` to force a fresh scrape before comparing.

### `GET /api/source-search?sourceOrWebsite=...&q=...`

Find products by query from a specific source/website (or all sources), then compare each seed with alternatives from other websites.

Optional query:

- `limit=8` max matched seeds returned (1-20)
- `refresh=1` to force a fresh scrape before searching

### `GET /health`

Returns service and cache status.

## Robots and Compliance

- `robots.txt` is checked per source/domain.
- Explicitly disallowed URLs are skipped.
- If robots cannot be reliably loaded, scraper proceeds cautiously and reports warning.
- Shwapno strict mode may produce limited/no deals because `/api*` is disallowed.

## Deployment (Render Free)

### Option A: Using `render.yaml`

1. Push this repository to GitHub.
2. In Render: **New +** -> **Blueprint**.
3. Select repo.
4. Render reads `render.yaml` automatically.
5. Set secret env vars in Render dashboard:
   - `REFRESH_TOKEN`
   - Optional Facebook vars

### Option B: Manual Render setup

- Environment: `Node`
- Build command: `pnpm install --frozen-lockfile`
- Start command: `pnpm start`
- Health check path: `/health`
- Add env vars from `.env.example`

## Free-host Puppeteer notes

This app uses:

- `--no-sandbox`
- `--disable-setuid-sandbox`

via `PUPPETEER_ARGS`, required for many free-tier Linux containers.

## Running Tests

```bash
pnpm test
```

## Python Port

The repo now also includes standalone Python versions of the current `startech`, `generic-url`, and `facebook-graph` scrapers under `python_scrapers/`.

Run them with `uv`:

```bash
pnpm py -- startech scrape
```

Example commands:

```bash
pnpm py:startech
pnpm py -- startech search "laptop"
pnpm py -- generic-url "https://www.startech.com.bd/sample-product"
pnpm py -- generic-url --html-file tests/fixtures/startech-sample.html --page-url "https://www.startech.com.bd/sample-laptop"
pnpm py:facebook
```

`uv` resolves `requirements.txt` on each run via `--with-requirements`, so you do not need a separate `pip install` step.

The Python output shape mirrors the existing TypeScript scrapers: normalized BDT deal objects with `id`, `title`, `priceCurrent`, `priceOriginal`, `discountPercent`, `productUrl`, `imageUrl`, and `scrapedAt`.

## Known Limitations

- Ryans may be intermittently blocked by Cloudflare challenge.
- Shwapno strict robots policy can limit real-time extraction.
- Facebook scraping requires valid Graph API token + page IDs.
