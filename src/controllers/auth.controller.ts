import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { ResponseUtil } from '../utils/response';
import { AuthenticatedRequest } from '../types/common';
import { Service } from '../core/container';

@Service('AuthController')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      
      const result = await this.authService.login(email, password);
      
      // Set cookies
      this.authService.setTokenCookies(res, result.tokens);
      
      ResponseUtil.success(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
      
      if (!refreshToken) {
        ResponseUtil.unauthorized(res, 'Refresh token is required');
        return;
      }

      const tokens = await this.authService.refreshToken(refreshToken);
      
      // Set new cookies
      this.authService.setTokenCookies(res, tokens);
      
      ResponseUtil.success(res, { tokens }, 'Tokens refreshed successfully');
    } catch (error) {
      next(error);
    }
  }

  async logout(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Clear cookies
      this.authService.clearTokenCookies(res);
      
      ResponseUtil.success(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  async me(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res, 'Authentication required');
        return;
      }

      ResponseUtil.success(res, req.user, 'User profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
} 