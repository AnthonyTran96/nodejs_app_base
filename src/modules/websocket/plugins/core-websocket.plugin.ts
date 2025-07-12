import { Service } from '@/core/container';
import { BaseCoreSocket, ICoreWebSocketService } from '@/modules/websocket/plugins/websocket-core';
import { logger } from '@/utils/logger';
import { EventHandlerMap, WebSocketPlugin } from './websocket-plugin.interface';

@Service('CoreWebSocketPlugin')
export class CoreWebSocketPlugin implements WebSocketPlugin {
  readonly name = 'CoreWebSocketPlugin';
  readonly version = '1.0.0';

  // Core WebSocket events
  readonly serverToClientEvents: EventHandlerMap = {
    notification: () => {},
    connectionCount: () => {},
    userJoined: () => {},
    userLeft: () => {},
  };

  readonly clientToServerEvents: EventHandlerMap = {
    joinRoom: () => {},
    leaveRoom: () => {},
    ping: () => {},
  };

  /**
   * Setup core event handlers
   */
  setupEventHandlers(socket: BaseCoreSocket, wsService: ICoreWebSocketService): void {
    // Room management
    socket.on('joinRoom', (room: string) => {
      wsService.joinRoom(socket, room);
    });

    socket.on('leaveRoom', (room: string) => {
      wsService.leaveRoom(socket, room);
    });

    // Ping/pong for connection monitoring
    socket.on('ping', () => {
      (socket as any).emit('notification', {
        message: 'pong',
        type: 'info',
      });
      socket.data.lastActivity = new Date();
    });

    // Update activity timestamp on any event
    socket.use((_event, next) => {
      socket.data.lastActivity = new Date();
      next();
    });
  }

  /**
   * Core plugin doesn't handle business events
   */
  async onBusinessEvent?() // eventType: string,
  // payload: WebSocketEventPayload
  : Promise<void> {
    // Core plugin typically doesn't handle business events
    // This is for module-specific business logic
  }

  async cleanup(): Promise<void> {
    logger.info('Core WebSocket plugin cleaned up');
  }
}
