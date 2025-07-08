// Filter types for advanced filtering
export type FilterOperator = '=' | '!=' | '<' | '<=' | '>' | '>=' | 'like' | 'in';

export type FilterValue = string | number | boolean | Date | Array<string | number>;

export interface FilterOptions {
  tableAlias?: string;
  filterMapping?: Record<string, { tableAlias: string; column: string }>;
}

export interface FieldFilter {
  op: FilterOperator;
  value: FilterValue;
}

export type AdvancedFilter<T> = {
  [K in keyof T]?: T[K] | FieldFilter;
} & {
  [key: string]: any;
};
