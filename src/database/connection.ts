import { DatabaseConnection as IDBConnection, DatabaseType, QueryResult } from '@/types/database';
import { config } from '@/config/environment';
import { logger } from '@/utils/logger';

export class DatabaseConnection implements IDBConnection {
  private static instance: DatabaseConnection;
  private connection: unknown;
  private dbType: DatabaseType;
  private isConnected: boolean = false;

  private constructor() {
    this.dbType = config.database.type;
  }

  static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  async initialize(): Promise<void> {
    try {
      if (this.dbType === 'sqlite') {
        await this.initializeSQLite();
      } else if (this.dbType === 'postgresql') {
        await this.initializePostgreSQL();
      }

      this.isConnected = true;
      logger.info(`✅ ${this.dbType.toUpperCase()} database initialized`);
    } catch (error) {
      logger.error('Database initialization failed:', error);
      throw error;
    }
  }

  private async initializeSQLite(): Promise<void> {
    const sqlite3 = require('sqlite3').verbose();

    return new Promise((resolve, reject) => {
      this.connection = new sqlite3.Database(config.database.sqlitePath, (err: Error) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  private async initializePostgreSQL(): Promise<void> {
    const { Pool } = require('pg');

    this.connection = new Pool({
      host: config.database.host,
      port: config.database.port,
      user: config.database.username,
      password: config.database.password,
      database: config.database.database,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  async query<T = unknown>(sql: string, params: unknown[] = []): Promise<QueryResult<T>> {
    if (this.dbType === 'sqlite') {
      return this.querySQLite<T>(sql, params);
    } else {
      return this.queryPostgreSQL<T>(sql, params);
    }
  }

  private async querySQLite<T>(sql: string, params: unknown[]): Promise<QueryResult<T>> {
    const db = this.connection as any;

    return new Promise((resolve, reject) => {
      db.all(sql, params, (err: Error, rows: T[]) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            rows: rows || [],
            rowCount: rows ? rows.length : 0,
          });
        }
      });
    });
  }

  private async queryPostgreSQL<T>(sql: string, params: unknown[]): Promise<QueryResult<T>> {
    const pool = this.connection as any;
    const result = await pool.query(sql, params);

    return {
      rows: result.rows || [],
      rowCount: result.rowCount || 0,
    };
  }

  async execute(sql: string, params: unknown[] = []): Promise<void> {
    if (this.dbType === 'sqlite') {
      await this.executeSQLite(sql, params);
    } else {
      await this.executePostgreSQL(sql, params);
    }
  }

  private async executeSQLite(sql: string, params: unknown[]): Promise<void> {
    const db = this.connection as any;

    return new Promise((resolve, reject) => {
      db.run(sql, params, (err: Error) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  private async executePostgreSQL(sql: string, params: unknown[]): Promise<void> {
    const pool = this.connection as any;
    await pool.query(sql, params);
  }

  async beginTransaction(): Promise<void> {
    const beginSQL = this.dbType === 'sqlite' ? 'BEGIN TRANSACTION' : 'BEGIN';
    await this.execute(beginSQL);
  }

  async commit(): Promise<void> {
    await this.execute('COMMIT');
  }

  async rollback(): Promise<void> {
    await this.execute('ROLLBACK');
  }

  async close(): Promise<void> {
    if (!this.connection || !this.isConnected) return;

    try {
      if (this.dbType === 'sqlite') {
        const db = this.connection as any;
        await new Promise<void>((resolve, reject) => {
          db.close((err: Error) => {
            if (err && err.message && !err.message.includes('SQLITE_MISUSE')) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
      } else {
        const pool = this.connection as any;
        await pool.end();
      }

      this.connection = null;
      this.isConnected = false;
      logger.info(`✅ ${this.dbType.toUpperCase()} database connection closed`);
    } catch (error) {
      // Ignore errors if database is already closed
      if (error && (error as any).code !== 'SQLITE_MISUSE') {
        logger.error('Error closing database connection:', error);
      }
      
      // Still mark as closed even if error occurred
      this.connection = null;
      this.isConnected = false;
    }
  }
}
