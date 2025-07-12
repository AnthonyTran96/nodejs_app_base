import { config } from '@/config/environment';
import { BaseCoreSocket } from '@/modules/websocket/plugins/websocket-core';
import { WebSocketEventRegistry } from '@/modules/websocket/plugins/websocket-event-registry';
import { WebSocketService } from '@/modules/websocket/websocket.service';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { Server as SocketIOServer } from 'socket.io';

// Mock dependencies
jest.mock('socket.io');
jest.mock('jsonwebtoken');
jest.mock('@/modules/websocket/plugins/websocket-event-registry');
jest.mock('@/config/environment', () => ({
  config: {
    allowedOrigins: ['http://localhost:3000'],
    jwt: {
      secret: 'test-secret',
      refreshSecret: 'test-refresh-secret',
    },
  },
}));

describe('WebSocketService', () => {
  let webSocketService: WebSocketService;
  let mockEventRegistry: jest.Mocked<WebSocketEventRegistry>;
  let mockIoServer: jest.Mocked<SocketIOServer>;
  let mockSocket: jest.Mocked<BaseCoreSocket>;
  let mockHttpServer: jest.Mocked<HttpServer>;

  beforeEach(() => {
    // Mock WebSocketEventRegistry
    mockEventRegistry = {
      setupSocketEventHandlers: jest.fn(),
      registerPlugin: jest.fn(),
      getPlugins: jest.fn(),
      getPlugin: jest.fn(),
      emitBusinessEvent: jest.fn(),
      generateEventTypes: jest.fn(),
      cleanup: jest.fn(),
    } as any;

    // Mock Socket.IO server
    mockIoServer = {
      use: jest.fn(),
      on: jest.fn(),
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
      sockets: {
        sockets: new Map(),
        adapter: {
          rooms: new Map(),
        },
      },
    } as any;

    // Mock Socket
    mockSocket = {
      id: 'test-socket-id',
      data: {
        userId: 1,
        userRole: 'USER',
        userName: 'Test User',
        rooms: [],
        lastActivity: new Date(),
      },
      handshake: {
        auth: { token: 'test-token' },
        headers: {},
        address: '127.0.0.1',
      },
      join: jest.fn(),
      leave: jest.fn(),
      on: jest.fn(),
      use: jest.fn(),
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as any;

    // Mock HTTP server
    mockHttpServer = {} as any;

    // Mock Socket.IO constructor
    (SocketIOServer as unknown as jest.Mock).mockImplementation(() => mockIoServer);

    webSocketService = new WebSocketService(mockEventRegistry);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize Socket.IO server with correct configuration', () => {
      // Act
      webSocketService.initialize(mockHttpServer);

      // Assert
      expect(SocketIOServer).toHaveBeenCalledWith(mockHttpServer, {
        cors: {
          origin: config.allowedOrigins,
          credentials: true,
          methods: ['GET', 'POST'],
        },
        transports: ['websocket', 'polling'],
        pingTimeout: 60000,
        pingInterval: 25000,
      });
      expect(mockIoServer.use).toHaveBeenCalled();
      expect(mockIoServer.on).toHaveBeenCalledWith('connection', expect.any(Function));
    });
  });

  describe('handleConnection', () => {
    beforeEach(() => {
      webSocketService.initialize(mockHttpServer);
    });

    it('should handle new connection with authenticated user', async () => {
      // Arrange
      mockSocket.data.userId = 1;
      mockSocket.data.userName = 'Test User';

      // Act
      await webSocketService.handleConnection(mockSocket);

      // Assert
      expect(mockEventRegistry.setupSocketEventHandlers).toHaveBeenCalledWith(
        mockSocket,
        webSocketService
      );
      expect(mockSocket.join).toHaveBeenCalledWith('general');
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
      expect(webSocketService.getConnectionCount()).toBe(1);
    });

    it('should handle new connection with anonymous user', async () => {
      // Arrange
      delete mockSocket.data.userId;
      delete mockSocket.data.userName;

      // Act
      await webSocketService.handleConnection(mockSocket);

      // Assert
      expect(mockEventRegistry.setupSocketEventHandlers).toHaveBeenCalledWith(
        mockSocket,
        webSocketService
      );
      expect(mockSocket.join).toHaveBeenCalledWith('general');
      expect(webSocketService.getConnectionCount()).toBe(1);
    });
  });

  describe('handleDisconnection', () => {
    beforeEach(() => {
      webSocketService.initialize(mockHttpServer);
    });

    it('should handle disconnection and cleanup connection info', async () => {
      // Arrange
      await webSocketService.handleConnection(mockSocket);
      expect(webSocketService.getConnectionCount()).toBe(1);

      // Act
      await webSocketService.handleDisconnection(mockSocket);

      // Assert
      expect(webSocketService.getConnectionCount()).toBe(0);
    });
  });

  describe('joinRoom', () => {
    beforeEach(() => {
      webSocketService.initialize(mockHttpServer);
    });

    it('should join socket to room successfully', async () => {
      // Arrange
      const room = 'test-room';

      // Act
      await webSocketService.joinRoom(mockSocket, room);

      // Assert
      expect(mockSocket.join).toHaveBeenCalledWith(room);
    });
  });

  describe('leaveRoom', () => {
    beforeEach(() => {
      webSocketService.initialize(mockHttpServer);
    });

    it('should leave socket from room successfully', async () => {
      // Arrange
      const room = 'test-room';

      // Act
      await webSocketService.leaveRoom(mockSocket, room);

      // Assert
      expect(mockSocket.leave).toHaveBeenCalledWith(room);
    });
  });

  describe('broadcastToRoom', () => {
    beforeEach(() => {
      webSocketService.initialize(mockHttpServer);
    });

    it('should broadcast message to specific room', async () => {
      // Arrange
      const room = 'test-room';
      const event = 'test-event';
      const data = { message: 'test message' };

      // Act
      await webSocketService.broadcastToRoom(room, event, data);

      // Assert
      expect(mockIoServer.to).toHaveBeenCalledWith(room);
      expect(mockIoServer.emit).toHaveBeenCalledWith(event, data);
    });
  });

  describe('broadcastToUser', () => {
    beforeEach(() => {
      webSocketService.initialize(mockHttpServer);
    });

    it('should broadcast message to specific user', async () => {
      // Arrange
      const userId = 1;
      const event = 'test-event';
      const data = { message: 'test message' };

      // Setup user connection
      await webSocketService.handleConnection(mockSocket);

      // Act
      await webSocketService.broadcastToUser(userId, event, data);

      // Assert
      expect(mockIoServer.to).toHaveBeenCalledWith(mockSocket.id);
      expect(mockIoServer.emit).toHaveBeenCalledWith(event, data);
    });
  });

  describe('broadcastToAll', () => {
    beforeEach(() => {
      webSocketService.initialize(mockHttpServer);
    });

    it('should broadcast message to all connected clients', async () => {
      // Arrange
      const event = 'test-event';
      const data = { message: 'test message' };

      // Act
      await webSocketService.broadcastToAll(event, data);

      // Assert
      expect(mockIoServer.emit).toHaveBeenCalledWith(event, data);
    });
  });

  describe('sendNotification', () => {
    beforeEach(() => {
      webSocketService.initialize(mockHttpServer);
    });

    it('should send notification to specific user', async () => {
      // Arrange
      const target = { type: 'user' as const, userId: 1 };
      const message = 'Test notification';
      const type = 'info' as const;

      // Setup user connection
      await webSocketService.handleConnection(mockSocket);

      // Act
      await webSocketService.sendNotification(target, message, type);

      // Assert
      expect(mockIoServer.to).toHaveBeenCalledWith(mockSocket.id);
      expect(mockIoServer.emit).toHaveBeenCalledWith('notification', {
        message,
        type,
      });
    });

    it('should send notification to specific room', async () => {
      // Arrange
      const target = { type: 'room' as const, room: 'test-room' };
      const message = 'Test notification';
      const type = 'success' as const;

      // Act
      await webSocketService.sendNotification(target, message, type);

      // Assert
      expect(mockIoServer.to).toHaveBeenCalledWith('test-room');
      expect(mockIoServer.emit).toHaveBeenCalledWith('notification', {
        message,
        type,
      });
    });

    it('should send notification to all users', async () => {
      // Arrange
      const target = { type: 'all' as const };
      const message = 'Test notification';
      const type = 'warning' as const;

      // Act
      await webSocketService.sendNotification(target, message, type);

      // Assert
      expect(mockIoServer.emit).toHaveBeenCalledWith('notification', {
        message,
        type,
      });
    });
  });

  describe('getConnectionCount', () => {
    beforeEach(() => {
      webSocketService.initialize(mockHttpServer);
    });

    it('should return correct connection count', async () => {
      // Arrange
      expect(webSocketService.getConnectionCount()).toBe(0);

      // Act
      await webSocketService.handleConnection(mockSocket);

      // Assert
      expect(webSocketService.getConnectionCount()).toBe(1);
    });
  });

  describe('getUserConnections', () => {
    beforeEach(() => {
      webSocketService.initialize(mockHttpServer);
    });

    it('should return user connections', async () => {
      // Arrange
      const userId = 1;
      mockSocket.data.userId = userId;
      mockIoServer.sockets.sockets.set(mockSocket.id, mockSocket);

      // Setup user connection
      await webSocketService.handleConnection(mockSocket);

      // Act
      const connections = webSocketService.getUserConnections(userId);

      // Assert
      expect(connections).toHaveLength(1);
      expect(connections[0]).toBe(mockSocket);
    });

    it('should return empty array for user with no connections', () => {
      // Act
      const connections = webSocketService.getUserConnections(999);

      // Assert
      expect(connections).toHaveLength(0);
    });
  });

  describe('authentication middleware', () => {
    let authMiddleware: (socket: BaseCoreSocket, next: (err?: Error) => void) => Promise<void>;

    beforeEach(() => {
      webSocketService.initialize(mockHttpServer);
      // Get the auth middleware function
      const middlewareCall = (mockIoServer.use as jest.Mock).mock.calls[0];
      authMiddleware = middlewareCall[0];
    });

    it('should authenticate user with valid token', async () => {
      // Arrange
      const mockDecoded = { userId: 1, role: 'USER', name: 'Test User' };
      (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);
      const mockNext = jest.fn();

      // Act
      await authMiddleware(mockSocket, mockNext);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith('test-token', config.jwt.secret);
      expect(mockSocket.data.userId).toBe(1);
      expect(mockSocket.data.userRole).toBe('USER');
      expect(mockSocket.data.userName).toBe('Test User');
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should allow anonymous connection when no token provided', async () => {
      // Arrange
      delete mockSocket.handshake.auth.token;
      delete mockSocket.handshake.headers.authorization;
      delete mockSocket.data.userId;
      const mockNext = jest.fn();

      // Act
      await authMiddleware(mockSocket, mockNext);

      // Assert
      expect(jwt.verify).not.toHaveBeenCalled();
      expect(mockSocket.data.userId).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should allow anonymous connection when token is invalid', async () => {
      // Arrange
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });
      delete mockSocket.data.userId;
      const mockNext = jest.fn();

      // Act
      await authMiddleware(mockSocket, mockNext);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith('test-token', config.jwt.secret);
      expect(mockSocket.data.userId).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
    });
  });
});
