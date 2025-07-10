import { Container } from '@/core/container';
import { ModuleRegistry } from '@/core/module-registry';
import { logger } from '@/utils/logger';

export class ContainerSetup {
  private readonly container: Container;

  constructor() {
    this.container = Container.getInstance();
  }

  async setupDependencies(): Promise<void> {
    try {
      // Import all module registries (this triggers their self-registration)
      await this.loadModules();

      // Initialize all registered modules
      await ModuleRegistry.initializeAllModules(this.container);

      // Initialize container
      await this.container.initialize();

      logger.info('✅ Dependency injection container initialized');
      logger.info(`📦 Loaded modules: ${ModuleRegistry.getRegisteredModules().join(', ')}`);
    } catch (error) {
      logger.error('❌ Failed to setup dependencies:', error);
      throw error;
    }
  }

  private async loadModules(): Promise<void> {
    // Import module registries to trigger self-registration
    // Each new module just needs to be added here
    await import('@/core/core.registry');
    await import('@/modules/user/user.registry');
    await import('@/modules/auth/auth.registry');
    await import('@/modules/post/post.registry');
    await import('@/modules/websocket/websocket.registry'); // 🔌 WebSocket module

    // 🎯 New modules can be added here by any developer
    // await import('@/modules/product/product.registry');
    // await import('@/modules/order/order.registry');
  }

  getContainer(): Container {
    return this.container;
  }
}
