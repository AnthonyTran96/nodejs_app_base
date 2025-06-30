import { Response } from 'express';
import { ApiResponse, PaginatedResult } from '../types/common';

export class ResponseUtil {
  static success<T>(
    res: Response,
    data?: T,
    message = 'Success',
    statusCode = 200
  ): Response<ApiResponse<T>> {
    return res.status(statusCode).json({
      success: true,
      data,
      message,
    });
  }

  static successWithPagination<T>(
    res: Response,
    result: PaginatedResult<T>,
    message = 'Success',
    statusCode = 200
  ): Response<ApiResponse<T[]>> {
    return res.status(statusCode).json({
      success: true,
      data: result.data,
      message,
      meta: result.meta,
    });
  }

  static error(
    res: Response,
    message = 'Internal Server Error',
    statusCode = 500,
    errors?: Record<string, string[]>
  ): Response<ApiResponse> {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
    });
  }

  static validationError(
    res: Response,
    errors: Record<string, string[]>,
    message = 'Validation failed'
  ): Response<ApiResponse> {
    return res.status(400).json({
      success: false,
      message,
      errors,
    });
  }

  static notFound(
    res: Response,
    message = 'Resource not found'
  ): Response<ApiResponse> {
    return res.status(404).json({
      success: false,
      message,
    });
  }

  static unauthorized(
    res: Response,
    message = 'Unauthorized'
  ): Response<ApiResponse> {
    return res.status(401).json({
      success: false,
      message,
    });
  }

  static forbidden(
    res: Response,
    message = 'Forbidden'
  ): Response<ApiResponse> {
    return res.status(403).json({
      success: false,
      message,
    });
  }
} 