import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from '@/config/env';
import { logger } from '@/lib/logger';
import { errorMiddleware } from '@/middlewares/error.middleware';
import { apiRouter } from '@/modules/router';

export const createApp = () => {
  const app = express();

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
    }),
  );
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  app.use(cookieParser());
  app.use(
    morgan('combined', {
      stream: { write: (m) => logger.http ? logger.http(m.trim()) : logger.info(m.trim()) },
    }),
  );
  app.use(
    '/api/auth',
    rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false }),
  );

  app.get('/api/health', (_req, res) => res.json({ success: true, message: 'ok' }));

  app.use('/api', apiRouter);
  app.use(errorMiddleware);
  return app;
};
