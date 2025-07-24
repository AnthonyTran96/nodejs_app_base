import { ValidationError } from '@/middleware/error-handler';
import { Constructor } from '@/types/common';
import { plainToInstance } from 'class-transformer';
import { ValidationError as ClassValidationError, validate } from 'class-validator';
import { NextFunction, Request, Response } from 'express';

export function ValidationMiddleware<T>(
  dtoClass: Constructor<T>,
  source: 'body' | 'query' | 'params' = 'body'
) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = req[source];

      // Transform plain object to class instance
      const dto = plainToInstance(dtoClass, data);

      // Validate the DTO
      const errors = await validate(dto as object, {
        whitelist: true,
        // forbidNonWhitelisted: true,
      });

      if (errors.length > 0) {
        const validationErrors = formatValidationErrors(errors);
        const error = new ValidationError('Validation failed', validationErrors);
        next(error);
        return;
      }

      // Replace request data with validated DTO
      req[source] = dto;
      next();
    } catch (error) {
      next(error);
    }
  };
}

function formatValidationErrors(errors: ClassValidationError[]): Record<string, string[]> {
  const formattedErrors: Record<string, string[]> = {};

  for (const error of errors) {
    const property = error.property;
    const constraints = error.constraints || {};

    formattedErrors[property] = Object.values(constraints);
  }

  return formattedErrors;
}

// Convenience decorators/functions
export const ValidateBody = <T>(dtoClass: Constructor<T>) => ValidationMiddleware(dtoClass, 'body');

export const ValidateQuery = <T>(dtoClass: Constructor<T>) =>
  ValidationMiddleware(dtoClass, 'query');

export const ValidateParams = <T>(dtoClass: Constructor<T>) =>
  ValidationMiddleware(dtoClass, 'params');
