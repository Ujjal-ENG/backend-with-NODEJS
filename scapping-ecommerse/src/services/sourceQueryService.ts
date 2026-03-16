import { calcDiscountPercent } from '../lib/money.js';

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

const KNOWN_SOURCES = ['daraz', 'pickaboo', 'ryans', 'startech', 'chaldal', 'shwapno', 'facebook'];
const SOURCE_HOST_MAP = {
  daraz: ['daraz.com.bd', 'daraz'],
  pickaboo: ['pickaboo.com'],
  ryans: ['ryans.com'],
  startech: ['startech.com.bd', 'startech'],
  chaldal: ['chaldal.com'],
  shwapno: ['shwapno.com', 'shwapno'],
  facebook: ['facebook.com', 'fb.com']
};

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

  return Number((overlap / Math.max(seedSet.size, 1)).toFixed(3));
}

function mapHostToSource(hostname = '') {
  const host = String(hostname || '').toLowerCase();
  if (!host) return null;

  for (const [source, hostPatterns] of Object.entries(SOURCE_HOST_MAP)) {
    if (hostPatterns.some((pattern) => host.includes(pattern))) {
      return source;
    }
  }

  return null;
}

function parseSourceHost(input = '') {
  const trimmed = String(input || '').trim().toLowerCase();
  if (!trimmed) return null;

  try {
    const directUrl = new URL(trimmed);
    return directUrl.hostname.toLowerCase();
  } catch {
    // keep trying with https prefix
  }

  try {
    const prefixed = new URL(`https://${trimmed.replace(/^\/+/, '')}`);
    return prefixed.hostname.toLowerCase();
  } catch {
    return null;
  }
}

function resolveSourceFromInput(sourceOrWebsite = '') {
  const input = String(sourceOrWebsite || '').trim().toLowerCase();
  if (!input) return null;

  const normalizedInput = input.replace(/\s+/g, '');
  if (KNOWN_SOURCES.includes(normalizedInput)) {
    return normalizedInput;
  }

  const host = parseSourceHost(input);
  if (host) {
    return mapHostToSource(host);
  }

  return null;
}

function selectBestPerSource(candidates = []) {
  const map = new Map();

  for (const item of candidates) {
    const existing = map.get(item.source);
    if (!existing) {
      map.set(item.source, item);
      continue;
    }

    if (item.score > existing.score) {
      map.set(item.source, item);
      continue;
    }

    if (item.score === existing.score && item.priceCurrent < existing.priceCurrent) {
      map.set(item.source, item);
    }
  }

  return Array.from(map.values()).sort((a, b) => a.priceCurrent - b.priceCurrent);
}

export default class SourceQueryService {
  constructor({ dealsService, configOverride } = {}) {
    this.dealsService = dealsService;
    this.config = configOverride;
  }

  rankMatches(deals, queryText, minScore = 0.2) {
    const queryTokens = tokenize(queryText);
    const queryLower = String(queryText).toLowerCase();

    return deals
      .map((deal) => {
        const dealTokens = tokenize(deal.title);
        const score = overlapScore(queryTokens, dealTokens);
        const titleMatch = deal.title.toLowerCase().includes(queryLower);

        if (!titleMatch && score < minScore) {
          return null;
        }

        return {
          ...deal,
          score
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if ((b.discountPercent || 0) !== (a.discountPercent || 0)) {
          return (b.discountPercent || 0) - (a.discountPercent || 0);
        }
        return a.priceCurrent - b.priceCurrent;
      });
  }

  buildAlternatives(seed, allDeals, minScore = 0.32, maxSources = 6) {
    const seedTokens = tokenize(seed.title);

    const candidates = allDeals
      .filter((deal) => deal.source !== seed.source && deal.category === seed.category)
      .map((deal) => {
        const score = overlapScore(seedTokens, tokenize(deal.title));
        if (score < minScore) return null;
        return {
          ...deal,
          score
        };
      })
      .filter(Boolean);

    const bySource = selectBestPerSource(candidates).slice(0, maxSources);
    const bestAlternative = bySource[0] || null;

    const savingAmount = bestAlternative
      ? Math.max(seed.priceCurrent - bestAlternative.priceCurrent, 0)
      : null;

    const savingPercent =
      bestAlternative && savingAmount
        ? calcDiscountPercent(bestAlternative.priceCurrent, seed.priceCurrent)
        : null;

    return {
      alternatives: bySource,
      bestAlternative,
      savings: {
        amount: savingAmount,
        percent: savingPercent
      }
    };
  }

  normalizeLimit(limit = 8) {
    const fallback = Number(this.config?.searchMaxResults || 8);
    return Math.max(1, Math.min(Number(limit) || fallback, 20));
  }

  async searchBySourceAndQuery({ sourceOrWebsite = '', query = '', context, forceRefresh = false, limit = 8 } = {}) {
    const cleanQuery = String(query || '').trim();
    if (!cleanQuery) {
      throw new Error('Query is required.');
    }

    const warnings = [];
    const resolvedSource = resolveSourceFromInput(sourceOrWebsite);
    if (sourceOrWebsite && !resolvedSource) {
      warnings.push('Could not resolve the provided source/website, searching across all sources.');
    }

    const raw = await this.dealsService.getRawPayload({
      context,
      forceRefresh
    });

    const pool = resolvedSource
      ? raw.payload.deals.filter((deal) => deal.source === resolvedSource)
      : raw.payload.deals;

    if (resolvedSource && pool.length === 0) {
      warnings.push(`No deals are currently available from source: ${resolvedSource}`);
    }

    const ranked = this.rankMatches(pool, cleanQuery, Number(this.config?.searchMinScore || 0.2));
    const seeds = ranked.slice(0, this.normalizeLimit(limit));

    const results = seeds.map((seed) => {
      const compare = this.buildAlternatives(
        seed,
        raw.payload.deals,
        Number(this.config?.compareMinScore || 0.35),
        6
      );

      return {
        seed,
        ...compare
      };
    });

    if (results.length === 0) {
      warnings.push('No matching products found for this query in the current live scrape.');
    }

    return {
      meta: {
        generatedAt: raw.payload.generatedAt,
        fromCache: raw.fromCache,
        requestedSource: sourceOrWebsite || 'all',
        resolvedSource: resolvedSource || 'all',
        query: cleanQuery,
        candidateCount: pool.length,
        resultCount: results.length,
        warnings,
        forceRefresh
      },
      results
    };
  }
}
