import { config } from '@/config/environment';
import { DatabaseConnection } from '@/database/connection';
import { PaginatedResult, PaginationOptions } from '@/types/common';
import { QueryResult } from '@/types/database';
import { AdvancedFilter } from '@/types/filter';
import { RepositorySchema } from '@/types/repository';
import { QueryBuilder } from '@/utils/query-builder';

export abstract class BaseRepository<T> {
  protected readonly db: DatabaseConnection;
  protected abstract readonly tableName: string;
  protected readonly schema: RepositorySchema<T> = {};

  constructor() {
    this.db = DatabaseConnection.getInstance();
  }

  async findById(id: number): Promise<T | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = ${QueryBuilder.createPlaceholder(0)} LIMIT 1`;
    const result = await this.db.query<T>(sql, [id]);
    const row = result.rows[0];
    return row ? this.transformRow(row) : null;
  }

  // Find all records without any filter, supports pagination and sorting
  async findAll(options?: PaginationOptions): Promise<PaginatedResult<T>> {
    return this.findByFilter({}, options);
  }

  // Find records by advanced filters, supports pagination and sorting
  async findByFilter(
    filters: AdvancedFilter<T> = {},
    options?: PaginationOptions
  ): Promise<PaginatedResult<T>> {
    let sql = `SELECT * FROM ${this.tableName}`;

    // Use QueryBuilder for filter processing, after transforming filter keys to snake_case
    const snakeCaseFilters = this.transformInputData(filters);
    const { where, params } = QueryBuilder.buildFilterWhereClause(snakeCaseFilters);

    if (where) {
      sql += ' WHERE ' + where;
    }

    // Sorting
    if (options?.sortBy) {
      const order = options.sortOrder || 'ASC';
      sql += ` ORDER BY ${options.sortBy} ${order}`;
    }

    // Count total records (with filters)
    let countSql = `SELECT COUNT(*) as total FROM ${this.tableName}`;
    if (where) {
      countSql += ' WHERE ' + where;
    }
    const countResult = await this.db.query<{ total: number }>(countSql, params);
    const total = countResult.rows[0]?.total || 0;

    // Pagination
    if (options?.limit && options?.page) {
      const offset = (options.page - 1) * options.limit;
      const limitPlaceholder = QueryBuilder.createPlaceholder(params.length);
      const offsetPlaceholder = QueryBuilder.createPlaceholder(params.length + 1);

      sql += ` LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`;
      params.push(options.limit, offset);
    }

    const result = await this.db.query<T>(sql, params);

    return {
      data: result.rows.map(row => this.transformRow(row)),
      meta: {
        page: options?.page || 1,
        limit: options?.limit || result.rows.length,
        total,
        totalPages: options?.limit ? Math.ceil(total / options.limit) : 1,
      },
    };
  }

  async create(data: Partial<T>): Promise<T> {
    const dbData = this.transformInputData(data);
    const fields = Object.keys(dbData).filter(key => (dbData as any)[key] !== undefined);
    const values = fields.map(key => (dbData as any)[key]);

    if (config.database.type === 'postgresql') {
      // PostgreSQL: Use $1, $2, $3 placeholders and RETURNING clause
      const placeholders = QueryBuilder.createPlaceholders(fields.length);
      const sql = `
        INSERT INTO ${this.tableName} (${fields.join(', ')})
        VALUES (${placeholders})
        RETURNING id
      `;

      const result = await this.db.query<{ id: number }>(sql, values);
      const id = result.rows[0]?.id;

      if (!id) {
        throw new Error('Failed to get created record ID');
      }

      const created = await this.findById(id);
      if (!created) {
        throw new Error('Failed to retrieve created record');
      }

      return created;
    } else {
      // SQLite: Use ? placeholders and separate query for last insert ID
      const placeholders = QueryBuilder.createPlaceholders(fields.length);
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
  }

  async update(id: number, data: Partial<T>): Promise<T | null> {
    const dbData = this.transformInputData(data);
    const fields = Object.keys(dbData).filter(key => (dbData as any)[key] !== undefined);
    if (fields.length === 0) {
      throw new Error('No data provided for update');
    }

    const setClause = fields
      .map((field, index) => `${field} = ${QueryBuilder.createPlaceholder(index)}`)
      .join(', ');
    const values = fields.map(key => (dbData as any)[key]);

    const sql = `
      UPDATE ${this.tableName}
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${QueryBuilder.createPlaceholder(fields.length)}
    `;

    await this.db.execute(sql, [...values, id]);
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const sql = `DELETE FROM ${this.tableName} WHERE id = ${QueryBuilder.createPlaceholder(0)}`;
    await this.db.execute(sql, [id]);

    // Check if the record was actually deleted
    const deleted = await this.findById(id);
    return deleted === null;
  }

  async exists(id: number): Promise<boolean> {
    const sql = `SELECT 1 FROM ${this.tableName} WHERE id = ${QueryBuilder.createPlaceholder(0)} LIMIT 1`;
    const result = await this.db.query(sql, [id]);
    return result.rows.length > 0;
  }

  private getLastInsertIdSql(): string {
    // This varies by database type
    if (config.database.type === 'postgresql') {
      return `SELECT lastval() as id`; // PostgreSQL
    } else {
      return 'SELECT last_insert_rowid() as id'; // SQLite
    }
  }

  protected async executeQuery<TResult = T>(
    sql: string,
    params: unknown[] = []
  ): Promise<QueryResult<TResult>> {
    return this.db.query<TResult>(sql, params);
  }

  protected transformRow(row: any): T {
    if (!row) {
      return row;
    }

    const transformed: { [key: string]: any } = {};

    // 1. Convert snake_case to camelCase
    for (const key in row) {
      if (Object.prototype.hasOwnProperty.call(row, key)) {
        const camelCaseKey = key.replace(/_([a-z])/g, g => (g[1] ? g[1].toUpperCase() : ''));
        transformed[camelCaseKey] = row[key];
      }
    }

    // 2. Apply type transformations based on schema
    for (const key in this.schema) {
      if (Object.prototype.hasOwnProperty.call(transformed, key)) {
        const fieldType = this.schema[key as keyof T];
        const originalValue = transformed[key];

        if (originalValue === null || originalValue === undefined) {
          continue;
        }

        switch (fieldType) {
          case 'boolean':
            transformed[key] = Boolean(originalValue);
            break;
          case 'number':
            transformed[key] = parseFloat(originalValue);
            break;
          case 'date':
            transformed[key] = new Date(originalValue);
            break;
          case 'json':
          case 'array':
            if (typeof originalValue === 'string') {
              try {
                transformed[key] = JSON.parse(originalValue);
              } catch (e) {
                console.error(`Failed to parse JSON/Array for key '${key}':`, originalValue);
              }
            }
            break;
          case 'bigint':
            try {
              transformed[key] = BigInt(originalValue);
            } catch (e) {
              console.error(`Failed to convert to BigInt for key '${key}':`, originalValue);
            }
            break;
          default:
            break;
        }
      }
    }

    return transformed as T;
  }

  protected transformInputData(data: any): any {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return data;
    }

    const snakeCaseData: { [key: string]: any } = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const snakeCaseKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        snakeCaseData[snakeCaseKey] = data[key];
      }
    }
    return snakeCaseData;
  }
}
