import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import compression from 'compression';
import helmet from 'helmet';
import morgan from 'morgan';

import createApiRouter from './routes/api.js';
import createWebRouter from './routes/web.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function createApp({ dealsService, compareService, sourceQueryService, productSearchService, getContext, config }) {
  const app = express();

  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(compression());
  app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(__dirname, 'public')));

  app.use('/', createWebRouter({
    dealsService,
    compareService,
    sourceQueryService,
    productSearchService,
    getContext,
    sourceNames: config.sourceNames
  }));

  app.use('/api', createApiRouter({
    dealsService,
    compareService,
    sourceQueryService,
    productSearchService,
    getContext,
    config
  }));

  app.get('/health', (req, res) => {
    res.json(dealsService.getHealth());
  });

  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  return app;
}
