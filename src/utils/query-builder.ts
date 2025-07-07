import { config } from '@/config/environment';
import { AdvancedFilter, FilterOperator } from '@/types/common';

interface FilterOptions {
  tableAlias?: string;
  filterMapping?: Record<string, { tableAlias: string; column: string }>;
}

export class QueryBuilder {
  static createPlaceholder(index: number): string {
    if (config.database.type === 'postgresql') {
      return `$${index + 1}`;
    } else {
      return '?';
    }
  }

  static createPlaceholders(count: number): string {
    const placeholders = [];
    for (let i = 0; i < count; i++) {
      placeholders.push(this.createPlaceholder(i));
    }
    return placeholders.join(', ');
  }

  static buildFilterWhereClause<T>(
    filters: AdvancedFilter<T>,
    options: FilterOptions = {}
  ): { where: string; params: unknown[] } {
    const whereClauses: string[] = [];
    const params: unknown[] = [];
    let paramIdx = 0;

    for (const key in filters) {
      const filter = filters[key];

      // Determine the actual column to use (with table alias if needed)
      let columnName = key;
      if (options.filterMapping && options.filterMapping[key]) {
        const mapping = options.filterMapping[key];
        columnName = `${mapping.tableAlias}.${mapping.column}`;
      } else if (options.tableAlias) {
        columnName = `${options.tableAlias}.${key}`;
      }

      if (typeof filter === 'object' && filter !== null && 'op' in filter) {
        const filterObj = filter as { op: FilterOperator; value: unknown };

        switch (filterObj.op) {
          case '=':
            whereClauses.push(`${columnName} = ${this.createPlaceholder(paramIdx++)}`);
            params.push(filterObj.value);
            break;
          case '!=':
            whereClauses.push(`${columnName} != ${this.createPlaceholder(paramIdx++)}`);
            params.push(filterObj.value);
            break;
          case '<':
            whereClauses.push(`${columnName} < ${this.createPlaceholder(paramIdx++)}`);
            params.push(filterObj.value);
            break;
          case '<=':
            whereClauses.push(`${columnName} <= ${this.createPlaceholder(paramIdx++)}`);
            params.push(filterObj.value);
            break;
          case '>':
            whereClauses.push(`${columnName} > ${this.createPlaceholder(paramIdx++)}`);
            params.push(filterObj.value);
            break;
          case '>=':
            whereClauses.push(`${columnName} >= ${this.createPlaceholder(paramIdx++)}`);
            params.push(filterObj.value);
            break;
          case 'like':
            whereClauses.push(`${columnName} LIKE ${this.createPlaceholder(paramIdx++)}`);
            params.push(filterObj.value);
            break;
          case 'in': {
            const arr = Array.isArray(filterObj.value) ? filterObj.value : [filterObj.value];
            const inPlaceholders = arr
              .map((_, i) => this.createPlaceholder(paramIdx + i))
              .join(', ');
            whereClauses.push(`${columnName} IN (${inPlaceholders})`);
            params.push(...arr);
            paramIdx += arr.length;
            break;
          }
        }
      } else {
        // Simple equality filter
        whereClauses.push(`${columnName} = ${this.createPlaceholder(paramIdx++)}`);
        params.push(filter);
      }
    }

    return {
      where: whereClauses.join(' AND '),
      params,
    };
  }
}
