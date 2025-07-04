import { Router } from 'express';
import { initializeRoutes as initializeModuleRoutes } from '@/routes';
import { logger } from '@/utils/logger';

export const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Node.js Backend API',
    version: '1.0.0',
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

// Register route modules using centralized routes
export function initializeRoutes(): void {
  try {
    const moduleRouter = initializeModuleRoutes();
    router.use('/', moduleRouter);
  } catch (error) {
    logger.error('❌ Failed to initialize routes:', error);
    // Graceful degradation - routes will be registered when services are available
  }
}
