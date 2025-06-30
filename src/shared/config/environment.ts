import dotenv from 'dotenv';
import { DatabaseType } from '../types/database';

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
  readonly jwt: {
    readonly secret: string;
    readonly expiresIn: string;
    readonly refreshSecret: string;
    readonly refreshExpiresIn: string;
  };
  readonly cookieSecret: string;
  readonly logLevel: string;
}

function validateEnvironment(): void {
  const required = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'COOKIE_SECRET'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
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
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_DATABASE || 'nodejs_backend',
    sqlitePath: process.env.DB_SQLITE_PATH || './database.sqlite',
  },

  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  cookieSecret: process.env.COOKIE_SECRET!,
  logLevel: process.env.LOG_LEVEL || 'info',
};
