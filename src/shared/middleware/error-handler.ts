import { Request, Response, NextFunction } from 'express';
import { ResponseUtil } from '../utils/response';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly errors: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line no-unused-vars
  _next: NextFunction
): void => {
  // Log error details
  logger.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  // Handle different error types
  if (error instanceof ValidationError) {
    ResponseUtil.validationError(res, error.errors, error.message);
    return;
  }

  if (error instanceof NotFoundError) {
    ResponseUtil.notFound(res, error.message);
    return;
  }

  if (error instanceof UnauthorizedError) {
    ResponseUtil.unauthorized(res, error.message);
    return;
  }

  if (error instanceof ForbiddenError) {
    ResponseUtil.forbidden(res, error.message);
    return;
  }

  // Handle known HTTP errors
  if (error.statusCode) {
    ResponseUtil.error(res, error.message, error.statusCode);
    return;
  }

  // Default to 500 internal server error
  ResponseUtil.error(res, 'Internal Server Error', 500);
};
