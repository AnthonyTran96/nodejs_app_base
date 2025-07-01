import { Container } from '@/core/container';
import { ModuleRegistry } from '@/core/module-registry';

// Self-registering core module for infrastructure services
ModuleRegistry.registerModule({
  name: 'CoreModule',
  register: async (container: Container) => {
    // Import core services
    const { UnitOfWork } = await import('@/core/unit-of-work');

    // Register core infrastructure services
    container.register('UnitOfWork', UnitOfWork);
  },
});
