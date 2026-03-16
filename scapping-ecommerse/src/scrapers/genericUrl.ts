import * as cheerio from 'cheerio';
import { parsePrice } from '../lib/money.js';
import logger from '../lib/logger.js';

function slugToTitle(pathname = '') {
  const slug = pathname.split('/').filter(Boolean).pop();
  if (!slug) return 'Unknown Product';
  return decodeURIComponent(slug).replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseJsonLdProducts($) {
  const products = [];

  $('script[type="application/ld+json"]').each((_, node) => {
    const raw = $(node).contents().text();
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      const candidates = Array.isArray(parsed) ? parsed : [parsed];

      for (const item of candidates) {
        if (item['@type'] === 'Product' || item['@type']?.includes?.('Product')) {
          const offer = item.offers;
          let price = null;

          if (offer?.price !== undefined) {
            price = parsePrice(offer.price);
          } else if (offer?.lowPrice !== undefined) {
            price = parsePrice(offer.lowPrice);
          } else if (Array.isArray(offer)) {
            for (const entry of offer) {
              const p = parsePrice(entry?.price);
              if (p) { price = p; break; }
            }
          }

          products.push({
            title: item.name || null,
            price,
            image: item.image?.[0] || item.image || null,
            currency: offer?.priceCurrency || 'BDT'
          });
        }
      }
    } catch {
      // Ignore malformed JSON-LD
    }
  });

  return products;
}

function extractMetaPrice($) {
  const candidates = [
    $('meta[property="product:price:amount"]').attr('content'),
    $('meta[property="og:price:amount"]').attr('content'),
    $('[itemprop="price"]').first().attr('content'),
    $('[itemprop="price"]').first().text()
  ];

  for (const val of candidates) {
    const p = parsePrice(val);
    if (p) return p;
  }
  return null;
}

function extractPriceFromText(text) {
  const regex = /(?:৳|tk|bdt|price[:\s]*)\s*([0-9,]+(?:\.[0-9]+)?)/gi;
  const matches = [];
  let match;
  while ((match = regex.exec(text)) !== null && matches.length < 10) {
    const p = parsePrice(match[1]);
    if (p && p > 10) matches.push(p);
  }
  return matches.length > 0 ? Math.min(...matches) : null;
}

export async function scrapeGenericUrl(url, context) {
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error('Invalid URL provided.');
  }

  const robots = await context.robotsService.canFetch(parsedUrl.toString());
  if (robots.allowed === false) {
    throw new Error(`URL is disallowed by robots policy: ${parsedUrl.toString()}`);
  }

  const response = await context.httpClient.get(parsedUrl.toString());
  if (response.status < 200 || response.status >= 300) {
    throw new Error(`Failed to fetch URL (HTTP ${response.status}).`);
  }

  const html = String(response.data || '');
  const $ = cheerio.load(html);

  const title =
    $('meta[property="og:title"]').attr('content') ||
    $('meta[name="title"]').attr('content') ||
    $('h1').first().text().trim() ||
    $('title').first().text().trim() ||
    slugToTitle(parsedUrl.pathname);

  const description =
    $('meta[property="og:description"]').attr('content') ||
    $('meta[name="description"]').attr('content') ||
    '';

  const image =
    $('meta[property="og:image"]').attr('content') ||
    $('meta[property="og:image:url"]').attr('content') ||
    null;

  const jsonLdProducts = parseJsonLdProducts($);
  const metaPrice = extractMetaPrice($);

  const priceText = [
    $('.price').first().text(),
    $('[class*="price"]').first().text(),
    $('[id*="price"]').first().text(),
    $('body').text().slice(0, 10000)
  ].join(' ');
  const textPrice = extractPriceFromText(priceText);

  const price = jsonLdProducts[0]?.price || metaPrice || textPrice || null;

  // Extract all product-like items from the page (for listing pages)
  const products = [];

  // From JSON-LD
  for (const p of jsonLdProducts) {
    if (p.title && p.price) {
      products.push({
        title: p.title,
        price: p.price,
        image: p.image,
        url: parsedUrl.toString()
      });
    }
  }

  // From common product card patterns
  const cardSelectors = [
    '.product-item', '.product-card', '.p-item', '.single-product',
    '.product-thumb', '[class*="product-"]', '.card-product',
    '.item-card', '.listing-item'
  ];

  for (const sel of cardSelectors) {
    $(sel).each((_, node) => {
      const cardTitle =
        $(node).find('h2, h3, h4, .title, .product-name, a[title], .p-item-name a').first().text().trim() ||
        $(node).find('a[title]').first().attr('title') || '';

      const cardLink = $(node).find('a[href]').first().attr('href') || '';
      const cardImage = $(node).find('img').first().attr('src') || $(node).find('img').first().attr('data-src') || '';
      const cardPriceText = $(node).find('[class*="price"], .price, .amount').text() || $(node).text();
      const cardPrice = extractPriceFromText(cardPriceText);

      if (cardTitle && cardPrice) {
        let fullLink = cardLink;
        if (cardLink && !cardLink.startsWith('http')) {
          fullLink = `${parsedUrl.origin}${cardLink.startsWith('/') ? '' : '/'}${cardLink}`;
        }
        let fullImage = cardImage;
        if (cardImage && !cardImage.startsWith('http')) {
          fullImage = cardImage.startsWith('//') ? `https:${cardImage}` : `${parsedUrl.origin}${cardImage.startsWith('/') ? '' : '/'}${cardImage}`;
        }

        products.push({
          title: cardTitle,
          price: cardPrice,
          image: fullImage || null,
          url: fullLink || parsedUrl.toString()
        });
      }
    });

    if (products.length > 5) break;
  }

  logger.info('Generic URL scraped', { url: parsedUrl.toString(), productsFound: products.length });

  return {
    url: parsedUrl.toString(),
    hostname: parsedUrl.hostname,
    title,
    description,
    image,
    price,
    products
  };
}
