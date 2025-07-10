import { Container } from '@/core/container';
import { ModuleRegistry } from '@/core/module-registry';

// Self-registering WebSocket module
ModuleRegistry.registerModule({
  name: 'WebSocketModule',
  register: async (container: Container) => {
    // Import services
    const { WebSocketService } = await import('@/modules/websocket/websocket.service');
    const { WebSocketController } = await import('@/modules/websocket/websocket.controller');
    const { TerminalService } = await import('@/modules/websocket/terminal.service');

    // Register terminal service first (dependency for WebSocketService)
    container.register('TerminalService', TerminalService);

    // Register WebSocket service with dependencies
    container.register('WebSocketService', WebSocketService, {
      dependencies: ['TerminalService'],
    });

    // Register WebSocket controller with dependencies
    container.register('WebSocketController', WebSocketController, {
      dependencies: ['WebSocketService', 'TerminalService'],
    });
  },
});
