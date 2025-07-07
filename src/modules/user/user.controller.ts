import { Service } from '@/core/container';
import { NotFoundError, UnauthorizedError } from '@/middleware/error-handler';
import { AuthenticatedRequest } from '@/types/common';
import { UserService } from '@/user/user.service';
import { ResponseUtil } from '@/utils/response';
import { NextFunction, Response } from 'express';

@Service('UserController')
export class UserController {
  constructor(private readonly userService: UserService) {}

  async getUsers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, sortBy, sortOrder } = req.query;

      const result = await this.userService.findAll({
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'ASC' | 'DESC',
      });

      ResponseUtil.successWithPagination(res, result, 'Users retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = await this.userService.findById(Number(id));

      if (!user) {
        throw new NotFoundError('User not found');
      }

      ResponseUtil.success(res, user, 'User retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async createUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userData = req.body;
      const user = await this.userService.create(userData);

      ResponseUtil.success(res, user, 'User created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userData = req.body;

      const user = await this.userService.update(Number(id), userData);

      ResponseUtil.success(res, user, 'User updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await this.userService.delete(Number(id));

      ResponseUtil.success(res, null, 'User deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async changePassword(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const { currentPassword, newPassword } = req.body;

      await this.userService.changePassword(req.user.userId, currentPassword, newPassword);

      ResponseUtil.success(res, null, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  }

  async getUserStats(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await this.userService.getUserStats();
      ResponseUtil.success(res, stats, 'User statistics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
