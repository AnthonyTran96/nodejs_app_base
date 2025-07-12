import { Service } from '@/core/container';
import { BaseCoreSocket, ICoreWebSocketService } from '@/modules/websocket/plugins/websocket-core';
import { logger } from '@/utils/logger';
import {
  EventHandlerMap,
  WebSocketBusinessEvent,
  WebSocketPlugin,
} from './websocket-plugin.interface';

@Service('WebSocketEventRegistry')
export class WebSocketEventRegistry {
  private plugins = new Map<string, WebSocketPlugin>();
  private eventHandlers = new Map<string, WebSocketPlugin[]>();

  /**
   * Register a WebSocket plugin from a module
   */
  registerPlugin(plugin: WebSocketPlugin): void {
    if (this.plugins.has(plugin.name)) {
      logger.warn(`WebSocket plugin '${plugin.name}' already registered, skipping`);
      return;
    }

    this.plugins.set(plugin.name, plugin);

    // Register event handlers if any
    if (plugin.onBusinessEvent) {
      // For now, register plugin for all events
      // In future, could be more specific based on event types
      const allHandlers = this.eventHandlers.get('*') || [];
      allHandlers.push(plugin);
      this.eventHandlers.set('*', allHandlers);
    }

    logger.info(`✅ WebSocket plugin '${plugin.name}' v${plugin.version} registered`);
  }

  /**
   * Get all registered plugins
   */
  getPlugins(): WebSocketPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get plugin by name
   */
  getPlugin(name: string): WebSocketPlugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Setup event handlers for all registered plugins on a new socket connection
   */
  setupSocketEventHandlers(socket: BaseCoreSocket, wsService: ICoreWebSocketService): void {
    for (const plugin of this.plugins.values()) {
      try {
        plugin.setupEventHandlers(socket, wsService);
        logger.debug(`Setup event handlers for plugin: ${plugin.name}`);
      } catch (error) {
        logger.error(`Failed to setup event handlers for plugin ${plugin.name}:`, error);
      }
    }
  }

  /**
   * Emit business event to all registered plugins
   */
  async emitBusinessEvent(event: WebSocketBusinessEvent): Promise<void> {
    const handlers = this.eventHandlers.get('*') || [];

    const promises = handlers.map(async plugin => {
      if (plugin.onBusinessEvent) {
        try {
          await plugin.onBusinessEvent(event.type, event.payload);
        } catch (error) {
          logger.error(`Plugin ${plugin.name} failed to handle event ${event.type}:`, error);
        }
      }
    });

    await Promise.all(promises);
  }

  /**
   * Generate merged TypeScript types for all plugins
   */
  generateEventTypes(): {
    serverToClientEvents: EventHandlerMap;
    clientToServerEvents: EventHandlerMap;
  } {
    const serverToClientEvents: EventHandlerMap = {};
    const clientToServerEvents: EventHandlerMap = {};

    for (const plugin of this.plugins.values()) {
      // Merge server-to-client events
      if (plugin.serverToClientEvents) {
        Object.assign(serverToClientEvents, plugin.serverToClientEvents);
      }

      // Merge client-to-server events
      if (plugin.clientToServerEvents) {
        Object.assign(clientToServerEvents, plugin.clientToServerEvents);
      }
    }

    return { serverToClientEvents, clientToServerEvents };
  }

  /**
   * Cleanup all plugins
   */
  async cleanup(): Promise<void> {
    const promises = Array.from(this.plugins.values()).map(async plugin => {
      if (plugin.cleanup) {
        try {
          await plugin.cleanup();
        } catch (error) {
          logger.error(`Plugin ${plugin.name} cleanup failed:`, error);
        }
      }
    });

    await Promise.all(promises);

    this.plugins.clear();
    this.eventHandlers.clear();
  }
}
