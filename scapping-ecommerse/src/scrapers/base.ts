import config from '../config.js';
import { sleep } from '../lib/http.js';
import logger from '../lib/logger.js';

export default class BaseScraper {
  constructor({ source, maxDealsPerSource = config.maxDealsPerSource }) {
    this.source = source;
    this.maxDealsPerSource = maxDealsPerSource;
  }

  async scrape() {
    throw new Error(`Scraper ${this.source} must implement scrape(context)`);
  }

  async delay(ms = config.requestDelayMs, jitterMs = config.requestJitterMs) {
    const jitter = Math.floor(Math.random() * Math.max(jitterMs, 0));
    await sleep(ms + jitter);
  }

  async canFetch(url, context, warnings) {
    const result = await context.robotsService.canFetch(url);
    if (!result.allowed) {
      warnings.push(`Blocked by robots.txt: ${url}`);
    }
    return result;
  }

  toAbsolute(url, fallbackOrigin = '') {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('//')) return `https:${url}`;
    if (fallbackOrigin) {
      return `${fallbackOrigin}${url.startsWith('/') ? '' : '/'}${url}`;
    }
    return url;
  }

  clampDeals(deals) {
    return deals.slice(0, this.maxDealsPerSource);
  }

  logDebug(message, meta) {
    logger.debug(`${this.source}: ${message}`, meta);
  }
}
