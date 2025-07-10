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

  // Terminal events
  terminalData: (data: { terminalId: string; data: string }) => void;
  terminalCreated: (data: { terminalId: string; cols: number; rows: number }) => void;
  terminalDestroyed: (data: { terminalId: string }) => void;
  terminalError: (data: { terminalId: string; error: string }) => void;
  terminalList: (data: { terminals: TerminalInfo[] }) => void;
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

  // Terminal events
  terminalCreate: (options: { cols?: number; rows?: number; shell?: string }) => void;
  terminalInput: (data: { terminalId: string; input: string }) => void;
  terminalResize: (data: { terminalId: string; cols: number; rows: number }) => void;
  terminalDestroy: (terminalId: string) => void;
  terminalList: () => void;
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
  type: 'general' | 'post' | 'user' | 'admin' | 'terminal';
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

// Terminal-specific types
export interface TerminalInfo {
  id: string;
  pid?: number;
  shell: string;
  cols: number;
  rows: number;
  createdAt: Date;
  userId?: number;
  userName?: string;
  status: 'running' | 'stopped' | 'error';
}

export interface TerminalSession {
  id: string;
  process?: any; // Will be node-pty IPty when available
  userId?: number;
  userName?: string;
  shell: string;
  cols: number;
  rows: number;
  createdAt: Date;
  lastActivity: Date;
  status: 'running' | 'stopped' | 'error';
  simulatedProcess?: SimulatedTerminal; // For simulation when node-pty is not available
}

export interface SimulatedTerminal {
  id: string;
  currentDirectory: string;
  environment: Record<string, string>;
  history: string[];
  commandCounter: number;
}
