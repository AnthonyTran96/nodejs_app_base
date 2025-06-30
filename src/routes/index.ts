import { Router } from 'express';
import { Container } from '../core/container';
import { AuthController } from '../controllers/auth.controller';
import { UserController } from '../controllers/user.controller';
import { createAuthRoutes } from './auth.routes';
import { createUserRoutes } from './user.routes';

export const router = Router();

// Initialize controllers from container
const container = Container.getInstance();

// Health check
router.get('/health', (_req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Node.js Backend API',
    version: '1.0.0'
  });
});

// API Documentation placeholder
router.get('/docs', (_req, res) => {
  res.json({
    message: 'API Documentation',
    endpoints: {
      auth: {
        'POST /auth/register': 'Register new user',
        'POST /auth/login': 'Login with email and password',
        'POST /auth/refresh': 'Refresh access token',
        'POST /auth/logout': 'Logout user',
        'GET /auth/profile': 'Get current user profile',
      },
      users: {
        'GET /users': 'Get all users (admin only)',
        'GET /users/:id': 'Get user by ID',
        'POST /users': 'Create new user (admin only)',
        'PUT /users/:id': 'Update user',
        'DELETE /users/:id': 'Delete user (admin only)',
        'POST /users/change-password': 'Change password',
        'GET /users/stats': 'Get user statistics (admin only)',
      },
    },
  });
});

// Register route modules
export function initializeRoutes(): void {
  try {
    const authController = container.get<AuthController>('AuthController');
    const userController = container.get<UserController>('UserController');
    
    router.use('/auth', createAuthRoutes(authController));
    router.use('/users', createUserRoutes(userController));
  } catch (error) {
    console.error('❌ Failed to initialize routes:', error);
    // Graceful degradation - routes will be registered when services are available
  }
} 