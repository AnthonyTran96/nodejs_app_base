import 'reflect-metadata';
import { Application } from './app';
import { logger } from './utils/logger';
import { config } from './config/environment';

async function bootstrap(): Promise<void> {
  try {
    const app = new Application();
    await app.initialize();
    
    const server = app.listen(config.port, () => {
      logger.info(`🚀 Server running on port ${config.port} in ${config.nodeEnv} mode`);
      logger.info(`📚 API Documentation: http://localhost:${config.port}${config.apiPrefix}/docs`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}

void bootstrap(); 