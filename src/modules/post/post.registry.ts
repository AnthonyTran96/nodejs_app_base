import { Container } from '@/core/container';
import { ModuleRegistry } from '@/core/module-registry';

ModuleRegistry.registerModule({
  name: 'PostModule',
  register: async (container: Container) => {
    // Import services for this module only
    const { PostRepository } = await import('@/modules/post/post.repository');
    const { PostService } = await import('@/modules/post/post.service');
    const { PostController } = await import('@/modules/post/post.controller');

    // Register post-related services
    container.register('PostRepository', PostRepository);

    container.register('PostService', PostService, {
      dependencies: ['PostRepository', 'UnitOfWork', 'WebSocketService'],
    });

    container.register('PostController', PostController, {
      dependencies: ['PostService'],
    });
  },
});
