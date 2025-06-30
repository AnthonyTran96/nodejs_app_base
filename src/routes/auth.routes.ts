import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { ValidateBody } from '../middleware/validation.middleware';
import { AuthGuard } from '../middleware/auth.middleware';
import { LoginDto, CreateUserDto } from '../dtos/user.dto';

export function createAuthRoutes(authController: AuthController): Router {
  const router = Router();

  router.post('/register', ValidateBody(CreateUserDto), authController.register.bind(authController));
  router.post('/login', ValidateBody(LoginDto), authController.login.bind(authController));
  router.post('/refresh', authController.refreshToken.bind(authController));
  router.post('/logout', AuthGuard, authController.logout.bind(authController));
  router.get('/profile', AuthGuard, authController.me.bind(authController));

  return router;
} 