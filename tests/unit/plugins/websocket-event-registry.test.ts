import { BaseCoreSocket, ICoreWebSocketService } from '@/modules/websocket/plugins/websocket-core';
import { WebSocketEventRegistry } from '@/modules/websocket/plugins/websocket-event-registry';
import { WebSocketPlugin } from '@/modules/websocket/plugins/websocket-plugin.interface';

describe('WebSocketEventRegistry', () => {
  let registry: WebSocketEventRegistry;
  let mockPlugin: jest.Mocked<WebSocketPlugin>;
  let mockSocket: jest.Mocked<BaseCoreSocket>;
  let mockWsService: jest.Mocked<ICoreWebSocketService>;

  beforeEach(() => {
    registry = new WebSocketEventRegistry();

    // Mock Plugin
    mockPlugin = {
      name: 'TestPlugin',
      version: '1.0.0',
      serverToClientEvents: {
        testEvent: jest.fn(),
      },
      clientToServerEvents: {
        testClientEvent: jest.fn(),
      },
      setupEventHandlers: jest.fn(),
      onBusinessEvent: jest.fn(),
      cleanup: jest.fn(),
    };

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

  describe('registerPlugin', () => {
    it('should register a plugin successfully', () => {
      // Act
      registry.registerPlugin(mockPlugin);

      // Assert
      expect(registry.getPlugins()).toContain(mockPlugin);
      expect(registry.getPlugin('TestPlugin')).toBe(mockPlugin);
    });

    it('should not register the same plugin twice', () => {
      // Arrange
      registry.registerPlugin(mockPlugin);

      // Act
      registry.registerPlugin(mockPlugin);

      // Assert
      expect(registry.getPlugins()).toHaveLength(1);
    });

    it('should register plugin for business events when onBusinessEvent is available', () => {
      // Act
      registry.registerPlugin(mockPlugin);

      // Assert
      expect(registry.getPlugins()).toContain(mockPlugin);
    });

    it('should handle plugin without onBusinessEvent', () => {
      // Arrange
      const pluginWithoutBusinessEvent = {
        ...mockPlugin,
      };
      delete pluginWithoutBusinessEvent.onBusinessEvent;

      // Act
      registry.registerPlugin(pluginWithoutBusinessEvent);

      // Assert
      expect(registry.getPlugins()).toContain(pluginWithoutBusinessEvent);
    });
  });

  describe('getPlugins', () => {
    it('should return empty array when no plugins registered', () => {
      // Act
      const plugins = registry.getPlugins();

      // Assert
      expect(plugins).toEqual([]);
    });

    it('should return all registered plugins', () => {
      // Arrange
      const plugin2 = { ...mockPlugin, name: 'TestPlugin2' };
      registry.registerPlugin(mockPlugin);
      registry.registerPlugin(plugin2);

      // Act
      const plugins = registry.getPlugins();

      // Assert
      expect(plugins).toHaveLength(2);
      expect(plugins).toContain(mockPlugin);
      expect(plugins).toContain(plugin2);
    });
  });

  describe('getPlugin', () => {
    it('should return plugin by name', () => {
      // Arrange
      registry.registerPlugin(mockPlugin);

      // Act
      const plugin = registry.getPlugin('TestPlugin');

      // Assert
      expect(plugin).toBe(mockPlugin);
    });

    it('should return undefined for non-existent plugin', () => {
      // Act
      const plugin = registry.getPlugin('NonExistentPlugin');

      // Assert
      expect(plugin).toBeUndefined();
    });
  });

  describe('setupSocketEventHandlers', () => {
    it('should setup event handlers for all registered plugins', () => {
      // Arrange
      const plugin2 = { ...mockPlugin, name: 'TestPlugin2', setupEventHandlers: jest.fn() };
      registry.registerPlugin(mockPlugin);
      registry.registerPlugin(plugin2);

      // Act
      registry.setupSocketEventHandlers(mockSocket, mockWsService);

      // Assert
      expect(mockPlugin.setupEventHandlers).toHaveBeenCalledWith(mockSocket, mockWsService);
      expect(plugin2.setupEventHandlers).toHaveBeenCalledWith(mockSocket, mockWsService);
    });

    it('should handle plugin setup errors gracefully', () => {
      // Arrange
      mockPlugin.setupEventHandlers.mockImplementation(() => {
        throw new Error('Setup error');
      });
      registry.registerPlugin(mockPlugin);

      // Act & Assert
      expect(() => {
        registry.setupSocketEventHandlers(mockSocket, mockWsService);
      }).not.toThrow();
    });
  });

  describe('emitBusinessEvent', () => {
    it('should emit business event to all registered plugins', async () => {
      // Arrange
      const plugin2 = { ...mockPlugin, name: 'TestPlugin2', onBusinessEvent: jest.fn() };
      registry.registerPlugin(mockPlugin);
      registry.registerPlugin(plugin2);

      const event = {
        type: 'test.event',
        payload: { data: 'test' },
        source: 'test',
        timestamp: new Date(),
      };

      // Act
      await registry.emitBusinessEvent(event);

      // Assert
      expect(mockPlugin.onBusinessEvent).toHaveBeenCalledWith('test.event', event.payload);
      expect(plugin2.onBusinessEvent).toHaveBeenCalledWith('test.event', event.payload);
    });

    it('should handle plugins without onBusinessEvent', async () => {
      // Arrange
      const pluginWithoutBusinessEvent = {
        ...mockPlugin,
      };
      delete pluginWithoutBusinessEvent.onBusinessEvent;
      registry.registerPlugin(pluginWithoutBusinessEvent);

      const event = {
        type: 'test.event',
        payload: { data: 'test' },
        source: 'test',
        timestamp: new Date(),
      };

      // Act & Assert
      await expect(registry.emitBusinessEvent(event)).resolves.toBeUndefined();
    });

    it('should handle plugin business event errors gracefully', async () => {
      // Arrange
      (mockPlugin.onBusinessEvent as jest.Mock).mockRejectedValue(
        new Error('Business event error')
      );
      registry.registerPlugin(mockPlugin);

      const event = {
        type: 'test.event',
        payload: { data: 'test' },
        source: 'test',
        timestamp: new Date(),
      };

      // Act & Assert
      await expect(registry.emitBusinessEvent(event)).resolves.toBeUndefined();
    });
  });

  describe('generateEventTypes', () => {
    it('should generate merged event types from all plugins', () => {
      // Arrange
      const plugin2 = {
        ...mockPlugin,
        name: 'TestPlugin2',
        serverToClientEvents: {
          anotherEvent: jest.fn(),
        },
        clientToServerEvents: {
          anotherClientEvent: jest.fn(),
        },
      };
      registry.registerPlugin(mockPlugin);
      registry.registerPlugin(plugin2);

      // Act
      const types = registry.generateEventTypes();

      // Assert
      expect(types.serverToClientEvents).toEqual({
        testEvent: expect.any(Function),
        anotherEvent: expect.any(Function),
      });
      expect(types.clientToServerEvents).toEqual({
        testClientEvent: expect.any(Function),
        anotherClientEvent: expect.any(Function),
      });
    });

    it('should return empty objects when no plugins registered', () => {
      // Act
      const types = registry.generateEventTypes();

      // Assert
      expect(types.serverToClientEvents).toEqual({});
      expect(types.clientToServerEvents).toEqual({});
    });

    it('should handle plugins with empty event definitions', () => {
      // Arrange
      const pluginWithEmptyEvents = {
        ...mockPlugin,
        serverToClientEvents: {},
        clientToServerEvents: {},
      };
      registry.registerPlugin(pluginWithEmptyEvents);

      // Act
      const types = registry.generateEventTypes();

      // Assert
      expect(types.serverToClientEvents).toEqual({});
      expect(types.clientToServerEvents).toEqual({});
    });
  });

  describe('cleanup', () => {
    it('should cleanup all registered plugins', async () => {
      // Arrange
      const plugin2 = { ...mockPlugin, name: 'TestPlugin2', cleanup: jest.fn() };
      registry.registerPlugin(mockPlugin);
      registry.registerPlugin(plugin2);

      // Act
      await registry.cleanup();

      // Assert
      expect(mockPlugin.cleanup).toHaveBeenCalled();
      expect(plugin2.cleanup).toHaveBeenCalled();
    });

    it('should handle plugins without cleanup method', async () => {
      // Arrange
      const pluginWithoutCleanup = {
        ...mockPlugin,
      };
      delete pluginWithoutCleanup.cleanup;
      registry.registerPlugin(pluginWithoutCleanup);

      // Act & Assert
      await expect(registry.cleanup()).resolves.toBeUndefined();
    });

    it('should handle plugin cleanup errors gracefully', async () => {
      // Arrange
      (mockPlugin.cleanup as jest.Mock).mockRejectedValue(new Error('Cleanup error'));
      registry.registerPlugin(mockPlugin);

      // Act & Assert
      await expect(registry.cleanup()).resolves.toBeUndefined();
    });

    it('should clear all plugins after cleanup', async () => {
      // Arrange
      registry.registerPlugin(mockPlugin);
      expect(registry.getPlugins()).toHaveLength(1);

      // Act
      await registry.cleanup();

      // Assert
      expect(registry.getPlugins()).toHaveLength(0);
    });
  });
});
