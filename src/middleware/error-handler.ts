import { Request, Response, NextFunction } from 'express';
import { ResponseUtil } from '@/utils/response';
import { logger } from '@/utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class ValidationError extends Error {
  constructor(
    message = 'Validation failed',
    public readonly errors: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class BusinessLogicError extends Error {
  constructor(
    public readonly errorCode: string,
    message = ''
  ) {
    super(message);
    this.name = 'BusinessLogicError';
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

export class InternalServerError extends Error {
  constructor(message = 'Internal Server Error') {
    super(message);
    this.name = 'InternalServerError';
  }
}

export const errorHandler = (
  error: AppError | Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line no-unused-vars
  _next: NextFunction
): void => {
  // Prevent multiple responses
  if (res.headersSent) {
    return;
  }

  // Log error details
  logger.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  try {
    // Handle different error types
    if (error instanceof ValidationError) {
      ResponseUtil.validationError(res, error.errors, error.message);
      return;
    }

    if (error instanceof BusinessLogicError) {
      ResponseUtil.businessLogicError(res, error.errorCode, error.message);
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

    if (error instanceof InternalServerError) {
      ResponseUtil.internalServerError(res, error.message);
      return;
    }

    // Handle known HTTP errors
    if ((error as AppError).statusCode) {
      ResponseUtil.error(res, error.message, (error as AppError).statusCode!);
      return;
    }

    // Default to 500 internal server error
    ResponseUtil.error(res, 'Internal Server Error', 500);
  } catch (responseError) {
    // Last resort - if response utility fails
    logger.error('Error in error handler:', responseError);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Internal Server Error',
      });
    }
  }
};
