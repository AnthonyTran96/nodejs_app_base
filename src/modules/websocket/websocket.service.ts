import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { Server as SocketIOServer } from 'socket.io';

import { config } from '@/config/environment';
import { Service } from '@/core/container';

import {
  BaseCoreSocket,
  CoreClientToServerEvents,
  CoreServerToClientEvents,
  ICoreWebSocketService,
  InterServerEvents,
  RoomInfo,
  SocketData,
  WebSocketConnectionInfo,
  WebSocketEventPayload,
} from '@/modules/websocket/plugins/websocket-core';
import { WebSocketEventRegistry } from '@/modules/websocket/plugins/websocket-event-registry';
import { logger } from '@/utils/logger';

// Type alias for backward compatibility
type AuthenticatedSocket = BaseCoreSocket;

@Service('WebSocketService')
export class WebSocketService implements ICoreWebSocketService {
  private io!: SocketIOServer<
    CoreClientToServerEvents,
    CoreServerToClientEvents,
    InterServerEvents,
    SocketData
  >;
  private connections = new Map<string, WebSocketConnectionInfo>();
  private rooms = new Map<string, RoomInfo>();
  private userSockets = new Map<number, Set<string>>(); // userId -> Set of socketIds

  constructor(private readonly eventRegistry: WebSocketEventRegistry) {
    // Service will be initialized when server starts
  }

  /**
   * Initialize WebSocket server with HTTP server
   */
  initialize(httpServer: HttpServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: config.allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST'],
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    // Setup authentication middleware
    this.io.use(this.authenticationMiddleware.bind(this));

    // Handle connections
    this.io.on('connection', this.handleConnection.bind(this));

    logger.info('✅ WebSocket server initialized');
  }

  /**
   * Authentication middleware for WebSocket connections
   */
  private async authenticationMiddleware(
    socket: AuthenticatedSocket,
    next: (err?: Error) => void
  ): Promise<void> {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        // Allow anonymous connections but mark them as such
        socket.data.rooms = [];
        socket.data.lastActivity = new Date();
        return next();
      }

      // Verify JWT token
      const decoded = jwt.verify(token, config.jwt.secret) as any;

      if (decoded && decoded.userId) {
        socket.data.userId = decoded.userId;
        socket.data.userRole = decoded.role;
        socket.data.userName = decoded.name;
        socket.data.rooms = [];
        socket.data.lastActivity = new Date();

        logger.debug('WebSocket authenticated user connected', {
          userId: decoded.userId,
          role: decoded.role,
          socketId: socket.id,
        });
      }

      next();
    } catch (error) {
      logger.warn('WebSocket authentication failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        socketId: socket.id,
        ip: socket.handshake.address,
      });

      // Allow connection but as anonymous
      socket.data.rooms = [];
      socket.data.lastActivity = new Date();
      next();
    }
  }

  /**
   * Handle new WebSocket connection
   */
  async handleConnection(socket: AuthenticatedSocket): Promise<void> {
    const connectionInfo: WebSocketConnectionInfo = {
      socketId: socket.id,
      ...(socket.data.userId !== undefined && { userId: socket.data.userId }),
      ...(socket.data.userName !== undefined && { userName: socket.data.userName }),
      ...(socket.data.userRole !== undefined && { userRole: socket.data.userRole }),
      connectedAt: new Date(),
      lastActivity: new Date(),
      rooms: [],
    };

    this.connections.set(socket.id, connectionInfo);

    // Track user connections
    if (socket.data.userId) {
      if (!this.userSockets.has(socket.data.userId)) {
        this.userSockets.set(socket.data.userId, new Set());
      }
      this.userSockets.get(socket.data.userId)!.add(socket.id);
    }

    logger.info('WebSocket connection established', {
      socketId: socket.id,
      userId: socket.data.userId,
      totalConnections: this.connections.size,
    });

    // Setup event handlers using injected registry
    this.eventRegistry.setupSocketEventHandlers(socket, this);

    // Join general room
    await this.joinRoom(socket, 'general');

    // Notify about user joining (if authenticated)
    if (socket.data.userId && socket.data.userName) {
      this.broadcastToRoom('general', 'userJoined', {
        userId: socket.data.userId,
        name: socket.data.userName,
      });
    }

    // Send connection count to all clients
    this.broadcastToAll('connectionCount', { count: this.connections.size });

    // Handle disconnection
    socket.on('disconnect', () => this.handleDisconnection(socket));
  }

  /**
   * Handle WebSocket disconnection
   */
  async handleDisconnection(socket: AuthenticatedSocket): Promise<void> {
    const connectionInfo = this.connections.get(socket.id);

    if (connectionInfo) {
      // Remove from user connections tracking
      if (connectionInfo.userId) {
        const userSocketSet = this.userSockets.get(connectionInfo.userId);
        if (userSocketSet) {
          userSocketSet.delete(socket.id);
          if (userSocketSet.size === 0) {
            this.userSockets.delete(connectionInfo.userId);

            // Notify about user leaving if no more connections
            if (connectionInfo.userName) {
              this.broadcastToRoom('general', 'userLeft', {
                userId: connectionInfo.userId,
                name: connectionInfo.userName,
              });
            }
          }
        }
      }

      // Leave all rooms
      for (const room of connectionInfo.rooms) {
        socket.leave(room);
        this.updateRoomUserCount(room);
      }

      this.connections.delete(socket.id);
    }

    logger.info('WebSocket connection closed', {
      socketId: socket.id,
      userId: connectionInfo?.userId,
      totalConnections: this.connections.size,
    });

    // Send updated connection count
    this.broadcastToAll('connectionCount', { count: this.connections.size });
  }

  /**
   * Join a room
   */
  async joinRoom(socket: AuthenticatedSocket, room: string): Promise<void> {
    await socket.join(room);

    const connectionInfo = this.connections.get(socket.id);
    if (connectionInfo && !connectionInfo.rooms.includes(room)) {
      connectionInfo.rooms.push(room);
    }

    // Update or create room info
    if (!this.rooms.has(room)) {
      this.rooms.set(room, {
        name: room,
        users: [],
        createdAt: new Date(),
        type: this.getRoomType(room),
      });
    }

    this.updateRoomUserCount(room);

    logger.debug('Socket joined room', {
      socketId: socket.id,
      userId: socket.data.userId,
      room,
    });
  }

  /**
   * Leave a room
   */
  async leaveRoom(socket: AuthenticatedSocket, room: string): Promise<void> {
    await socket.leave(room);

    const connectionInfo = this.connections.get(socket.id);
    if (connectionInfo) {
      connectionInfo.rooms = connectionInfo.rooms.filter(r => r !== room);
    }

    this.updateRoomUserCount(room);

    logger.debug('Socket left room', {
      socketId: socket.id,
      userId: socket.data.userId,
      room,
    });
  }

  /**
   * Broadcast to a specific room
   */
  async broadcastToRoom(room: string, event: string, data: WebSocketEventPayload): Promise<void> {
    this.io.to(room).emit(event as any, data);

    logger.debug('Broadcast to room', {
      room,
      event,
      dataKeys: Object.keys(data || {}),
    });
  }

  /**
   * Broadcast to a specific user (all their connections)
   */
  async broadcastToUser(userId: number, event: string, data: WebSocketEventPayload): Promise<void> {
    const userSocketIds = this.userSockets.get(userId);
    if (userSocketIds) {
      for (const socketId of userSocketIds) {
        this.io.to(socketId).emit(event as any, data);
      }

      logger.debug('Broadcast to user', {
        userId,
        event,
        socketCount: userSocketIds.size,
        dataKeys: Object.keys(data || {}),
      });
    }
  }

  /**
   * Broadcast to all connected clients
   */
  async broadcastToAll(event: string, data: WebSocketEventPayload): Promise<void> {
    this.io.emit(event as any, data);

    logger.debug('Broadcast to all', {
      event,
      connectionCount: this.connections.size,
      dataKeys: Object.keys(data || {}),
    });
  }

  /**
   * Get total connection count
   */
  getConnectionCount(): number {
    return this.connections.size;
  }

  /**
   * Get user connections
   */
  getUserConnections(userId: number): AuthenticatedSocket[] {
    const socketIds = this.userSockets.get(userId);
    if (!socketIds) return [];

    return Array.from(socketIds)
      .map(socketId => this.io.sockets.sockets.get(socketId))
      .filter(socket => socket !== undefined) as AuthenticatedSocket[];
  }

  /**
   * Get room information
   */
  getRoomInfo(room: string): RoomInfo | null {
    return this.rooms.get(room) || null;
  }

  /**
   * Get Socket.IO server instance
   */
  getIOServer(): SocketIOServer {
    return this.io;
  }

  /**
   * Send notification to specific user or room
   */
  async sendNotification(
    target: { type: 'user'; userId: number } | { type: 'room'; room: string } | { type: 'all' },
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info'
  ): Promise<void> {
    const notificationData = { message, type };

    switch (target.type) {
      case 'user':
        await this.broadcastToUser(target.userId, 'notification', notificationData);
        break;
      case 'room':
        await this.broadcastToRoom(target.room, 'notification', notificationData);
        break;
      case 'all':
        await this.broadcastToAll('notification', notificationData);
        break;
    }
  }

  /**
   * Admin-only: Get all connections info
   */
  getAllConnections(): WebSocketConnectionInfo[] {
    return Array.from(this.connections.values());
  }

  /**
   * Admin-only: Get all rooms info
   */
  getAllRooms(): RoomInfo[] {
    return Array.from(this.rooms.values());
  }

  /**
   * Helper: Update room user count
   */
  private updateRoomUserCount(room: string): void {
    const roomInfo = this.rooms.get(room);
    if (roomInfo && this.io.sockets.adapter.rooms.has(room)) {
      const roomSockets = this.io.sockets.adapter.rooms.get(room);
      const userIds = new Set<number>();

      if (roomSockets) {
        for (const socketId of roomSockets) {
          const connection = this.connections.get(socketId);
          if (connection?.userId) {
            userIds.add(connection.userId);
          }
        }
      }

      roomInfo.users = Array.from(userIds);
    }
  }

  /**
   * Helper: Determine room type from room name
   */
  private getRoomType(room: string): 'general' | 'post' | 'user' | 'admin' {
    if (room === 'general') return 'general';
    if (room.startsWith('post:')) return 'post';
    if (room.startsWith('user:')) return 'user';
    if (room.startsWith('admin:')) return 'admin';
    return 'general';
  }
}
