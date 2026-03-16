import BaseScraper from './base.js';
import { normalizeDeal, isDiscounted } from '../lib/normalize.js';

const PICKABOO_CATEGORIES = [
  'https://www.pickaboo.com/product/smartphone',
  'https://www.pickaboo.com/product/laptop-notebook',
  'https://www.pickaboo.com/product/headphone'
];

export function extractNextData(html) {
  const match = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/i
  );
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

export default class PickabooScraper extends BaseScraper {
  constructor() {
    super({ source: 'pickaboo' });
  }

  async searchProducts(query, context) {
    const warnings = [];
    const encoded = encodeURIComponent(query);
    const url = `https://www.pickaboo.com/catalogsearch/result/?q=${encoded}`;

    const robots = await this.canFetch(url, context, warnings);
    if (!robots.allowed) {
      return { warnings, products: [] };
    }

    await this.delay();
    const response = await context.httpClient.get(url);
    if (response.status < 200 || response.status >= 300) {
      warnings.push(`Pickaboo search failed (${response.status})`);
      return { warnings, products: [] };
    }

    const html = String(response.data || '');
    const nextData = extractNextData(html);
    const products = [];

    if (nextData) {
      const list =
        nextData?.props?.pageProps?.initialState?.productReducer?.searchProducts ||
        nextData?.props?.pageProps?.initialState?.productReducer?.bottomCategoryListProducts ||
        [];

      for (const product of (Array.isArray(list) ? list : [])) {
        const deal = normalizeDeal({
          source: this.source,
          category: 'gadgets',
          title: product.product_name,
          priceCurrent: product.product_specialPrice || product.product_price,
          priceOriginal: product.product_price,
          discountPercent: product.product_discount,
          discountLabel: product.offers ? 'offer' : null,
          imageUrl: product.product_img,
          productUrl: `https://www.pickaboo.com/product-detail/${product.slug}`
        });
        if (deal) products.push(deal);
      }
    }

    if (products.length === 0) {
      warnings.push('Pickaboo search returned no results');
    }

    return { warnings, products };
  }

  async scrape(context) {
    const deals = [];
    const warnings = [];

    for (const url of PICKABOO_CATEGORIES) {
      const robots = await this.canFetch(url, context, warnings);
      if (!robots.allowed) continue;

      await this.delay();

      const response = await context.httpClient.get(url);
      if (response.status < 200 || response.status >= 300) {
        warnings.push(`Pickaboo request failed (${response.status}) for ${url}`);
        continue;
      }

      const html = String(response.data || '');
      const nextData = extractNextData(html);
      if (!nextData) {
        warnings.push(`Pickaboo missing __NEXT_DATA__ for ${url}`);
        continue;
      }

      const list =
        nextData?.props?.pageProps?.initialState?.productReducer
          ?.bottomCategoryListProducts || [];

      if (!Array.isArray(list) || list.length === 0) {
        warnings.push(`Pickaboo category returned empty products for ${url}`);
        continue;
      }

      for (const product of list) {
        const deal = normalizeDeal({
          source: this.source,
          category: 'gadgets',
          title: product.product_name,
          priceCurrent: product.product_specialPrice || product.product_price,
          priceOriginal: product.product_price,
          discountPercent: product.product_discount,
          discountLabel: product.offers ? 'offer' : null,
          imageUrl: product.product_img,
          productUrl: `https://www.pickaboo.com/product-detail/${product.slug}`
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
