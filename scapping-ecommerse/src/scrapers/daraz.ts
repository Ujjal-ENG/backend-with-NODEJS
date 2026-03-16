import BaseScraper from './base.js';
import { normalizeDeal, isDiscounted } from '../lib/normalize.js';

const CATEGORY_SLUGS = {
  gadgets: ['smartphones', 'laptops', 'earphones-headsets'],
  grocery: [
    'groceries-fresh-produce',
    'groceries-bakery',
    'groceries-laundry-household-aircare'
  ]
};

export function extractDarazList(payload) {
  return payload?.mods?.listItems || [];
}

export default class DarazScraper extends BaseScraper {
  constructor() {
    super({ source: 'daraz' });
  }

  async searchProducts(query, context) {
    const warnings = [];
    const encoded = encodeURIComponent(query);
    const url = `https://www.daraz.com.bd/catalog/?q=${encoded}&ajax=true&page=1`;

    const robots = await this.canFetch(url, context, warnings);
    if (!robots.allowed) {
      return { warnings, products: [] };
    }

    await this.delay();
    const response = await context.httpClient.get(url, {
      headers: { accept: 'application/json,text/plain,*/*' }
    });

    if (response.status < 200 || response.status >= 300) {
      warnings.push(`Daraz search failed (${response.status})`);
      return { warnings, products: [] };
    }

    let payload;
    try {
      payload = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
    } catch {
      warnings.push('Daraz search returned non-JSON');
      return { warnings, products: [] };
    }

    const items = extractDarazList(payload);
    const products = [];

    for (const item of (Array.isArray(items) ? items : [])) {
      const deal = normalizeDeal({
        source: this.source,
        category: 'gadgets',
        title: item.name,
        priceCurrent: item.price,
        priceOriginal: item.originalPrice,
        discountLabel: item.discount || null,
        imageUrl: this.toAbsolute(item.image),
        productUrl: this.toAbsolute(item.itemUrl, 'https://www.daraz.com.bd')
      });
      if (deal) products.push(deal);
    }

    return { warnings, products };
  }

  async scrape(context) {
    const deals = [];
    const warnings = [];

    for (const [category, slugs] of Object.entries(CATEGORY_SLUGS)) {
      for (const slug of slugs) {
        for (let page = 1; page <= context.config.maxPagesPerSource; page += 1) {
          const url = `https://www.daraz.com.bd/${slug}/?ajax=true&page=${page}`;

          const robots = await this.canFetch(url, context, warnings);
          if (!robots.allowed) {
            continue;
          }

          await this.delay();

          const response = await context.httpClient.get(url, {
            headers: {
              accept: 'application/json,text/plain,*/*'
            }
          });

          if (response.status < 200 || response.status >= 300) {
            warnings.push(`Daraz request failed (${response.status}) for ${slug} page ${page}`);
            break;
          }

          let payload;
          try {
            payload =
              typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
          } catch {
            warnings.push(`Daraz returned non-JSON for ${slug} page ${page}`);
            break;
          }

          const items = extractDarazList(payload);
          if (!Array.isArray(items) || items.length === 0) {
            break;
          }

          for (const item of items) {
            const rawDeal = {
              source: this.source,
              category,
              title: item.name,
              priceCurrent: item.price,
              priceOriginal: item.originalPrice,
              discountLabel: item.discount || null,
              imageUrl: this.toAbsolute(item.image),
              productUrl: this.toAbsolute(item.itemUrl, 'https://www.daraz.com.bd')
            };

            const deal = normalizeDeal(rawDeal);
            if (deal && isDiscounted(deal)) {
              deals.push(deal);
            }
          }

          if (deals.length >= this.maxDealsPerSource) {
            return {
              status: warnings.length > 0 ? 'partial' : 'ok',
              warnings,
              deals: this.clampDeals(deals)
            };
          }
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
