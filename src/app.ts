import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { Server } from 'http';

import { ContainerSetup } from '@/core/container-setup';
import { DatabaseConnection } from '@/database/connection';
import { router } from '@/core';
import { errorHandler } from '@/middleware/error-handler';
import { requestLogger } from '@/middleware/request-logger';
import { notFoundHandler } from '@/middleware/not-found-handler';
import { config } from '@/config/environment';
import { logger } from '@/utils/logger';

export class Application {
  private readonly app: Express;
  private readonly containerSetup: ContainerSetup;

  constructor() {
    this.app = express();
    this.containerSetup = new ContainerSetup();
  }

  async initialize(): Promise<void> {
    await this.setupDatabase();
    this.setupMiddleware();
    await this.containerSetup.setupDependencies(); // Use ContainerSetup
    this.setupRoutes(); // Setup routes after dependencies are ready
    this.setupErrorHandling();
  }

  private async setupDatabase(): Promise<void> {
    try {
      const dbConnection = DatabaseConnection.getInstance();
      await dbConnection.initialize();
      logger.info('✅ Database connection established');
    } catch (error) {
      logger.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    this.app.use(
      cors({
        origin: config.nodeEnv === 'production' ? [] : true, // Configure for production
        credentials: true,
      })
    );

    // Request processing
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    this.app.use(cookieParser(config.cookieSecret));

    // Logging
    this.app.use(requestLogger);
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (_req, res) => {
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: config.nodeEnv,
      });
    });

    // API routes - mount after dependencies are initialized
    this.app.use(config.apiPrefix, router);
  }

  private setupErrorHandling(): void {
    this.app.use(notFoundHandler);
    this.app.use(errorHandler);
  }

  listen(port: number, callback?: () => void): Server {
    return this.app.listen(port, callback);
  }

  getApp(): Express {
    return this.app;
  }
}
