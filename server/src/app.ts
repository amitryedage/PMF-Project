import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { checkDatabaseHealth } from './config/db';
import { sendSuccess, sendError } from './utils/response';
import { errorHandler } from './middlewares/error.middleware';
import authRoutes from './modules/auth/auth.routes';

export const createApp = (): Application => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());

  app.get('/api/v1/health', async (_req: Request, res: Response) => {
    const isDbConnected = await checkDatabaseHealth();
    return sendSuccess(res, {
      status: 'UP',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: isDbConnected ? 'CONNECTED' : 'DISCONNECTED',
    });
  });

  app.use('/api/v1/auth', authRoutes);

  app.use((_req: Request, res: Response) => {
    return sendError(res, 'Route not found', 404);
  });

  app.use(errorHandler);

  return app;
};
