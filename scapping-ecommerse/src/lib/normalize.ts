import crypto from 'node:crypto';
import { CURRENCY_BDT, calcDiscountPercent, parsePrice } from './money.js';

function normalizeUrl(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return null;
  }
}

function cleanText(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function createId(source, productUrl, title) {
  const stable = `${source}|${productUrl || ''}|${title || ''}`;
  return crypto.createHash('sha1').update(stable).digest('hex').slice(0, 16);
}

export function isDiscountLike(rawDiscountLabel = '') {
  const text = String(rawDiscountLabel || '').toLowerCase();
  return /(discount|offer|sale|off|deal|save)/i.test(text);
}

export function normalizeDeal(raw) {
  const source = cleanText(raw.source).toLowerCase();
  const title = cleanText(raw.title);
  const productUrl = normalizeUrl(raw.productUrl);
  const category = raw.category === 'grocery' ? 'grocery' : 'gadgets';

  if (!source || !title || !productUrl) return null;

  const priceCurrent = parsePrice(raw.priceCurrent);
  const maybeOriginal = parsePrice(raw.priceOriginal);
  const priceOriginal =
    Number.isFinite(maybeOriginal) && maybeOriginal > priceCurrent ? maybeOriginal : null;

  if (!Number.isFinite(priceCurrent) || priceCurrent <= 0) return null;

  const derivedDiscount = calcDiscountPercent(priceCurrent, priceOriginal);
  const discountPercent =
    Number.isFinite(raw.discountPercent) && raw.discountPercent > 0
      ? Math.round(raw.discountPercent)
      : derivedDiscount;

  const discountLabel = cleanText(raw.discountLabel || '') || null;
  const scrapedAt = raw.scrapedAt ? new Date(raw.scrapedAt) : new Date();

  return {
    id: createId(source, productUrl, title),
    title,
    category,
    source,
    priceCurrent,
    priceOriginal,
    discountPercent: Number.isFinite(discountPercent) ? discountPercent : null,
    discountLabel,
    currency: CURRENCY_BDT,
    imageUrl: raw.imageUrl || null,
    productUrl,
    scrapedAt: scrapedAt.toISOString()
  };
}

export function isDiscounted(deal) {
  if (!deal) return false;
  if (Number.isFinite(deal.discountPercent) && deal.discountPercent > 0) return true;
  if (Number.isFinite(deal.priceOriginal) && deal.priceOriginal > deal.priceCurrent) return true;
  if (isDiscountLike(deal.discountLabel)) return true;
  return false;
}

export function dedupeDeals(deals) {
  const map = new Map();
  for (const deal of deals) {
    if (!deal) continue;
    const key = `${deal.source}|${deal.productUrl}`;
    if (!map.has(key)) {
      map.set(key, deal);
      continue;
    }
    const existing = map.get(key);
    const existingDiscount = existing.discountPercent ?? 0;
    const newDiscount = deal.discountPercent ?? 0;
    if (newDiscount > existingDiscount) {
      map.set(key, deal);
    }
  }
  return Array.from(map.values());
}

export function parseSourceFilter(sourceFilter) {
  if (!sourceFilter) return [];
  return String(sourceFilter)
    .split(',')
    .map((source) => source.trim().toLowerCase())
    .filter(Boolean);
}

export function filterDeals(deals, filter = {}) {
  const category = (filter.category || 'all').toLowerCase();
  const q = cleanText(filter.q || '').toLowerCase();
  const sources = parseSourceFilter(filter.source);

  return deals.filter((deal) => {
    if (category !== 'all' && deal.category !== category) return false;
    if (sources.length > 0 && !sources.includes(deal.source)) return false;
    if (q && !`${deal.title} ${deal.source}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

export function sortDeals(deals, sort = 'discount') {
  const copy = [...deals];

  switch (sort) {
    case 'price_asc':
      return copy.sort((a, b) => a.priceCurrent - b.priceCurrent);
    case 'price_desc':
      return copy.sort((a, b) => b.priceCurrent - a.priceCurrent);
    case 'latest':
      return copy.sort((a, b) => new Date(b.scrapedAt) - new Date(a.scrapedAt));
    case 'discount':
    default:
      return copy.sort((a, b) => {
        const d1 = a.discountPercent ?? 0;
        const d2 = b.discountPercent ?? 0;
        if (d2 !== d1) return d2 - d1;
        return a.priceCurrent - b.priceCurrent;
      });
  }
}
