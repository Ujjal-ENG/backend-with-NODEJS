import { Router } from 'express';
import { scrapeGenericUrl } from '../scrapers/genericUrl.js';

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'gadgets', label: 'Gadgets' },
  { value: 'grocery', label: 'Grocery' }
];

const SORT_OPTIONS = [
  { value: 'discount', label: 'Best Discount' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'latest', label: 'Latest' }
];

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

function parseFinder(query) {
  return {
    sourceOrWebsite: String(query.finderSource || '').trim(),
    q: String(query.finderQ || '').trim(),
    limit: String(query.finderLimit || '8'),
    refresh: String(query.finderRefresh || '0')
  };
}

export default function createWebRouter({
  dealsService,
  compareService,
  sourceQueryService,
  productSearchService,
  getContext,
  sourceNames
}) {
  const router = Router();

  router.get('/', async (req, res) => {
    const filter = parseFilter(req.query);
    const finderQuery = parseFinder(req.query);
    const compareUrl = String(req.query.compareUrl || '').trim();
    const forceCompareRefresh = parseBoolean(req.query.compareRefresh);
    const forceFinderRefresh = parseBoolean(finderQuery.refresh);
    const searchQuery = String(req.query.searchQ || '').trim();
    const scrapeUrl = String(req.query.scrapeUrl || '').trim();

    try {
      const payload = await dealsService.getDeals({
        filter,
        forceRefresh: false,
        context: getContext()
      });

      let compareResult = null;
      let compareError = null;
      if (compareUrl && compareService) {
        try {
          compareResult = await compareService.compareByUrl({
            productUrl: compareUrl,
            context: getContext(),
            forceRefresh: forceCompareRefresh
          });
        } catch (error) {
          compareError = error.message;
        }
      }

      let finderResult = null;
      let finderError = null;
      if (finderQuery.q && sourceQueryService) {
        try {
          finderResult = await sourceQueryService.searchBySourceAndQuery({
            sourceOrWebsite: finderQuery.sourceOrWebsite,
            query: finderQuery.q,
            context: getContext(),
            forceRefresh: forceFinderRefresh,
            limit: Number.parseInt(finderQuery.limit, 10) || 8
          });
        } catch (error) {
          finderError = error.message;
        }
      }

      // Product search across all sites (lowest price finder)
      let searchResult = null;
      let searchError = null;
      if (searchQuery && productSearchService) {
        try {
          searchResult = await productSearchService.search({
            query: searchQuery,
            context: getContext()
          });
        } catch (error) {
          searchError = error.message;
        }
      }

      // Generic URL scraper
      let scrapeResult = null;
      let scrapeError = null;
      if (scrapeUrl) {
        try {
          scrapeResult = await scrapeGenericUrl(scrapeUrl, getContext());
        } catch (error) {
          scrapeError = error.message;
        }
      }

      res.render('layout', {
        pageTitle: 'Live BD Deals Scraper',
        bodyTemplate: 'index',
        payload,
        categoryOptions: CATEGORY_OPTIONS,
        sortOptions: SORT_OPTIONS,
        sourceOptions: sourceNames,
        query: filter,
        compareUrl,
        compareResult,
        compareError,
        finderQuery,
        finderResult,
        finderError,
        searchQuery,
        searchResult,
        searchError,
        scrapeUrl,
        scrapeResult,
        scrapeError
      });
    } catch (error) {
      res.status(500).render('layout', {
        pageTitle: 'Live BD Deals Scraper',
        bodyTemplate: 'index',
        payload: {
          meta: {
            generatedAt: new Date().toISOString(),
            fromCache: false,
            cacheAgeSec: null,
            filter,
            totalDeals: 0,
            page: 1,
            perPage: 120,
            totalPages: 1
          },
          deals: [],
          sources: []
        },
        categoryOptions: CATEGORY_OPTIONS,
        sortOptions: SORT_OPTIONS,
        sourceOptions: sourceNames,
        query: filter,
        pageError: error.message,
        compareUrl,
        compareResult: null,
        compareError: null,
        finderQuery,
        finderResult: null,
        finderError: null,
        searchQuery: searchQuery || '',
        searchResult: null,
        searchError: null,
        scrapeUrl: scrapeUrl || '',
        scrapeResult: null,
        scrapeError: null
      });
    }
  });

  return router;
}
