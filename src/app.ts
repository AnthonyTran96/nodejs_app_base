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
        await migrationManager.runPendingMigrations(false); // false = auto-run, not manual
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
              throw new Error(
                'Pending migrations detected in production. Run migrations manually before starting the application.'
              );
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
    // Request timeout - prevent hanging requests
    this.app.use((req, res, next) => {
      const timeout = setTimeout(() => {
        if (!res.headersSent) {
          logger.error(`Request timeout: ${req.method} ${req.url}`);
          res.status(408).json({
            success: false,
            message: 'Request timeout',
          });
        }
      }, 30000); // 30 second timeout

      res.on('finish', () => clearTimeout(timeout));
      next();
    });

    // Security middleware
    this.app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
          },
        },
        hsts: {
          maxAge: 31536000, // 1 year
          includeSubDomains: true,
          preload: true,
        },
        noSniff: true,
        xssFilter: true,
        referrerPolicy: { policy: 'same-origin' },
      })
    );

    this.app.use(
      cors({
        origin: config.allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        exposedHeaders: ['X-Total-Count'],
        maxAge: 86400, // 24 hours preflight cache
      })
    );

    // Request processing
    this.app.use(compression() as unknown as RequestHandler);
    this.app.use(
      express.json({
        limit: '1mb',
        verify: (req, _res, buf) => {
          // Store raw body for potential debugging
          (req as any).rawBody = buf;
        },
      })
    );
    this.app.use(
      express.urlencoded({
        extended: true,
        limit: '1mb',
        verify: (req, _res, buf) => {
          // Store raw body for potential debugging
          (req as any).rawBody = buf;
        },
      })
    );
    this.app.use(cookieParser(config.cookieSecret));

    // Custom error handler for payload too large
    this.app.use((error: any, req: any, res: any, next: any) => {
      if (error && error.type === 'entity.too.large') {
        logger.warn(`Request too large: ${req.method} ${req.url}`, {
          contentLength: req.get('content-length'),
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });

        return res.status(413).json({
          success: false,
          message: 'Request payload too large. Maximum size allowed is 1MB.',
          error: 'PAYLOAD_TOO_LARGE',
          maxSize: '1MB',
        });
      }
      next(error);
    });

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
