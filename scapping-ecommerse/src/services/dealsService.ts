import config from '../config.js';
import logger from '../lib/logger.js';
import { filterDeals, sortDeals } from '../lib/normalize.js';

export default class DealsService {
  constructor({ cacheService, scrapeCoordinator, configOverride = config } = {}) {
    this.cacheService = cacheService;
    this.scrapeCoordinator = scrapeCoordinator;
    this.config = configOverride;
    this.refreshInFlight = null;
  }

  getDefaultFilter(rawFilter = {}) {
    return {
      category: rawFilter.category || 'all',
      source: rawFilter.source || '',
      q: rawFilter.q || '',
      sort: rawFilter.sort || 'discount',
      page: Math.max(Number.parseInt(rawFilter.page || '1', 10), 1),
      perPage: Math.min(
        Math.max(Number.parseInt(rawFilter.perPage || '120', 10), 1),
        250
      )
    };
  }

  applyFilterAndPagination(payload, filter) {
    const filtered = filterDeals(payload.deals, filter);
    const sorted = sortDeals(filtered, filter.sort);

    const start = (filter.page - 1) * filter.perPage;
    const paged = sorted.slice(start, start + filter.perPage);

    return {
      total: sorted.length,
      deals: paged
    };
  }

  buildResponse({ payload, fromCache, filter }) {
    const cacheAgeSec = this.cacheService.getAgeSeconds();
    const { total, deals } = this.applyFilterAndPagination(payload, filter);

    return {
      meta: {
        generatedAt: payload.generatedAt,
        fromCache,
        cacheAgeSec,
        filter,
        totalDeals: total,
        page: filter.page,
        perPage: filter.perPage,
        totalPages: Math.max(Math.ceil(total / filter.perPage), 1)
      },
      sources: payload.sources,
      deals
    };
  }

  async refreshNow(context) {
    const payload = await this.scrapeCoordinator.scrapeAll(context);
    this.cacheService.set(payload);
    return payload;
  }

  triggerBackgroundRefresh(context) {
    if (this.refreshInFlight) return;

    this.refreshInFlight = this.refreshNow(context)
      .then(() => {
        logger.info('Background refresh completed');
      })
      .catch((error) => {
        logger.warn('Background refresh failed', { error: error.message });
      })
      .finally(() => {
        this.refreshInFlight = null;
      });
  }

  async getDeals({ filter = {}, forceRefresh = false, context }) {
    const normalizedFilter = this.getDefaultFilter(filter);
    const { payload, fromCache } = await this.getRawPayload({ context, forceRefresh });
    return this.buildResponse({ payload, fromCache, filter: normalizedFilter });
  }

  async getRawPayload({ context, forceRefresh = false }) {
    if (forceRefresh) {
      const payload = await this.refreshNow(context);
      return { payload, fromCache: false };
    }

    const cacheEntry = this.cacheService.get();
    if (cacheEntry && this.cacheService.isFresh()) {
      return { payload: cacheEntry.payload, fromCache: true };
    }

    if (cacheEntry && !this.cacheService.isFresh()) {
      this.triggerBackgroundRefresh(context);
      return { payload: cacheEntry.payload, fromCache: true };
    }

    const payload = await this.refreshNow(context);
    return { payload, fromCache: false };
  }

  getHealth() {
    const cache = this.cacheService.get();
    return {
      status: 'ok',
      cacheAvailable: Boolean(cache),
      cacheFresh: this.cacheService.isFresh(),
      cacheAgeSec: this.cacheService.getAgeSeconds(),
      lastScrapedAt: cache?.payload?.generatedAt || null,
      refreshInFlight: Boolean(this.refreshInFlight)
    };
  }
}
