import { Socket } from 'socket.io';

// WebSocket event types
export interface ServerToClientEvents {
  // User events
  userJoined: (data: { userId: number; name: string }) => void;
  userLeft: (data: { userId: number; name: string }) => void;

  // Post events
  postCreated: (data: { post: any; author: string }) => void;
  postUpdated: (data: { post: any; author: string }) => void;
  postDeleted: (data: { postId: number; author: string }) => void;

  // General events
  notification: (data: { message: string; type: 'info' | 'success' | 'warning' | 'error' }) => void;
  connectionCount: (count: number) => void;

  // Typing events
  typing: (data: { postId: number; isTyping: boolean; userId?: number; userName?: string }) => void;
}

export interface ClientToServerEvents {
  // Connection events
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;

  // Post events
  subscribeToPost: (postId: number) => void;
  unsubscribeFromPost: (postId: number) => void;

  // Typing indicators
  typing: (data: { postId: number; isTyping: boolean }) => void;

  // Ping for connection monitoring
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

// Authenticated Socket type
export type AuthenticatedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

// WebSocket connection info
export interface WebSocketConnectionInfo {
  socketId: string;
  userId?: number | undefined;
  userName?: string | undefined;
  userRole?: string | undefined;
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

// WebSocket events for business logic
export interface WebSocketEventData {
  type: string;
  payload: any;
  userId?: number;
  room?: string;
  timestamp: Date;
}

// WebSocket service interface
export interface IWebSocketService {
  // Connection management
  handleConnection(socket: AuthenticatedSocket): Promise<void>;
  handleDisconnection(socket: AuthenticatedSocket): Promise<void>;

  // Room management
  joinRoom(socket: AuthenticatedSocket, room: string): Promise<void>;
  leaveRoom(socket: AuthenticatedSocket, room: string): Promise<void>;

  // Broadcasting
  broadcastToRoom(room: string, event: string, data: any): Promise<void>;
  broadcastToUser(userId: number, event: string, data: any): Promise<void>;
  broadcastToAll(event: string, data: any): Promise<void>;

  // Connection info
  getConnectionCount(): number;
  getUserConnections(userId: number): AuthenticatedSocket[];
  getRoomInfo(room: string): RoomInfo | null;
}

// WebSocket middleware for authentication
export interface WebSocketAuthMiddleware {
  (socket: AuthenticatedSocket, next: (err?: Error) => void): void;
}
