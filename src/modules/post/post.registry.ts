import { Container } from '@/core/container';
import { ModuleRegistry } from '@/core/module-registry';
import { logger } from '@/utils/logger';

// Self-registering post module
ModuleRegistry.registerModule({
  name: 'PostModule',
  register: async (container: Container) => {
    // Import services for this module only
    const { PostRepository } = await import('@/modules/post/post.repository');
    const { PostService } = await import('@/modules/post/post.service');
    const { PostController } = await import('@/modules/post/post.controller');
    const { PostWebSocketPlugin } = await import('@/modules/post/websocket/post-websocket.plugin');

    // Register post-related services
    container.register('PostRepository', PostRepository);

    // Register PostWebSocketPlugin with WebSocketService dependency
    container.register('PostWebSocketPlugin', PostWebSocketPlugin, {
      dependencies: ['WebSocketService'],
    });

    container.register('PostService', PostService, {
      dependencies: ['PostRepository', 'PostWebSocketPlugin'],
    });

    container.register('PostController', PostController, {
      dependencies: ['PostService'],
    });

    // Register the plugin with WebSocketEventRegistry after container initialization
    // This happens after all services are registered
    setTimeout(async () => {
      try {
        const registry = container.get('WebSocketEventRegistry') as any;
        const plugin = container.get('PostWebSocketPlugin') as any;
        registry.registerPlugin(plugin);
      } catch (error) {
        logger.error('Failed to register PostWebSocketPlugin:', error);
      }
    }, 0);
  },
});
