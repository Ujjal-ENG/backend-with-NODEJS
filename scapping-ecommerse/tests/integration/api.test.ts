import request from 'supertest';
import { describe, expect, it } from 'vitest';
import createApp from '../../src/app.js';

const samplePayload = {
  meta: {
    generatedAt: new Date().toISOString(),
    fromCache: false,
    cacheAgeSec: 0,
    filter: { category: 'all', source: '', q: '', sort: 'discount' },
    totalDeals: 1,
    page: 1,
    perPage: 120,
    totalPages: 1
  },
  sources: [
    {
      source: 'daraz',
      status: 'ok',
      count: 1,
      durationMs: 200,
      warnings: []
    }
  ],
  deals: [
    {
      id: 'a',
      title: 'Sample Deal',
      category: 'gadgets',
      source: 'daraz',
      priceCurrent: 100,
      priceOriginal: 150,
      discountPercent: 33,
      discountLabel: '-33%',
      currency: 'BDT',
      imageUrl: 'https://img',
      productUrl: 'https://x',
      scrapedAt: new Date().toISOString()
    }
  ]
};

function buildApp() {
  const dealsService = {
    async getDeals({ forceRefresh }) {
      if (forceRefresh) {
        return {
          ...samplePayload,
          meta: { ...samplePayload.meta, fromCache: false }
        };
      }
      return samplePayload;
    },
    getHealth() {
      return {
        status: 'ok',
        cacheAvailable: true,
        cacheFresh: true,
        cacheAgeSec: 10,
        lastScrapedAt: samplePayload.meta.generatedAt,
        refreshInFlight: false
      };
    }
  };

  const compareService = {
    async compareByUrl({ productUrl }) {
      return {
        meta: {
          generatedAt: new Date().toISOString(),
          fromCache: true,
          compareCount: 1,
          forceRefresh: false
        },
        seed: {
          source: 'daraz',
          url: productUrl,
          title: 'Seed Product',
          priceCurrent: 100
        },
        bestMatch: {
          source: 'startech',
          title: 'Matched Product',
          priceCurrent: 90,
          discountPercent: 10,
          productUrl: 'https://example.com/matched',
          score: 0.8
        },
        savings: {
          amount: 10,
          percent: 10
        },
        compared: [
          {
            source: 'startech',
            title: 'Matched Product',
            priceCurrent: 90,
            discountPercent: 10,
            productUrl: 'https://example.com/matched',
            score: 0.8
          }
        ]
      };
    }
  };

  const sourceQueryService = {
    async searchBySourceAndQuery({ sourceOrWebsite, query }) {
      return {
        meta: {
          generatedAt: new Date().toISOString(),
          fromCache: true,
          requestedSource: sourceOrWebsite || 'all',
          resolvedSource: sourceOrWebsite || 'all',
          query,
          candidateCount: 10,
          resultCount: 1,
          warnings: [],
          forceRefresh: false
        },
        results: [
          {
            seed: {
              source: 'daraz',
              title: `Seed ${query}`,
              priceCurrent: 100,
              category: 'gadgets',
              productUrl: 'https://daraz.com.bd/p'
            },
            bestAlternative: {
              source: 'startech',
              title: `Match ${query}`,
              priceCurrent: 90,
              productUrl: 'https://startech.com.bd/p',
              score: 0.8
            },
            savings: {
              amount: 10,
              percent: 10
            },
            alternatives: [
              {
                source: 'startech',
                title: `Match ${query}`,
                priceCurrent: 90,
                productUrl: 'https://startech.com.bd/p',
                score: 0.8
              }
            ]
          }
        ]
      };
    }
  };

  return createApp({
    dealsService,
    compareService,
    sourceQueryService,
    getContext: () => ({}),
    config: {
      env: 'test',
      refreshToken: 'secret',
      sourceNames: ['daraz']
    }
  });
}

describe('api routes', () => {
  it('GET /api/deals returns payload', async () => {
    const app = buildApp();
    const response = await request(app).get('/api/deals');

    expect(response.status).toBe(200);
    expect(response.body.deals).toHaveLength(1);
    expect(response.body.meta.totalDeals).toBe(1);
  });

  it('POST /api/refresh enforces token', async () => {
    const app = buildApp();
    const unauthorized = await request(app).post('/api/refresh');
    expect(unauthorized.status).toBe(401);

    const authorized = await request(app)
      .post('/api/refresh?token=secret')
      .send({});

    expect(authorized.status).toBe(200);
  });

  it('GET /health returns health shape', async () => {
    const app = buildApp();
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  it('GET /api/compare returns comparison payload', async () => {
    const app = buildApp();
    const response = await request(app).get('/api/compare?url=https://www.daraz.com.bd/example');

    expect(response.status).toBe(200);
    expect(response.body.seed.url).toContain('daraz.com.bd');
    expect(response.body.bestMatch.source).toBe('startech');
  });

  it('GET /api/source-search returns source+query payload', async () => {
    const app = buildApp();
    const response = await request(app).get('/api/source-search?sourceOrWebsite=daraz&q=iphone');

    expect(response.status).toBe(200);
    expect(response.body.meta.query).toBe('iphone');
    expect(response.body.results).toHaveLength(1);
  });

  it('GET /api/source-search validates q parameter', async () => {
    const app = buildApp();
    const response = await request(app).get('/api/source-search?sourceOrWebsite=daraz');

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Missing q parameter');
  });
});
