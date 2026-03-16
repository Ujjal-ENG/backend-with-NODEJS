import * as cheerio from 'cheerio';
import BaseScraper from './base.js';
import { normalizeDeal, isDiscounted } from '../lib/normalize.js';

const SHWAPNO_PATHS = ['/deals', '/great-savings-3', '/rice', '/oil', '/Gadget'];

function parseEmbeddedDealsFromText(html) {
  const output = [];
  const pattern = /"product_name"\s*:\s*"([^"]+)"[\s\S]{0,300}?"product_price"\s*:\s*(\d+)[\s\S]{0,300}?"product_specialPrice"\s*:\s*(\d+)/gi;
  let match;

  while ((match = pattern.exec(html)) !== null) {
    output.push({
      title: match[1],
      priceOriginal: Number.parseInt(match[2], 10),
      priceCurrent: Number.parseInt(match[3], 10)
    });
  }

  return output;
}

export default class ShwapnoScraper extends BaseScraper {
  constructor() {
    super({ source: 'shwapno' });
  }

  async scrape(context) {
    const deals = [];
    const warnings = [];

    for (const path of SHWAPNO_PATHS) {
      const url = `https://www.shwapno.com${path}`;
      const robots = await this.canFetch(url, context, warnings);
      if (!robots.allowed) continue;

      await this.delay();

      const response = await context.httpClient.get(url);
      if (response.status < 200 || response.status >= 300) {
        warnings.push(`Shwapno request failed (${response.status}) for ${path}`);
        continue;
      }

      const html = String(response.data || '');
      const $ = cheerio.load(html);

      $('.product-box').each((_, node) => {
        const title = $(node).find('.product-box-title, .product-box-name, h4, h3').first().text().trim();
        const href = $(node).find('a').first().attr('href');
        const imageUrl = $(node).find('img').first().attr('src');
        const wholeText = $(node).text();

        const prices = wholeText.match(/[0-9,]+\s*(?:৳|Tk|BDT)?/g) || [];
        const priceCurrent = prices[0] || null;
        const priceOriginal = prices[1] || null;

        const deal = normalizeDeal({
          source: this.source,
          category: 'grocery',
          title,
          priceCurrent,
          priceOriginal,
          discountLabel: priceOriginal ? 'offer' : null,
          imageUrl,
          productUrl: href ? `https://www.shwapno.com${href}` : null
        });

        if (deal && isDiscounted(deal)) {
          deals.push(deal);
        }
      });

      const embeddedDeals = parseEmbeddedDealsFromText(html);
      for (const item of embeddedDeals) {
        const deal = normalizeDeal({
          source: this.source,
          category: 'grocery',
          title: item.title,
          priceCurrent: item.priceCurrent,
          priceOriginal: item.priceOriginal,
          discountLabel: 'offer',
          imageUrl: null,
          productUrl: url
        });
        if (deal && isDiscounted(deal)) {
          deals.push(deal);
        }
      }
    }

    if (deals.length === 0) {
      warnings.push(
        'Shwapno robots policy blocks /api crawling; public pages expose limited product payload in strict mode.'
      );
    }

    return {
      status: deals.length === 0 ? 'partial' : warnings.length > 0 ? 'partial' : 'ok',
      warnings,
      deals: this.clampDeals(deals)
    };
  }
}
