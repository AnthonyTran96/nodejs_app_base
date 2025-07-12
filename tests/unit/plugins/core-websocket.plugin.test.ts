import { CoreWebSocketPlugin } from '@/modules/websocket/plugins/core-websocket.plugin';
import { BaseCoreSocket, ICoreWebSocketService } from '@/modules/websocket/plugins/websocket-core';

describe('CoreWebSocketPlugin', () => {
  let plugin: CoreWebSocketPlugin;
  let mockSocket: jest.Mocked<BaseCoreSocket>;
  let mockWsService: jest.Mocked<ICoreWebSocketService>;

  beforeEach(() => {
    plugin = new CoreWebSocketPlugin();

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
      on: jest.fn(),
      use: jest.fn(),
      emit: jest.fn(),
    } as any;

    // Mock WebSocket Service
    mockWsService = {
      handleConnection: jest.fn(),
      handleDisconnection: jest.fn(),
      joinRoom: jest.fn(),
      leaveRoom: jest.fn(),
      broadcastToRoom: jest.fn(),
      broadcastToUser: jest.fn(),
      broadcastToAll: jest.fn(),
      getConnectionCount: jest.fn(),
      getUserConnections: jest.fn(),
      getRoomInfo: jest.fn(),
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('plugin properties', () => {
    it('should have correct plugin name and version', () => {
      expect(plugin.name).toBe('CoreWebSocketPlugin');
      expect(plugin.version).toBe('1.0.0');
    });

    it('should have correct server-to-client events', () => {
      expect(plugin.serverToClientEvents).toEqual({
        notification: expect.any(Function),
        connectionCount: expect.any(Function),
        userJoined: expect.any(Function),
        userLeft: expect.any(Function),
      });
    });

    it('should have correct client-to-server events', () => {
      expect(plugin.clientToServerEvents).toEqual({
        joinRoom: expect.any(Function),
        leaveRoom: expect.any(Function),
        ping: expect.any(Function),
      });
    });
  });

  describe('setupEventHandlers', () => {
    it('should setup all core event handlers', () => {
      // Act
      plugin.setupEventHandlers(mockSocket, mockWsService);

      // Assert
      expect(mockSocket.on).toHaveBeenCalledWith('joinRoom', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('leaveRoom', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('ping', expect.any(Function));
      expect(mockSocket.use).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should handle joinRoom event', () => {
      // Arrange
      plugin.setupEventHandlers(mockSocket, mockWsService);
      const joinRoomHandler = (mockSocket.on as jest.Mock).mock.calls.find(
        call => call[0] === 'joinRoom'
      )[1];

      // Act
      joinRoomHandler('test-room');

      // Assert
      expect(mockWsService.joinRoom).toHaveBeenCalledWith(mockSocket, 'test-room');
    });

    it('should handle leaveRoom event', () => {
      // Arrange
      plugin.setupEventHandlers(mockSocket, mockWsService);
      const leaveRoomHandler = (mockSocket.on as jest.Mock).mock.calls.find(
        call => call[0] === 'leaveRoom'
      )[1];

      // Act
      leaveRoomHandler('test-room');

      // Assert
      expect(mockWsService.leaveRoom).toHaveBeenCalledWith(mockSocket, 'test-room');
    });

    it('should handle ping event', () => {
      // Arrange
      plugin.setupEventHandlers(mockSocket, mockWsService);
      const pingHandler = (mockSocket.on as jest.Mock).mock.calls.find(
        call => call[0] === 'ping'
      )[1];

      // Act
      pingHandler();

      // Assert
      expect(mockSocket.emit).toHaveBeenCalledWith('notification', {
        message: 'pong',
        type: 'info',
      });
      expect(mockSocket.data.lastActivity).toBeInstanceOf(Date);
    });

    it('should setup activity tracking middleware', () => {
      // Arrange
      plugin.setupEventHandlers(mockSocket, mockWsService);
      const middlewareHandler = (mockSocket.use as jest.Mock).mock.calls[0][0];
      const mockNext = jest.fn();

      // Act
      middlewareHandler(null, mockNext);

      // Assert
      expect(mockSocket.data.lastActivity).toBeInstanceOf(Date);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('onBusinessEvent', () => {
    it('should handle business event without throwing', async () => {
      // Arrange
      const eventType = 'test.event';
      const payload = { data: 'test' };

      // Act & Assert
      await expect(plugin.onBusinessEvent?.(eventType, payload)).resolves.toBeUndefined();
    });
  });

  describe('cleanup', () => {
    it('should cleanup without throwing', async () => {
      // Act & Assert
      await expect(plugin.cleanup()).resolves.toBeUndefined();
    });
  });
});
