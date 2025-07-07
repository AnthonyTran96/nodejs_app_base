export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

import { Role } from '@/types/role.enum';

export interface JwtPayload {
  userId: number;
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export type Constructor<T = {}> = new (...args: unknown[]) => T;

// Filter types for advanced filtering
export type FilterOperator = '=' | '!=' | '<' | '<=' | '>' | '>=' | 'like' | 'in';

export type FilterValue = string | number | boolean | Date | Array<string | number>;

export interface FieldFilter {
  op: FilterOperator;
  value: FilterValue;
}

export type AdvancedFilter<T> = {
  [K in keyof T]?: T[K] | FieldFilter;
} & {
  [key: string]: any;
};
