import { Router } from 'express';
import { AuthController } from '@/modules/auth/auth.controller';
import { ValidateBody } from '@/middleware/validation.middleware';
import { SanitizeUserInput } from '@/middleware/sanitization.middleware';
import { AuthGuard } from '@/middleware/auth.middleware';
import { LoginDto, CreateUserDto } from '@/modules/user/user.dto';

export function createAuthRoutes(authController: AuthController): Router {
  const router = Router();

  router.post(
    '/register',
    SanitizeUserInput(),
    ValidateBody(CreateUserDto),
    authController.register.bind(authController)
  );
  router.post(
    '/login',
    SanitizeUserInput(),
    ValidateBody(LoginDto),
    authController.login.bind(authController)
  );
  router.post('/refresh', authController.refreshToken.bind(authController));
  router.post('/logout', AuthGuard, authController.logout.bind(authController));
  router.get('/profile', AuthGuard, authController.me.bind(authController));

  return router;
} 