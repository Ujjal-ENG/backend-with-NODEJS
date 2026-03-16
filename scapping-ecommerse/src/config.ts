import process from 'node:process';

export const SOURCE_NAMES = [
  'daraz',
  'pickaboo',
  'ryans',
  'startech',
  'chaldal',
  'shwapno',
  'facebook'
];

const DEFAULT_PUPPETEER_ARGS = ['--no-sandbox', '--disable-setuid-sandbox'];

function toInt(value, fallback) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const parsed = Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function toBool(value, fallback = false) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

function toList(value) {
  if (!value) return [];
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

const config = {
  appName: 'Live BD Deals Scraper',
  env: process.env.NODE_ENV || 'development',
  port: toInt(process.env.PORT, 3000),
  timezone: process.env.APP_TIMEZONE || 'Asia/Dhaka',
  userAgent:
    process.env.SCRAPER_USER_AGENT ||
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36',

  cacheTtlMinutes: toInt(process.env.CACHE_TTL_MINUTES, 15),
  scrapeTimeoutMs: toInt(process.env.SCRAPE_TIMEOUT_MS, 45000),
  sourceTimeoutMs: toInt(process.env.SOURCE_TIMEOUT_MS, 18000),
  requestTimeoutMs: toInt(process.env.REQUEST_TIMEOUT_MS, 15000),
  requestDelayMs: toInt(process.env.REQUEST_DELAY_MS, 900),
  requestJitterMs: toInt(process.env.REQUEST_JITTER_MS, 300),
  scrapeConcurrency: toInt(process.env.SCRAPE_CONCURRENCY, 2),
  maxPagesPerSource: toInt(process.env.MAX_PAGES_PER_SOURCE, 5),
  maxDealsPerSource: toInt(process.env.MAX_DEALS_PER_SOURCE, 50),
  compareMinScore: Number.parseFloat(process.env.COMPARE_MIN_SCORE || '0.35'),
  compareMaxResults: toInt(process.env.COMPARE_MAX_RESULTS, 20),
  searchMinScore: Number.parseFloat(process.env.SEARCH_MIN_SCORE || '0.2'),
  searchMaxResults: toInt(process.env.SEARCH_MAX_RESULTS, 8),

  refreshToken: process.env.REFRESH_TOKEN || '',
  enableBackgroundRefresh: toBool(process.env.ENABLE_BACKGROUND_REFRESH, true),

  puppeteerArgs:
    toList(process.env.PUPPETEER_ARGS).length > 0
      ? toList(process.env.PUPPETEER_ARGS)
      : DEFAULT_PUPPETEER_ARGS,
  puppeteerExecutablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '',

  facebookAccessToken: process.env.FACEBOOK_ACCESS_TOKEN || '',
  facebookPageIds: toList(process.env.FACEBOOK_PAGE_IDS),

  sourceNames: SOURCE_NAMES
};

export default config;
