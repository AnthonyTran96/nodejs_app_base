import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { Server } from 'http';

import { Container } from '@/core/container';
import { DatabaseConnection } from '@/database/connection';
import { router, initializeRoutes } from '@/core';
import { errorHandler } from '@/middleware/error-handler';
import { requestLogger } from '@/middleware/request-logger';
import { notFoundHandler } from '@/middleware/not-found-handler';
import { config } from '@/config/environment';
import { logger } from '@/utils/logger';

export class Application {
  private readonly app: Express;
  private readonly container: Container;

  constructor() {
    this.app = express();
    this.container = Container.getInstance();
  }

  async initialize(): Promise<void> {
    await this.setupDatabase();
    this.setupMiddleware();
    await this.setupDependencies(); // Setup dependencies first
    this.setupRoutes(); // Then setup routes after dependencies are ready
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

  private async setupDependencies(): Promise<void> {
    // Import and register services
    const { UserRepository } = await import('@/user/user.repository');
    const { UserService } = await import('@/user/user.service');
    const { AuthService } = await import('@/auth/auth.service');
    const { AuthController } = await import('@/auth/auth.controller');
    const { UserController } = await import('@/user/user.controller');
    const { UnitOfWork } = await import('@/core/unit-of-work');

    // Register services manually
    this.container.register('UserRepository', UserRepository);
    this.container.register('UnitOfWork', UnitOfWork);
    this.container.register('UserService', UserService, {
      dependencies: ['UserRepository', 'UnitOfWork'],
    });
    this.container.register('AuthService', AuthService, {
      dependencies: ['UserService'],
    });
    this.container.register('AuthController', AuthController, {
      dependencies: ['AuthService', 'UserService'],
    });
    this.container.register('UserController', UserController, {
      dependencies: ['UserService'],
    });

    // Initialize container
    await this.container.initialize();

    // Initialize routes after dependencies are registered
    initializeRoutes();

    logger.info('✅ Dependency injection container initialized');
  }

  listen(port: number, callback?: () => void): Server {
    return this.app.listen(port, callback);
  }

  getApp(): Express {
    return this.app;
  }
}
