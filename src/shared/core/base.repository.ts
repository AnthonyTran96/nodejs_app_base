import { DatabaseConnection } from '../database/connection';
import { QueryResult } from '../types/database';
import { PaginationOptions, PaginatedResult } from '../types/common';

export abstract class BaseRepository<T> {
  protected readonly db: DatabaseConnection;
  protected abstract readonly tableName: string;

  constructor() {
    this.db = DatabaseConnection.getInstance();
  }

  async findById(id: number): Promise<T | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = ? LIMIT 1`;
    const result = await this.db.query<T>(sql, [id]);
    const row = result.rows[0];
    return row ? this.transformDates(row) : null;
  }

  async findAll(options?: PaginationOptions): Promise<PaginatedResult<T>> {
    let sql = `SELECT * FROM ${this.tableName}`;
    const params: unknown[] = [];

    if (options?.sortBy) {
      const order = options.sortOrder || 'ASC';
      sql += ` ORDER BY ${options.sortBy} ${order}`;
    }

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM ${this.tableName}`;
    const countResult = await this.db.query<{ total: number }>(countSql);
    const total = countResult.rows[0]?.total || 0;

    // Apply pagination
    if (options?.limit && options?.page) {
      const offset = (options.page - 1) * options.limit;
      sql += ` LIMIT ? OFFSET ?`;
      params.push(options.limit, offset);
    }

    const result = await this.db.query<T>(sql, params);

    return {
      data: result.rows.map(row => this.transformDates(row)),
      meta: {
        page: options?.page || 1,
        limit: options?.limit || result.rows.length,
        total,
        totalPages: options?.limit ? Math.ceil(total / options.limit) : 1,
      },
    };
  }

  async create(data: Partial<T>): Promise<T> {
    const fields = Object.keys(data).filter(key => data[key as keyof T] !== undefined);
    const values = fields.map(key => data[key as keyof T]);
    const placeholders = fields.map(() => '?').join(', ');

    const sql = `
      INSERT INTO ${this.tableName} (${fields.join(', ')})
      VALUES (${placeholders})
    `;

    await this.db.execute(sql, values);

    // Get the created record (assuming auto-increment ID)
    const lastIdSql = this.getLastInsertIdSql();
    const lastIdResult = await this.db.query<{ id: number }>(lastIdSql);
    const id = lastIdResult.rows[0]?.id;

    if (!id) {
      throw new Error('Failed to get created record ID');
    }

    const created = await this.findById(id);
    if (!created) {
      throw new Error('Failed to retrieve created record');
    }

    return created;
  }

  async update(id: number, data: Partial<T>): Promise<T | null> {
    const fields = Object.keys(data).filter(key => data[key as keyof T] !== undefined);
    if (fields.length === 0) {
      throw new Error('No data provided for update');
    }

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(key => data[key as keyof T]);

    const sql = `
      UPDATE ${this.tableName}
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await this.db.execute(sql, [...values, id]);
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
    await this.db.execute(sql, [id]);

    // Check if the record was actually deleted
    const deleted = await this.findById(id);
    return deleted === null;
  }

  async exists(id: number): Promise<boolean> {
    const sql = `SELECT 1 FROM ${this.tableName} WHERE id = ? LIMIT 1`;
    const result = await this.db.query(sql, [id]);
    return result.rows.length > 0;
  }

  protected async executeQuery<TResult = T>(
    sql: string,
    params: unknown[] = []
  ): Promise<QueryResult<TResult>> {
    return this.db.query<TResult>(sql, params);
  }

  protected transformDates(record: any): T {
    // Transform string dates to Date objects
    if (record.created_at && typeof record.created_at === 'string') {
      record.createdAt = new Date(record.created_at);
      delete record.created_at;
    }
    if (record.updated_at && typeof record.updated_at === 'string') {
      record.updatedAt = new Date(record.updated_at);
      delete record.updated_at;
    }
    return record as T;
  }

  private getLastInsertIdSql(): string {
    // This varies by database type
    return 'SELECT last_insert_rowid() as id'; // SQLite
  }
}
