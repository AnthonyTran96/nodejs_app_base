import { Request, Response, NextFunction } from 'express';
import { AuthService } from '@/auth/auth.service';
import { UserService } from '@/user/user.service';
import { ResponseUtil } from '@/utils/response';
import { AuthenticatedRequest } from '@/types/common';
import { Service } from '@/core/container';
import { UnauthorizedError } from '@/middleware/error-handler';

@Service('AuthController')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService
  ) {}

  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userData = req.body;

      // Create user
      const user = await this.userService.create(userData);

      // Login the user automatically
      const result = await this.authService.login(user.email, userData.password);

      // Set cookies
      this.authService.setTokenCookies(res, result.tokens);

      ResponseUtil.success(res, result, 'User registered successfully', 201);
    } catch (error) {
      next(error);
    }
  }

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
        throw new UnauthorizedError('Refresh token required');
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

      ResponseUtil.success(res, null, 'Logout successful');
    } catch (error) {
      next(error);
    }
  }

  async me(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      // Fetch full user object from database
      const user = await this.userService.findById(req.user.userId);
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      ResponseUtil.success(res, { user }, 'Profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
