import { Router } from 'express';
import { scrapeGenericUrl } from '../scrapers/genericUrl.js';

function parseFilter(query) {
  return {
    category: query.category || 'all',
    source: query.source || '',
    q: query.q || '',
    sort: query.sort || 'discount',
    page: query.page || '1',
    perPage: query.perPage || '120'
  };
}

function parseBoolean(value) {
  if (typeof value === 'boolean') return value;
  const normalized = String(value || '').toLowerCase().trim();
  return ['1', 'true', 'yes', 'on'].includes(normalized);
}

export default function createApiRouter({ dealsService, compareService, sourceQueryService, productSearchService, getContext, config }) {
  const router = Router();

  router.get('/deals', async (req, res) => {
    try {
      const filter = parseFilter(req.query);
      const payload = await dealsService.getDeals({
        filter,
        forceRefresh: false,
        context: getContext()
      });
      res.json(payload);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch deals',
        message: error.message
      });
    }
  });

  router.post('/refresh', async (req, res) => {
    const token = req.query.token || req.headers['x-refresh-token'];

    if (!config.refreshToken || token !== config.refreshToken) {
      return res.status(401).json({
        error: 'Unauthorized refresh request'
      });
    }

    try {
      const filter = parseFilter(req.query);
      const payload = await dealsService.getDeals({
        filter,
        forceRefresh: true,
        context: getContext()
      });
      return res.json(payload);
    } catch (error) {
      return res.status(500).json({
        error: 'Refresh failed',
        message: error.message
      });
    }
  });

  async function handleCompare(req, res) {
    if (!compareService) {
      return res.status(501).json({
        error: 'Compare service is not enabled'
      });
    }

    const productUrl = req.method === 'GET' ? req.query.url : req.body?.url;
    const refreshFlag =
      (req.method === 'GET' ? req.query.refresh : req.body?.refresh) || '0';
    const forceRefresh = parseBoolean(refreshFlag);

    if (!productUrl) {
      return res.status(400).json({
        error: 'Missing url parameter'
      });
    }

    try {
      const payload = await compareService.compareByUrl({
        productUrl: String(productUrl),
        context: getContext(),
        forceRefresh
      });
      return res.json(payload);
    } catch (error) {
      return res.status(500).json({
        error: 'Comparison failed',
        message: error.message
      });
    }
  }

  router.get('/compare', handleCompare);
  router.post('/compare', handleCompare);

  async function handleSourceSearch(req, res) {
    if (!sourceQueryService) {
      return res.status(501).json({
        error: 'Source query service is not enabled'
      });
    }

    const sourceOrWebsite =
      (req.method === 'GET' ? req.query.sourceOrWebsite : req.body?.sourceOrWebsite) ||
      (req.method === 'GET' ? req.query.source : req.body?.source) ||
      (req.method === 'GET' ? req.query.website : req.body?.website) ||
      '';
    const query = (req.method === 'GET' ? req.query.q : req.body?.q) || '';
    const limitRaw = (req.method === 'GET' ? req.query.limit : req.body?.limit) || '8';
    const refreshFlag =
      (req.method === 'GET' ? req.query.refresh : req.body?.refresh) || '0';
    const forceRefresh = parseBoolean(refreshFlag);

    if (!query) {
      return res.status(400).json({
        error: 'Missing q parameter'
      });
    }

    try {
      const payload = await sourceQueryService.searchBySourceAndQuery({
        sourceOrWebsite: String(sourceOrWebsite),
        query: String(query),
        context: getContext(),
        forceRefresh,
        limit: Number.parseInt(String(limitRaw), 10) || 8
      });
      return res.json(payload);
    } catch (error) {
      return res.status(500).json({
        error: 'Source query search failed',
        message: error.message
      });
    }
  }

  router.get('/source-search', handleSourceSearch);
  router.post('/source-search', handleSourceSearch);
  router.get('/query', handleSourceSearch);
  router.post('/query', handleSourceSearch);

  // Product search across all BD e-commerce sites - returns lowest price
  async function handleProductSearch(req, res) {
    if (!productSearchService) {
      return res.status(501).json({ error: 'Product search service is not enabled' });
    }

    const query = (req.method === 'GET' ? req.query.q : req.body?.q) || '';
    if (!query) {
      return res.status(400).json({ error: 'Missing q parameter. Example: /api/search?q=macbook m4 pro' });
    }

    try {
      const payload = await productSearchService.search({
        query: String(query),
        context: getContext()
      });
      return res.json(payload);
    } catch (error) {
      return res.status(500).json({ error: 'Product search failed', message: error.message });
    }
  }

  router.get('/search', handleProductSearch);
  router.post('/search', handleProductSearch);

  // Generic URL scraper - scrape any URL for product info
  async function handleScrapeUrl(req, res) {
    const url = (req.method === 'GET' ? req.query.url : req.body?.url) || '';
    if (!url) {
      return res.status(400).json({ error: 'Missing url parameter' });
    }

    try {
      const payload = await scrapeGenericUrl(String(url), getContext());
      return res.json(payload);
    } catch (error) {
      return res.status(500).json({ error: 'URL scrape failed', message: error.message });
    }
  }

  router.get('/scrape-url', handleScrapeUrl);
  router.post('/scrape-url', handleScrapeUrl);

  return router;
}
