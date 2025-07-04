import { Router } from 'express';
import { Container } from '@/core/container';
import { AuthController } from '@/modules/auth/auth.controller';
import { UserController } from '@/modules/user/user.controller';
import { createAuthRoutes } from './auth.routes';
import { createUserRoutes } from './user.routes';

/**
 * API Routes Configuration
 * 
 * This file provides a centralized view of all API endpoints in the project.
 * Each module's routes are imported and registered here for better organization.
 * 
 * API Endpoints Overview:
 * 
 * 🔐 Authentication Routes (/api/v1/auth)
 * ├── POST /register     - User registration
 * ├── POST /login        - User login
 * ├── POST /refresh      - Token refresh
 * ├── POST /logout       - User logout
 * └── GET  /profile      - Get user profile
 * 
 * 👥 User Management Routes (/api/v1/users)
 * ├── GET    /           - Get all users (Admin only)
 * ├── GET    /stats      - Get user statistics (Admin only)
 * ├── GET    /:id        - Get user by ID
 * ├── POST   /           - Create new user (Admin only)
 * ├── PUT    /:id        - Update user
 * ├── DELETE /:id        - Delete user (Admin only)
 * └── POST   /change-password - Change user password
 * 
 * 🔒 Security Features:
 * - All routes (except auth) require authentication
 * - Admin-only routes are protected with RoleGuard
 * - Input sanitization applied to all user inputs
 * - Request validation using DTOs
 * - XSS protection enabled
 */

export function initializeRoutes(): Router {
  const router = Router();
  const container = Container.getInstance();

  // Get controllers from container with proper typing
  const authController = container.get<AuthController>('AuthController');
  const userController = container.get<UserController>('UserController');

  // Register route modules
  router.use('/auth', createAuthRoutes(authController));
  router.use('/users', createUserRoutes(userController));

  return router;
}

// Export individual route creators for testing or modular usage
export { createAuthRoutes } from './auth.routes';
export { createUserRoutes } from './user.routes'; 