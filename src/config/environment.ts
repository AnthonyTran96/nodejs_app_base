/* eslint-disable no-console */
import { DatabaseType } from '@/types/database';
import dotenv from 'dotenv';

dotenv.config();

export interface Config {
  readonly nodeEnv: string;
  readonly port: number;
  readonly apiPrefix: string;
  readonly database: {
    readonly type: DatabaseType;
    readonly host: string;
    readonly port: number;
    readonly username: string;
    readonly password: string;
    readonly database: string;
    readonly sqlitePath: string;
  };
  readonly migration: {
    readonly autoRun: boolean;
    readonly requireManualApproval: boolean;
    readonly allowDataLoss: boolean;
    readonly timeoutMs: number;
  };
  readonly jwt: {
    readonly secret: string;
    readonly expiresIn: string;
    readonly refreshSecret: string;
    readonly refreshExpiresIn: string;
  };
  readonly allowedOrigins: string[];
  readonly cookieSecret: string;
  readonly logLevel: string;
}

function validateEnvironment(): void {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 🔐 Required secrets validation
  const requiredSecrets = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'COOKIE_SECRET'];
  const missingSecrets = requiredSecrets.filter(key => !process.env[key]);

  if (missingSecrets.length > 0) {
    errors.push(`Missing required security variables: ${missingSecrets.join(', ')}`);
  }

  // 🗄️ Database type validation
  const dbType = process.env.DB_TYPE;
  if (dbType && !['sqlite', 'postgresql'].includes(dbType)) {
    errors.push(`Invalid DB_TYPE: ${dbType}. Must be 'sqlite' or 'postgresql'`);
  }

  // 🏭 Production database validation
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv === 'production') {
    const currentDbType = dbType || 'sqlite';

    if (currentDbType === 'postgresql') {
      const requiredPostgreSQLVars = ['DB_HOST', 'DB_USERNAME', 'DB_PASSWORD', 'DB_DATABASE'];
      const missingPostgreSQLVars = requiredPostgreSQLVars.filter(key => !process.env[key]);

      if (missingPostgreSQLVars.length > 0) {
        errors.push(`Production PostgreSQL requires: ${missingPostgreSQLVars.join(', ')}`);
      }
    } else {
      warnings.push('🚨 Production using SQLite - consider PostgreSQL for production environments');
    }

    // Production secrets strength check
    const productionSecrets = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'COOKIE_SECRET'];
    for (const secret of productionSecrets) {
      const value = process.env[secret];
      if (value && value.length < 32) {
        warnings.push(
          `🔐 ${secret} is too short for production (minimum 32 characters recommended)`
        );
      }
      if (value && (value.includes('dev') || value.includes('test') || value.includes('example'))) {
        errors.push(`🚨 ${secret} contains development keywords - not safe for production`);
      }
    }
  }

  // 🔢 Numeric validations
  const port = parseInt(process.env.PORT || '3000', 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    errors.push(`Invalid PORT: ${process.env.PORT}. Must be a number between 1-65535`);
  }

  const dbPort = parseInt(process.env.DB_PORT || '3306', 10);
  if (process.env.DB_PORT && (isNaN(dbPort) || dbPort < 1 || dbPort > 65535)) {
    errors.push(`Invalid DB_PORT: ${process.env.DB_PORT}. Must be a number between 1-65535`);
  }

  const migrationTimeout = parseInt(process.env.MIGRATION_TIMEOUT_MS || '300000', 10);
  if (process.env.MIGRATION_TIMEOUT_MS && (isNaN(migrationTimeout) || migrationTimeout < 1000)) {
    errors.push(
      `Invalid MIGRATION_TIMEOUT_MS: ${process.env.MIGRATION_TIMEOUT_MS}. Must be >= 1000ms`
    );
  }

  // 🔧 Migration configuration validation
  const autoRun = process.env.AUTO_RUN_MIGRATIONS === 'true';
  const allowDataLoss = process.env.ALLOW_DATA_LOSS_MIGRATIONS === 'true';

  // Production safety checks
  if (nodeEnv === 'production') {
    if (autoRun) {
      warnings.push(
        '🚨 AUTO_RUN_MIGRATIONS=true in production - this is risky! Consider manual migration deployment.'
      );
    }

    if (allowDataLoss) {
      errors.push(
        '🚨 ALLOW_DATA_LOSS_MIGRATIONS=true in production - this is dangerous and not recommended!'
      );
    }
  }

  // Development recommendations
  if (nodeEnv === 'development') {
    if (!autoRun && !process.env.AUTO_RUN_MIGRATIONS) {
      warnings.push(
        '💡 Consider setting AUTO_RUN_MIGRATIONS=true in development for faster iteration'
      );
    }
  }

  // 📝 Log level validation
  const logLevel = process.env.LOG_LEVEL;
  if (logLevel && !['error', 'warn', 'info', 'debug'].includes(logLevel)) {
    warnings.push(`Invalid LOG_LEVEL: ${logLevel}. Valid values: error, warn, info, debug`);
  }

  // 🌐 CORS origins validation
  const allowedOrigins = process.env.ALLOWED_ORIGINS;
  if (allowedOrigins) {
    const origins = allowedOrigins.split(',').map(origin => origin.trim());

    if (nodeEnv === 'production') {
      const invalidOrigins = origins.filter(
        origin => !origin.startsWith('https://') && !origin.startsWith('http://localhost')
      );

      if (invalidOrigins.length > 0) {
        warnings.push(`🔒 Production origins should use HTTPS: ${invalidOrigins.join(', ')}`);
      }
    } else {
      // Development: warn about production origins in dev
      const productionOrigins = origins.filter(
        origin => origin.startsWith('https://') && !origin.includes('localhost')
      );

      if (productionOrigins.length > 0) {
        warnings.push(
          `💡 Using production HTTPS origins in development: ${productionOrigins.join(', ')}`
        );
      }
    }
  } else if (nodeEnv === 'production') {
    warnings.push(
      '🚨 ALLOWED_ORIGINS not set in production - using default domain. Set ALLOWED_ORIGINS for security.'
    );
  }

  // 🚨 Report errors and warnings
  if (warnings.length > 0) {
    console.warn('⚠️  Environment Configuration Warnings:');
    warnings.forEach(warning => console.warn(`   ${warning}`));
    console.warn('');
  }

  if (errors.length > 0) {
    console.error('❌ Environment Configuration Errors:');
    errors.forEach(error => console.error(`   ${error}`));
    console.error('');
    throw new Error(
      `Environment validation failed with ${errors.length} error(s). Please check your configuration.`
    );
  }

  // ✅ Success message
  if (nodeEnv === 'production') {
    console.log('✅ Production environment validation passed');
  }
}

validateEnvironment();

export const config: Config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || '/api/v1',

  database: {
    type: (process.env.DB_TYPE as DatabaseType) || 'sqlite',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_DATABASE || 'nodejs_backend',
    sqlitePath: process.env.DB_SQLITE_PATH || './database.sqlite',
  },

  migration: {
    autoRun: process.env.AUTO_RUN_MIGRATIONS === 'true',
    requireManualApproval:
      process.env.REQUIRE_MIGRATION_APPROVAL === 'true' || process.env.NODE_ENV === 'production',
    allowDataLoss: process.env.ALLOW_DATA_LOSS_MIGRATIONS === 'true',
    timeoutMs: parseInt(process.env.MIGRATION_TIMEOUT_MS || '300000', 10),
  },

  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  allowedOrigins: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : process.env.NODE_ENV === 'production'
      ? ['https://yourdomain.com']
      : [
          `http://localhost:${parseInt(process.env.PORT || '3000', 10)}`,
          `http://127.0.0.1:${parseInt(process.env.PORT || '3000', 10)}`,
          'http://localhost:3000', // Fallback cho common dev port
          'http://localhost:3001', // Fallback cho common dev port
          'http://127.0.0.1:3000',
          'http://127.0.0.1:3001',
        ],

  cookieSecret: process.env.COOKIE_SECRET!,
  logLevel: process.env.LOG_LEVEL || 'info',
};
