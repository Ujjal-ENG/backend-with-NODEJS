import cron from 'node-cron';
import config from './config.js';
import logger from './lib/logger.js';
import { createHttpClient } from './lib/http.js';
import { closeBrowser } from './lib/browser.js';

import createApp from './app.js';
import RobotsService from './services/robotsService.js';
import CacheService from './services/cacheService.js';
import ScrapeCoordinator from './services/scrapeCoordinator.js';
import DealsService from './services/dealsService.js';
import PriceCompareService from './services/priceCompareService.js';
import SourceQueryService from './services/sourceQueryService.js';
import ProductSearchService from './services/productSearchService.js';

import DarazScraper from './scrapers/daraz.js';
import PickabooScraper from './scrapers/pickaboo.js';
import RyansScraper from './scrapers/ryans.js';
import StartechScraper from './scrapers/startech.js';
import ChaldalScraper from './scrapers/chaldal.js';
import ShwapnoScraper from './scrapers/shwapno.js';
import FacebookGraphScraper from './scrapers/facebookGraph.js';

const httpClient = createHttpClient({
  timeoutMs: config.requestTimeoutMs,
  userAgent: config.userAgent
});

const robotsService = new RobotsService({
  httpClient,
  userAgent: config.userAgent
});

const scrapers = [
  new DarazScraper(),
  new PickabooScraper(),
  new RyansScraper(),
  new StartechScraper(),
  new ChaldalScraper(),
  new ShwapnoScraper(),
  new FacebookGraphScraper()
];

const scrapeCoordinator = new ScrapeCoordinator({
  scrapers,
  sourceTimeoutMs: config.sourceTimeoutMs,
  scrapeConcurrency: config.scrapeConcurrency
});

const cacheService = new CacheService({
  ttlMinutes: config.cacheTtlMinutes
});

const dealsService = new DealsService({
  cacheService,
  scrapeCoordinator,
  configOverride: config
});

const compareService = new PriceCompareService({
  dealsService,
  configOverride: config
});

const sourceQueryService = new SourceQueryService({
  dealsService,
  configOverride: config
});

const productSearchService = new ProductSearchService({
  scrapers,
  concurrency: config.scrapeConcurrency
});

const sharedContext = {
  config,
  httpClient,
  robotsService
};

const app = createApp({
  dealsService,
  compareService,
  sourceQueryService,
  productSearchService,
  getContext: () => sharedContext,
  config
});

const server = app.listen(config.port, () => {
  logger.info(`Server is running on port ${config.port}`, {
    env: config.env
  });
});

server.on('error', (error) => {
  if (error && typeof error === 'object' && 'code' in error && error.code === 'EADDRINUSE') {
    logger.error(`Port ${config.port} is already in use. Set a different PORT and retry.`);
    process.exit(1);
  }
  logger.error('Server failed to start', {
    error: error instanceof Error ? error.message : String(error)
  });
  process.exit(1);
});

let cronTask;
if (config.enableBackgroundRefresh) {
  cronTask = cron.schedule('*/15 * * * *', async () => {
    logger.info('Cron refresh started');
    try {
      await dealsService.refreshNow(sharedContext);
      logger.info('Cron refresh completed');
    } catch (error) {
      logger.warn('Cron refresh failed', { error: error.message });
    }
  });
}

async function shutdown(signal) {
  logger.info(`Shutting down due to ${signal}`);
  if (cronTask) cronTask.stop();

  server.close(async () => {
    await closeBrowser();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
