import pLimit from 'p-limit';
import config from '../config.js';
import logger from '../lib/logger.js';
import { dedupeDeals } from '../lib/normalize.js';

function createTimeoutError(timeoutMs) {
  const error = new Error(`Scrape timeout after ${timeoutMs}ms`);
  error.code = 'ETIMEDOUT';
  return error;
}

function withTimeout(task, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(createTimeoutError(timeoutMs)), timeoutMs);
    task
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

export default class ScrapeCoordinator {
  constructor({ scrapers, sourceTimeoutMs = config.sourceTimeoutMs, scrapeConcurrency = config.scrapeConcurrency }) {
    this.scrapers = scrapers;
    this.sourceTimeoutMs = sourceTimeoutMs;
    this.scrapeConcurrency = scrapeConcurrency;
  }

  async scrapeAll(context) {
    const startedAt = Date.now();
    const limit = pLimit(this.scrapeConcurrency);

    const sourceRuns = this.scrapers.map((scraper) =>
      limit(async () => {
        const sourceStartedAt = Date.now();
        try {
          const result = await withTimeout(
            scraper.scrape(context),
            this.sourceTimeoutMs
          );

          const deals = Array.isArray(result?.deals) ? result.deals : [];
          const warnings = Array.isArray(result?.warnings) ? result.warnings : [];
          const status = result?.status || (warnings.length > 0 ? 'partial' : 'ok');

          return {
            source: scraper.source,
            status,
            count: deals.length,
            durationMs: Date.now() - sourceStartedAt,
            warnings,
            deals
          };
        } catch (error) {
          const isTimeout = error.code === 'ETIMEDOUT';
          const status = isTimeout ? 'timeout' : 'error';
          logger.warn(`Source scrape failed: ${scraper.source}`, {
            error: error.message,
            status
          });
          return {
            source: scraper.source,
            status,
            count: 0,
            durationMs: Date.now() - sourceStartedAt,
            warnings: [error.message],
            deals: []
          };
        }
      })
    );

    const sourceResults = await Promise.all(sourceRuns);
    const allDeals = dedupeDeals(sourceResults.flatMap((source) => source.deals));

    return {
      generatedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      sources: sourceResults.map(({ deals, ...status }) => status),
      deals: allDeals
    };
  }
}
