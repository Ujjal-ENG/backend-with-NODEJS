import * as cheerio from 'cheerio';
import BaseScraper from './base.js';
import { withPage } from '../lib/browser.js';
import { normalizeDeal, isDiscounted } from '../lib/normalize.js';

const KEYWORDS = ['laptop', 'mobile', 'phone', 'headphone', 'earphone'];

function looksLikeCloudflare(html = '') {
  const text = html.toLowerCase();
  return text.includes('just a moment') || text.includes('cf_chl_opt') || text.includes('challenge-platform');
}

function extractUrls(text = '') {
  return Array.from(new Set(text.match(/https:\/\/www\.ryans\.com\/[^<\s"']+/g) || []));
}

function matchesKeyword(url) {
  const lower = url.toLowerCase();
  return KEYWORDS.some((keyword) => lower.includes(keyword));
}

function parseRyansCards($, origin, source) {
  const deals = [];
  const candidateCards = $('.product-item, .single-product, .product-thumb, .card, article, .category-single-product');

  candidateCards.each((_, node) => {
    const title =
      $(node).find('h2, h3, h4, .title, .product-name, a[title]').first().text().trim() ||
      $(node).find('a[title]').first().attr('title');

    const link = $(node).find('a[href]').first().attr('href');
    const imageUrl = $(node).find('img').first().attr('src') || $(node).find('img').first().attr('data-src');

    const priceBucket =
      $(node).find('.price, .current-price, .discount-price, .offer-price, [class*=price]').text() || '';

    const numbers = priceBucket.match(/[0-9,]+/g) || [];
    const priceCurrent = numbers[0] || null;
    const priceOriginal = numbers[1] || null;

    let fullLink = link;
    if (link && !link.startsWith('http')) {
      fullLink = `${origin}${link.startsWith('/') ? '' : '/'}${link}`;
    }
    let fullImage = imageUrl;
    if (imageUrl && !imageUrl.startsWith('http')) {
      fullImage = imageUrl.startsWith('//') ? `https:${imageUrl}` : `${origin}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
    }

    const deal = normalizeDeal({
      source,
      category: 'gadgets',
      title,
      priceCurrent,
      priceOriginal,
      discountLabel: priceOriginal ? 'offer' : null,
      imageUrl: fullImage,
      productUrl: fullLink
    });

    if (deal) deals.push(deal);
  });

  return deals;
}

export default class RyansScraper extends BaseScraper {
  constructor() {
    super({ source: 'ryans' });
  }

  async searchProducts(query, context) {
    const warnings = [];
    const encoded = encodeURIComponent(query);
    const url = `https://www.ryans.com/search?q=${encoded}`;

    await this.delay();

    let html;
    try {
      html = await withPage(async (page) => {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForSelector('.category-single-product, .product-item, .card', { timeout: 5000 }).catch(() => {});
        return page.content();
      });
    } catch (error) {
      warnings.push(`Ryans search failed: ${error.message}`);
      return { warnings, products: [] };
    }

    if (looksLikeCloudflare(html)) {
      warnings.push('Ryans search blocked by Cloudflare.');
      return { warnings, products: [] };
    }

    const $ = cheerio.load(html);
    const products = parseRyansCards($, 'https://www.ryans.com', this.source);

    return { warnings, products };
  }

  async getSitemapUrls() {
    const sitemapHtml = await withPage(async (page) => {
      await page.goto('https://www.ryans.com/sitemap.xml', {
        waitUntil: 'domcontentloaded',
        timeout: 20000
      });
      return page.content();
    });

    if (looksLikeCloudflare(sitemapHtml)) {
      return {
        blocked: true,
        urls: []
      };
    }

    const urls = extractUrls(sitemapHtml)
      .filter((url) => matchesKeyword(url))
      .filter((url) => !url.includes('/search'))
      .slice(0, 12);

    return {
      blocked: false,
      urls
    };
  }

  async scrape(context) {
    const deals = [];
    const warnings = [];

    let sitemapResult;
    try {
      sitemapResult = await this.getSitemapUrls();
    } catch (error) {
      warnings.push(`Ryans sitemap fetch failed: ${error.message}`);
      return {
        status: 'error',
        warnings,
        deals
      };
    }

    if (sitemapResult.blocked) {
      warnings.push('Ryans blocked by Cloudflare challenge.');
      return {
        status: 'blocked',
        warnings,
        deals
      };
    }

    if (sitemapResult.urls.length === 0) {
      warnings.push('Ryans sitemap did not yield keyword category URLs.');
      return {
        status: 'partial',
        warnings,
        deals
      };
    }

    for (const url of sitemapResult.urls.slice(0, context.config.maxPagesPerSource)) {
      const robots = await this.canFetch(url, context, warnings);
      if (!robots.allowed) continue;

      await this.delay();

      let html;
      try {
        html = await withPage(async (page) => {
          await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 20000
          });
          return page.content();
        });
      } catch (error) {
        warnings.push(`Ryans page fetch failed: ${url} (${error.message})`);
        continue;
      }

      if (looksLikeCloudflare(html)) {
        warnings.push('Ryans page blocked by Cloudflare challenge.');
        continue;
      }

      const $ = cheerio.load(html);
      const pageDealResults = parseRyansCards($, 'https://www.ryans.com', this.source);
      for (const deal of pageDealResults) {
        if (isDiscounted(deal)) {
          deals.push(deal);
        }
      }
    }

    if (deals.length === 0 && warnings.length > 0) {
      return {
        status: warnings.some((w) => w.toLowerCase().includes('cloudflare')) ? 'blocked' : 'partial',
        warnings,
        deals
      };
    }

    return {
      status: warnings.length > 0 ? 'partial' : 'ok',
      warnings,
      deals: this.clampDeals(deals)
    };
  }
}
