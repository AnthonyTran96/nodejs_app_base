import { Container } from '@/core/container';
import { ModuleRegistry } from '@/core/module-registry';

ModuleRegistry.registerModule({
  name: 'WebSocketModule',
  register: async (container: Container) => {
    // Import WebSocket service and controller
    const { WebSocketService } = await import('@/modules/websocket/websocket.service');
    const { WebSocketController } = await import('@/modules/websocket/websocket.controller');

    // Register WebSocket service
    container.register('WebSocketService', WebSocketService, {
      dependencies: [], // No additional dependencies for now
    });

    // Register WebSocket controller
    container.register('WebSocketController', WebSocketController, {
      dependencies: ['WebSocketService'],
    });
  },
});
