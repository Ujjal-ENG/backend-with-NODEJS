import * as cheerio from 'cheerio';
import BaseScraper from './base.js';
import { normalizeDeal, isDiscounted } from '../lib/normalize.js';

const STARTECH_CATEGORY_URLS = [
  'https://www.startech.com.bd/laptop-notebook',
  'https://www.startech.com.bd/mobile-phone',
  'https://www.startech.com.bd/headphone'
];

function categoryFromUrl(url) {
  if (url.includes('mobile') || url.includes('headphone') || url.includes('laptop')) {
    return 'gadgets';
  }
  return 'gadgets';
}

export function parseStartechProducts(html, source = 'startech', category = 'gadgets') {
  const $ = cheerio.load(html || '');
  const deals = [];

  $('.p-item').each((_, node) => {
    const title = $(node).find('.p-item-name a').first().text().trim();
    const productUrl = $(node).find('.p-item-name a').first().attr('href');
    const imageUrl = $(node).find('.p-item-img img').first().attr('src');
    const priceCurrent =
      $(node).find('.price-new').first().text().trim() ||
      $(node).find('.p-item-price').first().text();
    const priceOriginal = $(node).find('.price-old').first().text().trim();

    const deal = normalizeDeal({
      source,
      category,
      title,
      priceCurrent,
      priceOriginal,
      discountLabel: priceOriginal ? 'price drop' : null,
      imageUrl,
      productUrl
    });

    if (deal && isDiscounted(deal)) {
      deals.push(deal);
    }
  });

  return deals;
}

export default class StartechScraper extends BaseScraper {
  constructor() {
    super({ source: 'startech' });
  }

  async searchProducts(query, context) {
    const warnings = [];
    const encoded = encodeURIComponent(query);
    const url = `https://www.startech.com.bd/product/search?search=${encoded}`;

    const robots = await this.canFetch(url, context, warnings);
    if (!robots.allowed) {
      return { warnings, products: [] };
    }

    await this.delay();
    const response = await context.httpClient.get(url);
    if (response.status < 200 || response.status >= 300) {
      warnings.push(`Startech search failed (${response.status})`);
      return { warnings, products: [] };
    }

    const products = parseStartechProducts(response.data, this.source, 'gadgets');
    return { warnings, products };
  }

  async scrape(context) {
    const deals = [];
    const warnings = [];

    for (const baseUrl of STARTECH_CATEGORY_URLS) {
      const category = categoryFromUrl(baseUrl);

      for (let page = 1; page <= context.config.maxPagesPerSource; page += 1) {
        const url = page === 1 ? baseUrl : `${baseUrl}?page=${page}`;

        const robots = await this.canFetch(url, context, warnings);
        if (!robots.allowed) continue;

        await this.delay();

        const response = await context.httpClient.get(url);
        if (response.status < 200 || response.status >= 300) {
          warnings.push(`Startech request failed (${response.status}) for ${url}`);
          break;
        }

        const parsedDeals = parseStartechProducts(response.data, this.source, category);
        if (!parsedDeals.length) {
          break;
        }
        deals.push(...parsedDeals);
      }
    }

    return {
      status: warnings.length > 0 ? 'partial' : 'ok',
      warnings,
      deals: this.clampDeals(deals)
    };
  }
}
