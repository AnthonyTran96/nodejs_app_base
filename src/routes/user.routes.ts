import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { ValidateBody, ValidateParams, ValidateQuery } from '../middleware/validation.middleware';
import { AuthGuard, RoleGuard } from '../middleware/auth.middleware';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto } from '../dtos/user.dto';
import { IdParamDto, PaginationDto } from '../dtos/common.dto';

export function createUserRoutes(userController: UserController): Router {
  const router = Router();

  // Public routes (none for users - all require authentication)

  // Protected routes
  router.use(AuthGuard); // All routes below require authentication

  // User management (admin only)
  router.get(
    '/',
    RoleGuard('admin'),
    ValidateQuery(PaginationDto),
    userController.getUsers.bind(userController)
  );

  router.get(
    '/stats',
    RoleGuard('admin'),
    userController.getUserStats.bind(userController)
  );

  router.get(
    '/:id',
    ValidateParams(IdParamDto),
    userController.getUserById.bind(userController)
  );

  router.post(
    '/',
    RoleGuard('admin'),
    ValidateBody(CreateUserDto),
    userController.createUser.bind(userController)
  );

  router.put(
    '/:id',
    ValidateParams(IdParamDto),
    ValidateBody(UpdateUserDto),
    userController.updateUser.bind(userController)
  );

  router.delete(
    '/:id',
    RoleGuard('admin'),
    ValidateParams(IdParamDto),
    userController.deleteUser.bind(userController)
  );

  // User actions
  router.post(
    '/change-password',
    ValidateBody(ChangePasswordDto),
    userController.changePassword.bind(userController)
  );

  return router;
} 