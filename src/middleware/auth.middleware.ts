import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '@/config/environment';
import { JwtPayload, AuthenticatedRequest } from '@/types/common';
import { UnauthorizedError, ForbiddenError } from '@/middleware/error-handler';
import { Role } from '@/types/role.enum';

export class AuthMiddleware {
  static authenticate(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
    try {
      const token = AuthMiddleware.extractToken(req);

      if (!token) {
        throw new UnauthorizedError('Access token is required');
      }

      const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
      req.user = payload;

      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        next(new UnauthorizedError('Invalid access token'));
      } else {
        next(error);
      }
    }
  }

  static authorize(...roles: Role[]) {
    return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
      if (!req.user) {
        next(new UnauthorizedError('Authentication required'));
        return;
      }

      if (roles.length > 0 && !roles.includes(req.user.role)) {
        next(new ForbiddenError('Insufficient permissions'));
        return;
      }

      next();
    };
  }

  static optional(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
    try {
      const token = AuthMiddleware.extractToken(req);

      if (token) {
        const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
        req.user = payload;
      }

      next();
    } catch (error) {
      // Continue without authentication for optional routes
      next();
    }
  }

  private static extractToken(req: Request): string | null {
    // Try Authorization header first
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Try cookie as fallback
    const cookieToken = req.cookies?.accessToken;
    if (cookieToken) {
      return cookieToken;
    }

    return null;
  }
}

// Convenience guards
export const AuthGuard = AuthMiddleware.authenticate;
export const OptionalAuthGuard = AuthMiddleware.optional;
export const RoleGuard = AuthMiddleware.authorize;
