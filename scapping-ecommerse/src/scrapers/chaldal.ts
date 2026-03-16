import BaseScraper from './base.js';
import { normalizeDeal, isDiscounted } from '../lib/normalize.js';

export function extractReactPacket(html) {
  const match = html.match(
    /window\.__reactAsyncStatePacket\s*=\s*(\{[\s\S]*?\})\s*;?\s*<\/script>/i
  );
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

export function findOfferProducts(node) {
  if (!node || typeof node !== 'object') return null;
  if (Object.prototype.hasOwnProperty.call(node, 'offerProducts') && node.offerProducts?.items) {
    return node.offerProducts;
  }

  for (const value of Object.values(node)) {
    const found = findOfferProducts(value);
    if (found) return found;
  }

  return null;
}

export default class ChaldalScraper extends BaseScraper {
  constructor() {
    super({ source: 'chaldal' });
  }

  async scrape(context) {
    const deals = [];
    const warnings = [];

    for (let page = 1; page <= context.config.maxPagesPerSource; page += 1) {
      const url = `https://chaldal.com/offers?page=${page}`;
      const robots = await this.canFetch(url, context, warnings);
      if (!robots.allowed) continue;

      await this.delay();

      const response = await context.httpClient.get(url);
      if (response.status < 200 || response.status >= 300) {
        warnings.push(`Chaldal request failed (${response.status}) for page ${page}`);
        break;
      }

      const packet = extractReactPacket(String(response.data || ''));
      if (!packet) {
        warnings.push(`Chaldal packet parse failed for page ${page}`);
        break;
      }

      const offerProducts = findOfferProducts(packet);
      const items = offerProducts?.items || [];

      if (!Array.isArray(items) || items.length === 0) {
        break;
      }

      for (const item of items) {
        const imageUrl =
          item?.OfferPictureUrls?.[0] || item?.PictureUrls?.[0] || null;

        const deal = normalizeDeal({
          source: this.source,
          category: 'grocery',
          title: item.Name,
          priceCurrent: item.DiscountedPrice,
          priceOriginal: item.Price,
          discountLabel: item.DiscountedPrice ? 'offer' : null,
          imageUrl,
          productUrl: `https://chaldal.com/${item.Slug}`
        });

        if (deal && isDiscounted(deal)) {
          deals.push(deal);
        }
      }
    }

    return {
      status: warnings.length > 0 ? 'partial' : 'ok',
      warnings,
      deals: this.clampDeals(deals)
    };
  }
}
