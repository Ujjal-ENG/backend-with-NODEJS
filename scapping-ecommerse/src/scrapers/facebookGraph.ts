import BaseScraper from './base.js';
import { normalizeDeal } from '../lib/normalize.js';

const DISCOUNT_PATTERN = /(discount|offer|sale|off|deal|save)/i;

function extractPrice(text) {
  if (!text) return null;
  const match = String(text).match(/(?:৳|Tk|BDT)?\s*([0-9]{2,7})/i);
  if (!match) return null;
  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export default class FacebookGraphScraper extends BaseScraper {
  constructor() {
    super({ source: 'facebook' });
  }

  async scrape(context) {
    const warnings = [];
    const deals = [];

    const token = context.config.facebookAccessToken;
    const pageIds = context.config.facebookPageIds;

    if (!token || !Array.isArray(pageIds) || pageIds.length === 0) {
      warnings.push('Facebook integration not configured (FACEBOOK_ACCESS_TOKEN / FACEBOOK_PAGE_IDS).');
      return {
        status: 'partial',
        warnings,
        deals
      };
    }

    for (const pageId of pageIds) {
      const url = new URL(`https://graph.facebook.com/v21.0/${pageId}/posts`);
      url.searchParams.set('fields', 'message,permalink_url,created_time,full_picture');
      url.searchParams.set('limit', '20');
      url.searchParams.set('access_token', token);

      await this.delay();

      const response = await context.httpClient.get(url.toString(), {
        headers: {
          accept: 'application/json'
        }
      });

      if (response.status < 200 || response.status >= 300) {
        warnings.push(`Facebook Graph API failed (${response.status}) for page ${pageId}`);
        continue;
      }

      const posts = response.data?.data || [];
      for (const post of posts) {
        const message = post.message || '';
        if (!DISCOUNT_PATTERN.test(message)) continue;

        const price = extractPrice(message);

        const deal = normalizeDeal({
          source: this.source,
          category: 'gadgets',
          title: message.slice(0, 120) || `Deal from ${pageId}`,
          priceCurrent: price || 1,
          priceOriginal: null,
          discountLabel: 'facebook-offer',
          imageUrl: post.full_picture || null,
          productUrl: post.permalink_url,
          scrapedAt: post.created_time
        });

        if (deal) {
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
