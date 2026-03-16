import pLimit from 'p-limit';
import logger from '../lib/logger.js';
import { formatBdt } from '../lib/money.js';

const STOP_WORDS = new Set([
  'the', 'and', 'with', 'for', 'from', 'inch', 'inches',
  'official', 'original', 'bangladesh', 'bd', 'price',
  'new', 'best', 'offer', 'sale', 'buy', 'online'
]);

function tokenize(text = '') {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2)
    .filter((t) => !STOP_WORDS.has(t));
}

function relevanceScore(queryTokens, titleTokens) {
  if (queryTokens.length === 0 || titleTokens.length === 0) return 0;
  const qSet = new Set(queryTokens);
  const tSet = new Set(titleTokens);

  let overlap = 0;
  for (const t of qSet) {
    if (tSet.has(t)) overlap += 1;
  }

  return overlap / qSet.size;
}

export default class ProductSearchService {
  constructor({ scrapers, concurrency = 3 } = {}) {
    this.scrapers = scrapers.filter((s) => typeof s.searchProducts === 'function');
    this.concurrency = concurrency;
  }

  async search({ query, context, minRelevance = 0.4 }) {
    if (!query || !String(query).trim()) {
      throw new Error('Search query is required.');
    }

    const cleanQuery = String(query).trim();
    const queryTokens = tokenize(cleanQuery);
    const queryLower = cleanQuery.toLowerCase();

    const limit = pLimit(this.concurrency);
    const startedAt = Date.now();
    const allWarnings = [];

    const sourceResults = await Promise.all(
      this.scrapers.map((scraper) =>
        limit(async () => {
          const sourceStart = Date.now();
          try {
            const result = await scraper.searchProducts(cleanQuery, context);
            const warnings = result.warnings || [];
            allWarnings.push(...warnings.map((w) => `[${scraper.source}] ${w}`));

            return {
              source: scraper.source,
              status: 'ok',
              products: result.products || [],
              durationMs: Date.now() - sourceStart
            };
          } catch (error) {
            allWarnings.push(`[${scraper.source}] Search failed: ${error.message}`);
            return {
              source: scraper.source,
              status: 'error',
              products: [],
              durationMs: Date.now() - sourceStart
            };
          }
        })
      )
    );

    // Collect all products, score by relevance to query
    const allProducts = [];

    for (const sr of sourceResults) {
      for (const product of sr.products) {
        const titleTokens = tokenize(product.title);
        const score = relevanceScore(queryTokens, titleTokens);
        const titleContains = product.title.toLowerCase().includes(queryLower.slice(0, 20));

        if (score >= minRelevance || titleContains) {
          allProducts.push({
            ...product,
            relevanceScore: Number(score.toFixed(3))
          });
        }
      }
    }

    // Sort by price ascending (lowest first)
    allProducts.sort((a, b) => a.priceCurrent - b.priceCurrent);

    // Pick best per source (lowest price from each)
    const bestPerSource = new Map();
    for (const product of allProducts) {
      if (!bestPerSource.has(product.source)) {
        bestPerSource.set(product.source, product);
      }
    }
    const sourceComparison = Array.from(bestPerSource.values()).sort(
      (a, b) => a.priceCurrent - b.priceCurrent
    );

    const lowestPrice = sourceComparison[0] || null;
    const highestPrice = sourceComparison.length > 0
      ? sourceComparison[sourceComparison.length - 1]
      : null;

    const savingsAmount = lowestPrice && highestPrice && highestPrice.priceCurrent > lowestPrice.priceCurrent
      ? highestPrice.priceCurrent - lowestPrice.priceCurrent
      : null;

    logger.info('Product search completed', {
      query: cleanQuery,
      totalResults: allProducts.length,
      sourcesSearched: sourceResults.length,
      lowestSource: lowestPrice?.source || 'none',
      lowestPrice: lowestPrice?.priceCurrent || null
    });

    return {
      meta: {
        query: cleanQuery,
        searchedAt: new Date().toISOString(),
        durationMs: Date.now() - startedAt,
        totalResults: allProducts.length,
        sourcesSearched: sourceResults.map((sr) => ({
          source: sr.source,
          status: sr.status,
          resultCount: sr.products.length,
          durationMs: sr.durationMs
        })),
        warnings: allWarnings
      },
      lowestPrice: lowestPrice
        ? {
            source: lowestPrice.source,
            title: lowestPrice.title,
            price: lowestPrice.priceCurrent,
            priceFormatted: formatBdt(lowestPrice.priceCurrent),
            productUrl: lowestPrice.productUrl,
            imageUrl: lowestPrice.imageUrl,
            relevanceScore: lowestPrice.relevanceScore
          }
        : null,
      savings: savingsAmount
        ? {
            amount: savingsAmount,
            amountFormatted: formatBdt(savingsAmount),
            comparedTo: {
              source: highestPrice.source,
              price: highestPrice.priceCurrent
            }
          }
        : null,
      priceComparison: sourceComparison.map((p) => ({
        source: p.source,
        title: p.title,
        price: p.priceCurrent,
        priceFormatted: formatBdt(p.priceCurrent),
        productUrl: p.productUrl,
        imageUrl: p.imageUrl,
        relevanceScore: p.relevanceScore
      })),
      allResults: allProducts.slice(0, 30).map((p) => ({
        source: p.source,
        title: p.title,
        price: p.priceCurrent,
        priceOriginal: p.priceOriginal,
        discountPercent: p.discountPercent,
        priceFormatted: formatBdt(p.priceCurrent),
        productUrl: p.productUrl,
        imageUrl: p.imageUrl,
        relevanceScore: p.relevanceScore
      }))
    };
  }
}
