import { Container } from '@/core/container';
import { ModuleRegistry } from '@/core/module-registry';

// Self-registering auth module
ModuleRegistry.registerModule({
  name: 'AuthModule',
  register: async (container: Container) => {
    // Import services for this module only
    const { AuthService } = await import('@/modules/auth/auth.service');
    const { AuthController } = await import('@/modules/auth/auth.controller');

    // Register auth-related services
    container.register('AuthService', AuthService, {
      dependencies: ['UserService'],
    });

    container.register('AuthController', AuthController, {
      dependencies: ['AuthService', 'UserService'],
    });
  },
});
