import robotsParser from 'robots-parser';
import logger from '../lib/logger.js';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export default class RobotsService {
  constructor({ httpClient, userAgent, cacheTtlMs = ONE_DAY_MS } = {}) {
    this.httpClient = httpClient;
    this.userAgent = userAgent || '*';
    this.cacheTtlMs = cacheTtlMs;
    this.cache = new Map();
  }

  async getRules(url) {
    let origin;
    try {
      origin = new URL(url).origin;
    } catch {
      return {
        known: false,
        parser: null,
        robotsUrl: null,
        reason: 'invalid_url'
      };
    }

    const now = Date.now();
    const cached = this.cache.get(origin);
    if (cached && cached.expiresAt > now) {
      return cached;
    }

    const robotsUrl = `${origin}/robots.txt`;
    const entry = {
      known: false,
      parser: null,
      robotsUrl,
      reason: 'robots_unknown',
      expiresAt: now + this.cacheTtlMs
    };

    try {
      const response = await this.httpClient.get(robotsUrl);
      const text = typeof response.data === 'string' ? response.data : '';
      const looksLikeRobots = /user-agent\s*:/i.test(text);

      if (response.status >= 200 && response.status < 300 && looksLikeRobots) {
        entry.parser = robotsParser(robotsUrl, text);
        entry.known = true;
        entry.reason = 'robots_loaded';
      } else {
        entry.reason = 'robots_unavailable';
      }
    } catch (error) {
      entry.reason = 'robots_fetch_failed';
      logger.warn('Failed to fetch robots.txt', {
        robotsUrl,
        error: error.message
      });
    }

    this.cache.set(origin, entry);
    return entry;
  }

  async canFetch(url) {
    const rules = await this.getRules(url);
    if (!rules.known || !rules.parser) {
      return {
        allowed: true,
        reason: rules.reason,
        robotsUrl: rules.robotsUrl
      };
    }

    const verdict = rules.parser.isAllowed(url, this.userAgent);
    const allowed = verdict !== false;

    return {
      allowed,
      reason: allowed ? 'allowed' : 'disallowed',
      robotsUrl: rules.robotsUrl
    };
  }
}
