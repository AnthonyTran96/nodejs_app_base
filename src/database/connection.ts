import { DatabaseConnection as IDBConnection, DatabaseType, QueryResult } from '../types/database';
import { config } from '../config/environment';
import { logger } from '../utils/logger';

export class DatabaseConnection implements IDBConnection {
  private static instance: DatabaseConnection;
  private connection: unknown;
  private dbType: DatabaseType;

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
      } else if (this.dbType === 'mysql') {
        await this.initializeMySQL();
      }
      
      await this.runMigrations();
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

  private async initializeMySQL(): Promise<void> {
    const mysql = require('mysql2/promise');
    
    this.connection = await mysql.createConnection({
      host: config.database.host,
      port: config.database.port,
      user: config.database.username,
      password: config.database.password,
      database: config.database.database,
    });
  }

  private async runMigrations(): Promise<void> {
    // Create users table
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY ${this.dbType === 'mysql' ? 'AUTO_INCREMENT' : 'AUTOINCREMENT'},
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await this.execute(createUsersTable);
  }

  async query<T = unknown>(sql: string, params: unknown[] = []): Promise<QueryResult<T>> {
    if (this.dbType === 'sqlite') {
      return this.querySQLite<T>(sql, params);
    } else {
      return this.queryMySQL<T>(sql, params);
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

  private async queryMySQL<T>(sql: string, params: unknown[]): Promise<QueryResult<T>> {
    const connection = this.connection as any;
    const [rows] = await connection.execute(sql, params);
    
    return {
      rows: Array.isArray(rows) ? rows : [rows],
      rowCount: Array.isArray(rows) ? rows.length : 1,
    };
  }

  async execute(sql: string, params: unknown[] = []): Promise<void> {
    if (this.dbType === 'sqlite') {
      await this.executeSQLite(sql, params);
    } else {
      await this.executeMySQL(sql, params);
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

  private async executeMySQL(sql: string, params: unknown[]): Promise<void> {
    const connection = this.connection as any;
    await connection.execute(sql, params);
  }

  async beginTransaction(): Promise<void> {
    if (this.dbType === 'sqlite') {
      await this.execute('BEGIN TRANSACTION');
    } else {
      const connection = this.connection as any;
      await connection.beginTransaction();
    }
  }

  async commit(): Promise<void> {
    if (this.dbType === 'sqlite') {
      await this.execute('COMMIT');
    } else {
      const connection = this.connection as any;
      await connection.commit();
    }
  }

  async rollback(): Promise<void> {
    if (this.dbType === 'sqlite') {
      await this.execute('ROLLBACK');
    } else {
      const connection = this.connection as any;
      await connection.rollback();
    }
  }

  async close(): Promise<void> {
    if (this.connection) {
      if (this.dbType === 'sqlite') {
        const db = this.connection as any;
        return new Promise((resolve) => {
          db.close(() => {
            resolve();
          });
        });
      } else {
        const connection = this.connection as any;
        await connection.end();
      }
    }
  }
} 