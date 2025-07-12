import {
  BaseCoreSocket,
  ICoreWebSocketService,
  WebSocketEventPayload,
} from '@/modules/websocket/plugins/websocket-core';

// Type alias for WebSocket event handlers
export type EventHandlerMap = Record<string, (...args: any[]) => void>;

export interface WebSocketPlugin {
  readonly name: string;
  readonly version: string;

  // Plugin registers its own event types
  readonly serverToClientEvents: EventHandlerMap;
  readonly clientToServerEvents: EventHandlerMap;

  // Setup event handlers for this plugin (called during socket connection)
  setupEventHandlers(socket: BaseCoreSocket, wsService: ICoreWebSocketService): void;

  // Handle business events (called by services when business events occur)
  onBusinessEvent?(eventType: string, payload: WebSocketEventPayload): Promise<void>;

  // Cleanup when plugin is removed
  cleanup?(): Promise<void>;
}

export interface WebSocketEventContext {
  userId?: number;
  userRole?: string;
  socketId: string;
  rooms: string[];
}

export interface WebSocketBusinessEvent<T extends WebSocketEventPayload = WebSocketEventPayload> {
  type: string;
  payload: T;
  source: string; // module name
  timestamp: Date;
  context?: WebSocketEventContext;
}
