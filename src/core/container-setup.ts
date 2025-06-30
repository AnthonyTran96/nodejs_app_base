import { Container } from '@/core/container';
import { initializeRoutes } from '@/core';
import { logger } from '@/utils/logger';

export class ContainerSetup {
  private readonly container: Container;

  constructor() {
    this.container = Container.getInstance();
  }

  async setupDependencies(): Promise<void> {
    try {
      // Import all services
      const { UserRepository } = await import('@/user/user.repository');
      const { UserService } = await import('@/user/user.service');
      const { AuthService } = await import('@/auth/auth.service');
      const { AuthController } = await import('@/auth/auth.controller');
      const { UserController } = await import('@/user/user.controller');
      const { UnitOfWork } = await import('@/core/unit-of-work');

      // Register services with their dependencies
      this.registerCoreServices(UnitOfWork);
      this.registerRepositories(UserRepository);
      this.registerServices(UserService, AuthService);
      this.registerControllers(AuthController, UserController);

      // Initialize container
      await this.container.initialize();

      // Initialize routes after container is ready
      initializeRoutes();

      logger.info('✅ Dependency injection container initialized');
    } catch (error) {
      logger.error('❌ Failed to setup dependencies:', error);
      throw error;
    }
  }

  private registerCoreServices(UnitOfWork: any): void {
    this.container.register('UnitOfWork', UnitOfWork);
  }

  private registerRepositories(UserRepository: any): void {
    this.container.register('UserRepository', UserRepository);
  }

  private registerServices(UserService: any, AuthService: any): void {
    this.container.register('UserService', UserService, {
      dependencies: ['UserRepository', 'UnitOfWork'],
    });

    this.container.register('AuthService', AuthService, {
      dependencies: ['UserService'],
    });
  }

  private registerControllers(AuthController: any, UserController: any): void {
    this.container.register('AuthController', AuthController, {
      dependencies: ['AuthService', 'UserService'],
    });

    this.container.register('UserController', UserController, {
      dependencies: ['UserService'],
    });
  }

  getContainer(): Container {
    return this.container;
  }
} 