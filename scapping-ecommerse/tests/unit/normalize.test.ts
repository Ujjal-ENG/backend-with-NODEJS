import { describe, expect, it } from 'vitest';
import { dedupeDeals, normalizeDeal } from '../../src/lib/normalize.js';

describe('normalizeDeal', () => {
  it('normalizes and computes discount', () => {
    const normalized = normalizeDeal({
      source: 'daraz',
      category: 'gadgets',
      title: 'Sample Phone',
      priceCurrent: '20,000',
      priceOriginal: '25,000',
      imageUrl: 'https://img.com/1.jpg',
      productUrl: 'https://www.daraz.com.bd/sample'
    });

    expect(normalized).toBeTruthy();
    expect(normalized.discountPercent).toBe(20);
    expect(normalized.currency).toBe('BDT');
  });

  it('dedupes on source + url and keeps best discount', () => {
    const one = normalizeDeal({
      source: 'daraz',
      category: 'gadgets',
      title: 'A',
      priceCurrent: 90,
      priceOriginal: 100,
      productUrl: 'https://www.daraz.com.bd/a'
    });
    const two = normalizeDeal({
      source: 'daraz',
      category: 'gadgets',
      title: 'A',
      priceCurrent: 70,
      priceOriginal: 100,
      productUrl: 'https://www.daraz.com.bd/a'
    });

    const deduped = dedupeDeals([one, two]);
    expect(deduped).toHaveLength(1);
    expect(deduped[0].discountPercent).toBe(30);
  });
});
