import { Socket } from 'socket.io';

// Core WebSocket event types (general/connection only)
export interface CoreServerToClientEvents {
  // General connection events
  userJoined: (data: { userId: number; name: string }) => void;
  userLeft: (data: { userId: number; name: string }) => void;

  // System events
  notification: (data: { message: string; type: 'info' | 'success' | 'warning' | 'error' }) => void;
  connectionCount: (data: { count: number }) => void;
}

export interface CoreClientToServerEvents {
  // Core connection events
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;

  // System monitoring
  ping: () => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId?: number;
  userRole?: string;
  userName?: string;
  rooms: string[];
  lastActivity: Date;
}

// Base Socket type (will be extended by plugins)
export type BaseCoreSocket = Socket<
  CoreClientToServerEvents,
  CoreServerToClientEvents,
  InterServerEvents,
  SocketData
>;

// WebSocket connection info
export interface WebSocketConnectionInfo {
  socketId: string;
  userId?: number;
  userName?: string;
  userRole?: string;
  connectedAt: Date;
  lastActivity: Date;
  rooms: string[];
}

// Room management
export interface RoomInfo {
  name: string;
  users: number[];
  createdAt: Date;
  type: 'general' | 'post' | 'user' | 'admin';
}

// Generic WebSocket event data payload
export type WebSocketEventPayload = Record<string, unknown>;

// WebSocket events for business logic
export interface WebSocketEventData {
  type: string;
  payload: WebSocketEventPayload;
  userId?: number;
  room?: string;
  timestamp: Date;
}

// Core WebSocket service interface (only core functionality)
export interface ICoreWebSocketService {
  // Connection management
  handleConnection(socket: BaseCoreSocket): Promise<void>;
  handleDisconnection(socket: BaseCoreSocket): Promise<void>;

  // Room management
  joinRoom(socket: BaseCoreSocket, room: string): Promise<void>;
  leaveRoom(socket: BaseCoreSocket, room: string): Promise<void>;

  // Broadcasting
  broadcastToRoom(room: string, event: string, data: WebSocketEventPayload): Promise<void>;
  broadcastToUser(userId: number, event: string, data: WebSocketEventPayload): Promise<void>;
  broadcastToAll(event: string, data: WebSocketEventPayload): Promise<void>;

  // Connection info
  getConnectionCount(): number;
  getUserConnections(userId: number): BaseCoreSocket[];
  getRoomInfo(room: string): RoomInfo | null;
}

// WebSocket middleware for authentication
export interface WebSocketAuthMiddleware {
  (socket: BaseCoreSocket, next: (err?: Error) => void): void;
}
