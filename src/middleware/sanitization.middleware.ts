import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';

interface SanitizeOptions {
  fields?: string[]; // Specific fields to sanitize, if not provided, sanitize all string fields
  allowBasicHtml?: boolean; // Allow basic HTML tags like <b>, <i>, <u>
  logSanitization?: boolean; // Log when sanitization occurs
}

/**
 * Input Sanitization Middleware
 * Removes or escapes potentially dangerous HTML/JavaScript content
 */
export function SanitizeInput(options: SanitizeOptions = {}) {
  const { fields, allowBasicHtml = false, logSanitization = true } = options;

  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      // Sanitize request body
      if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body, fields, allowBasicHtml, logSanitization);
      }

      // Sanitize query parameters
      if (req.query && typeof req.query === 'object') {
        req.query = sanitizeObject(req.query, fields, allowBasicHtml, logSanitization);
      }

      // Sanitize URL parameters
      if (req.params && typeof req.params === 'object') {
        req.params = sanitizeObject(req.params, fields, allowBasicHtml, logSanitization);
      }

      next();
    } catch (error) {
      logger.error('Sanitization middleware error:', error);
      next(error);
    }
  };
}

function sanitizeObject(
  obj: any,
  targetFields?: string[],
  allowBasicHtml = false,
  logSanitization = true
): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, targetFields, allowBasicHtml, logSanitization));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        // Check if we should sanitize this field
        const shouldSanitize = !targetFields || targetFields.includes(key);

        if (shouldSanitize) {
          const originalValue = value;
          sanitized[key] = sanitizeString(value, allowBasicHtml);

          // Log if content was modified
          if (logSanitization && sanitized[key] !== originalValue) {
            logger.warn(`Sanitized potentially dangerous content in field: ${key}`, {
              original: originalValue,
              sanitized: sanitized[key],
              field: key,
            });
          }
        } else {
          sanitized[key] = value;
        }
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeObject(value, targetFields, allowBasicHtml, logSanitization);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj, allowBasicHtml);
  }

  return obj;
}

function sanitizeString(input: string, allowBasicHtml = false): string {
  if (!input || typeof input !== 'string') {
    return input;
  }

  // Remove script tags and their content
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove javascript: protocols
  sanitized = sanitized.replace(/javascript:/gi, '');

  // Remove on* event handlers (onclick, onload, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^>\s]+/gi, '');

  // Remove dangerous HTML tags
  const dangerousTags = [
    'script',
    'iframe',
    'object',
    'embed',
    'form',
    'input',
    'textarea',
    'button',
    'link',
    'meta',
    'style',
    'base',
    'frame',
    'frameset',
    'applet',
  ];

  dangerousTags.forEach(tag => {
    const regex = new RegExp(`<\\/?${tag}\\b[^>]*>`, 'gi');
    sanitized = sanitized.replace(regex, '');
  });

  if (!allowBasicHtml) {
    // Remove all HTML tags if basic HTML is not allowed
    sanitized = sanitized.replace(/<[^>]*>/g, '');
  } else {
    // Allow only safe HTML tags
    const allowedTags = ['b', 'i', 'u', 'strong', 'em', 'br', 'p'];
    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;

    sanitized = sanitized.replace(tagRegex, (_match, tagName) => {
      if (allowedTags.includes(tagName.toLowerCase())) {
        // For allowed tags, remove any attributes to prevent XSS
        return `<${tagName.toLowerCase()}>`;
      }
      return ''; // Remove disallowed tags
    });
  }

  // Encode remaining potentially dangerous characters
  sanitized = sanitized
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

  return sanitized;
}

// Convenience functions for common use cases
export const SanitizeBody = (options?: SanitizeOptions) => SanitizeInput({ ...options });

export const SanitizeUserInput = () =>
  SanitizeInput({
    fields: ['name', 'email', 'bio', 'description', 'comment', 'message'],
    allowBasicHtml: false,
    logSanitization: true,
  });

export const SanitizeContentInput = () =>
  SanitizeInput({
    fields: ['content', 'description', 'bio', 'message'],
    allowBasicHtml: true,
    logSanitization: true,
  });
