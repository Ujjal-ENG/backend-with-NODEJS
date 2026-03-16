import * as cheerio from 'cheerio';
import logger from '../lib/logger.js';
import { parsePrice, calcDiscountPercent } from '../lib/money.js';

const STOP_WORDS = new Set([
  'the',
  'and',
  'with',
  'for',
  'from',
  'inch',
  'inches',
  'official',
  'original',
  'bangladesh',
  'bd',
  'price',
  'new',
  'best',
  'offer',
  'sale'
]);

function mapDomainToSource(hostname = '') {
  const host = hostname.toLowerCase();
  if (host.includes('daraz')) return 'daraz';
  if (host.includes('pickaboo')) return 'pickaboo';
  if (host.includes('ryans')) return 'ryans';
  if (host.includes('startech')) return 'startech';
  if (host.includes('chaldal')) return 'chaldal';
  if (host.includes('shwapno')) return 'shwapno';
  if (host.includes('facebook')) return 'facebook';
  return 'unknown';
}

function tokenize(text = '') {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2)
    .filter((token) => !STOP_WORDS.has(token));
}

function overlapScore(seedTokens, candidateTokens) {
  if (seedTokens.length === 0 || candidateTokens.length === 0) return 0;
  const seedSet = new Set(seedTokens);
  const candSet = new Set(candidateTokens);

  let overlap = 0;
  for (const token of seedSet) {
    if (candSet.has(token)) overlap += 1;
  }

  const score = overlap / Math.max(seedSet.size, 1);
  return Number(score.toFixed(3));
}

function slugToTitle(pathname = '') {
  const slug = pathname
    .split('/')
    .filter(Boolean)
    .pop();

  if (!slug) return 'Unknown Product';
  return decodeURIComponent(slug)
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseJsonLdPrice($) {
  let price = null;
  $('script[type="application/ld+json"]').each((_, node) => {
    if (price) return;
    const raw = $(node).contents().text();
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      const candidates = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of candidates) {
        const offer = item?.offers;
        if (offer?.price !== undefined) {
          price = parsePrice(offer.price);
          if (price) return;
        }
        if (Array.isArray(offer)) {
          for (const entry of offer) {
            const p = parsePrice(entry?.price);
            if (p) {
              price = p;
              return;
            }
          }
        }
      }
    } catch {
      // Ignore malformed JSON-LD blocks.
    }
  });

  return price;
}

function pickLowestPrice(values = []) {
  const parsed = values
    .map((value) => parsePrice(value))
    .filter((num) => Number.isFinite(num) && num > 0);
  if (parsed.length === 0) return null;
  return Math.min(...parsed);
}

export default class PriceCompareService {
  constructor({ dealsService, configOverride } = {}) {
    this.dealsService = dealsService;
    this.config = configOverride;
  }

  async scrapeSeedProduct(productUrl, context) {
    let parsedUrl;
    try {
      parsedUrl = new URL(productUrl);
    } catch {
      throw new Error('Please provide a valid product URL.');
    }

    const robots = await context.robotsService.canFetch(parsedUrl.toString());
    if (robots.allowed === false) {
      throw new Error(`URL is disallowed by robots policy: ${parsedUrl.toString()}`);
    }

    const response = await context.httpClient.get(parsedUrl.toString());
    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Failed to fetch URL (${response.status}).`);
    }

    const html = String(response.data || '');
    const $ = cheerio.load(html);

    const title =
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="title"]').attr('content') ||
      $('h1').first().text().trim() ||
      $('title').first().text().trim() ||
      slugToTitle(parsedUrl.pathname);

    const semanticPrice = pickLowestPrice([
      $('meta[property="product:price:amount"]').attr('content'),
      $('meta[property="og:price:amount"]').attr('content'),
      $('[itemprop="price"]').first().attr('content'),
      $('[itemprop="price"]').first().text()
    ]);

    const jsonLdPrice = parseJsonLdPrice($);

    const priceText = [
      $('.price').first().text(),
      $('[class*="price"]').first().text(),
      $('[id*="price"]').first().text(),
      $('body').text().slice(0, 8000)
    ].join(' ');

    const priceRegex = /(?:৳|tk|bdt)\s*([0-9,]+(?:\.[0-9]+)?)/gi;
    const matches = [];
    let match;
    while ((match = priceRegex.exec(priceText)) !== null && matches.length < 5) {
      matches.push(match[1]);
    }

    const fallbackPrice = pickLowestPrice(matches);

    const priceCurrent = semanticPrice || jsonLdPrice || fallbackPrice || null;

    return {
      source: mapDomainToSource(parsedUrl.hostname),
      url: parsedUrl.toString(),
      title,
      priceCurrent
    };
  }

  selectBestPerSource(candidates = []) {
    const bySource = new Map();

    for (const item of candidates) {
      const existing = bySource.get(item.source);
      if (!existing) {
        bySource.set(item.source, item);
        continue;
      }

      if (item.score > existing.score) {
        bySource.set(item.source, item);
        continue;
      }

      if (item.score === existing.score && item.priceCurrent < existing.priceCurrent) {
        bySource.set(item.source, item);
      }
    }

    return Array.from(bySource.values()).sort((a, b) => a.priceCurrent - b.priceCurrent);
  }

  async compareByUrl({ productUrl, context, forceRefresh = false } = {}) {
    if (!productUrl) {
      throw new Error('Missing URL.');
    }

    const seed = await this.scrapeSeedProduct(productUrl, context);
    const raw = await this.dealsService.getRawPayload({
      context,
      forceRefresh
    });
    const payload = raw.payload;

    const seedTokens = tokenize(seed.title);
    const minScore = Number(this.config?.compareMinScore || 0.35);

    const scored = payload.deals
      .map((deal) => {
        const score = overlapScore(seedTokens, tokenize(deal.title));
        const titleContains = deal.title.toLowerCase().includes(seed.title.toLowerCase().slice(0, 18));
        if (score < minScore && !titleContains) return null;

        return {
          ...deal,
          score
        };
      })
      .filter(Boolean);

    const compared = this.selectBestPerSource(scored).slice(
      0,
      Number(this.config?.compareMaxResults || 20)
    );
    const bestMatch = compared[0] || null;

    const seedPrice = Number.isFinite(seed.priceCurrent) ? seed.priceCurrent : null;
    const savingAmount =
      seedPrice && bestMatch ? Math.max(seedPrice - bestMatch.priceCurrent, 0) : null;
    const savingPercent =
      seedPrice && savingAmount
        ? calcDiscountPercent(bestMatch.priceCurrent, seedPrice)
        : null;

    logger.info('Price comparison computed', {
      seedUrl: seed.url,
      seedSource: seed.source,
      comparedCount: compared.length
    });

    return {
      meta: {
        generatedAt: payload.generatedAt,
        fromCache: raw.fromCache,
        compareCount: compared.length,
        forceRefresh
      },
      seed,
      bestMatch,
      savings: {
        amount: savingAmount,
        percent: savingPercent
      },
      compared
    };
  }
}
