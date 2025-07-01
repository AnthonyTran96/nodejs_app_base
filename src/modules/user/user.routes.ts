import { Router } from 'express';
import { UserController } from '@/user/user.controller';
import { ValidateBody, ValidateParams, ValidateQuery } from '@/middleware/validation.middleware';
import { AuthGuard, RoleGuard } from '@/middleware/auth.middleware';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto } from '@/user/user.dto';
import { IdParamDto, PaginationDto } from '@/types/common.dto';
import { Role } from '@/types/role.enum';

export function createUserRoutes(userController: UserController): Router {
  const router = Router();

  // Public routes (none for users - all require authentication)

  // Protected routes
  router.use(AuthGuard); // All routes below require authentication

  // User management (admin only)
  router.get(
    '/',
    RoleGuard(Role.ADMIN),
    ValidateQuery(PaginationDto),
    userController.getUsers.bind(userController)
  );

  router.get('/stats', RoleGuard(Role.ADMIN), userController.getUserStats.bind(userController));

  router.get('/:id', ValidateParams(IdParamDto), userController.getUserById.bind(userController));

  router.post(
    '/',
    RoleGuard(Role.ADMIN),
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
    RoleGuard(Role.ADMIN),
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
