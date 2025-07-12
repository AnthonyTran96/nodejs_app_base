import { Container } from '@/core/container';
import { ModuleRegistry } from '@/core/module-registry';
import { logger } from '@/utils/logger';

ModuleRegistry.registerModule({
  name: 'WebSocketModule',
  register: async (container: Container) => {
    // Import WebSocket service and controller
    const { WebSocketService } = await import('@/modules/websocket/websocket.service');
    const { WebSocketController } = await import('@/modules/websocket/websocket.controller');
    const { WebSocketEventRegistry } = await import(
      '@/modules/websocket/plugins/websocket-event-registry'
    );
    const { CoreWebSocketPlugin } = await import(
      '@/modules/websocket/plugins/core-websocket.plugin'
    );

    // Register WebSocket Event Registry first
    container.register('WebSocketEventRegistry', WebSocketEventRegistry, {
      dependencies: [], // No dependencies for registry
    });

    // Register Core WebSocket Plugin
    container.register('CoreWebSocketPlugin', CoreWebSocketPlugin, {
      dependencies: [], // No dependencies for core plugin
    });

    // Register WebSocket service
    container.register('WebSocketService', WebSocketService, {
      dependencies: ['WebSocketEventRegistry'],
    });

    // Register WebSocket controller
    container.register('WebSocketController', WebSocketController, {
      dependencies: ['WebSocketService'],
    });

    // Register Core WebSocket Plugin with EventRegistry after container initialization
    setTimeout(async () => {
      try {
        const registry = container.get('WebSocketEventRegistry') as any;
        const corePlugin = container.get('CoreWebSocketPlugin') as any;
        registry.registerPlugin(corePlugin);
      } catch (error) {
        logger.error('Failed to register CoreWebSocketPlugin:', error);
      }
    }, 0);
  },
});
