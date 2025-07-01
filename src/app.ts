import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import type { RequestHandler } from 'express';
import cookieParser from 'cookie-parser';
import { Server } from 'http';

import { ContainerSetup } from '@/core/container-setup';
import { DatabaseConnection } from '@/database/connection';
import { initializeRoutes, router } from '@/core';
import { errorHandler } from '@/middleware/error-handler';
import { requestLogger } from '@/middleware/request-logger';
import { notFoundHandler } from '@/middleware/not-found-handler';
import { config } from '@/config/environment';
import { logger } from '@/utils/logger';
import { MigrationManager } from '@/database/migrations/migration-manager';
import { registerMigrations } from '@/database/migrations';

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
    await this.containerSetup.setupDependencies();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private async setupDatabase(): Promise<void> {
    try {
      const dbConnection = DatabaseConnection.getInstance();
      await dbConnection.initialize();
      logger.info('✅ Database connection established');

      // 🔧 Migration strategy based on environment configuration
      const migrationManager = new MigrationManager();
      registerMigrations(migrationManager);

      if (config.migration.autoRun) {
        logger.info('🚀 Auto-run migrations enabled - running pending migrations...');
        await migrationManager.runPendingMigrations();
      } else {
        logger.info('ℹ️  Auto-run migrations disabled - checking for pending migrations...');
        const pendingMigrations = await migrationManager.checkPendingMigrations();
        
        if (pendingMigrations.length > 0) {
          if (config.nodeEnv === 'production') {
            logger.error('🚨 PRODUCTION: Pending migrations detected but auto-run is disabled');
            logger.error('   This may cause application errors if schema changes are required');
            logger.error('   Run migrations manually: yarn db:migrate');
            
            // Optionally throw error to prevent production startup with pending migrations
            if (config.migration.requireManualApproval) {
              throw new Error('Pending migrations detected in production. Run migrations manually before starting the application.');
            }
          } else {
            logger.warn('⚠️  Pending migrations detected. Consider running: yarn db:migrate');
          }
        }
      }

      logger.info('✅ Database setup completed');
    } catch (error) {
      logger.error('❌ Database setup failed:', error);
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
    this.app.use(compression() as unknown as RequestHandler);
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    this.app.use(cookieParser(config.cookieSecret));

    // Logging
    this.app.use(requestLogger);
  }

  private setupRoutes(): void {
    try {
      // Initialize all module routes through registry system
      initializeRoutes();

      // Mount API routes with configured prefix
      this.app.use(config.apiPrefix, router);

      logger.info('✅ Routes initialized successfully');
      logger.info(`🚀 API available at: ${config.apiPrefix}`);
    } catch (error) {
      logger.error('❌ Failed to setup routes:', error);
      throw error;
    }
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
