import { Container } from '@/core/container';
import { ModuleRegistry } from '@/core/module-registry';

// Self-registering user module
ModuleRegistry.registerModule({
  name: 'UserModule',
  register: async (container: Container) => {
    // Import services for this module only
    const { UserRepository } = await import('@/modules/user/user.repository');
    const { UserService } = await import('@/modules/user/user.service');
    const { UserController } = await import('@/modules/user/user.controller');

    // Register user-related services
    container.register('UserRepository', UserRepository);

    container.register('UserService', UserService, {
      dependencies: ['UserRepository', 'UnitOfWork'],
    });

    container.register('UserController', UserController, {
      dependencies: ['UserService'],
    });
  },
});
