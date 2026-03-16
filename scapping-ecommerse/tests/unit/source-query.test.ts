import { describe, expect, it } from 'vitest';
import SourceQueryService from '../../src/services/sourceQueryService.js';

const rawPayload = {
  generatedAt: '2026-03-05T00:00:00.000Z',
  sources: [],
  deals: [
    {
      id: '1',
      title: 'Apple iPhone 15 128GB',
      category: 'gadgets',
      source: 'daraz',
      priceCurrent: 122000,
      discountPercent: 5,
      productUrl: 'https://www.daraz.com.bd/products/iphone-15',
      scrapedAt: '2026-03-05T00:00:00.000Z'
    },
    {
      id: '2',
      title: 'Apple iPhone 15 128GB Official',
      category: 'gadgets',
      source: 'startech',
      priceCurrent: 119000,
      discountPercent: 2,
      productUrl: 'https://www.startech.com.bd/iphone-15',
      scrapedAt: '2026-03-05T00:00:00.000Z'
    },
    {
      id: '3',
      title: 'Basmati Rice 5kg Pack',
      category: 'grocery',
      source: 'chaldal',
      priceCurrent: 880,
      discountPercent: 12,
      productUrl: 'https://chaldal.com/basmati-rice-5kg',
      scrapedAt: '2026-03-05T00:00:00.000Z'
    }
  ]
};

function buildService() {
  return new SourceQueryService({
    dealsService: {
      async getRawPayload() {
        return {
          payload: rawPayload,
          fromCache: true
        };
      }
    },
    configOverride: {
      searchMinScore: 0.2,
      compareMinScore: 0.2,
      searchMaxResults: 8
    }
  });
}

describe('source query service', () => {
  it('resolves website input and returns matched seed + alternatives', async () => {
    const service = buildService();
    const result = await service.searchBySourceAndQuery({
      sourceOrWebsite: 'daraz.com.bd',
      query: 'iphone 15',
      context: {}
    });

    expect(result.meta.resolvedSource).toBe('daraz');
    expect(result.results).toHaveLength(1);
    expect(result.results[0].seed.source).toBe('daraz');
    expect(result.results[0].bestAlternative.source).toBe('startech');
  });

  it('falls back to all sources when input source is unknown', async () => {
    const service = buildService();
    const result = await service.searchBySourceAndQuery({
      sourceOrWebsite: 'unknown-shop.example',
      query: 'rice',
      context: {}
    });

    expect(result.meta.resolvedSource).toBe('all');
    expect(result.meta.warnings.length).toBeGreaterThan(0);
    expect(result.results[0].seed.source).toBe('chaldal');
  });
});
