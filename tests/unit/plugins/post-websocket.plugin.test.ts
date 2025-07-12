import { PostResponse } from '@/models/post.model';
import { PostWebSocketPlugin } from '@/modules/post/websocket/post-websocket.plugin';
import { BaseCoreSocket, ICoreWebSocketService } from '@/modules/websocket/plugins/websocket-core';

describe('PostWebSocketPlugin', () => {
  let plugin: PostWebSocketPlugin;
  let mockSocket: jest.Mocked<BaseCoreSocket>;
  let mockWsService: jest.Mocked<ICoreWebSocketService>;

  const mockPost: PostResponse = {
    id: 1,
    title: 'Test Post',
    content: 'Test content',
    authorId: 1,
    published: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
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

    plugin = new PostWebSocketPlugin(mockWsService);

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
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('plugin properties', () => {
    it('should have correct plugin name and version', () => {
      expect(plugin.name).toBe('PostWebSocketPlugin');
      expect(plugin.version).toBe('1.0.0');
    });

    it('should have correct server-to-client events', () => {
      expect(plugin.serverToClientEvents).toEqual({
        postCreated: expect.any(Function),
        postUpdated: expect.any(Function),
        postDeleted: expect.any(Function),
        typing: expect.any(Function),
      });
    });

    it('should have correct client-to-server events', () => {
      expect(plugin.clientToServerEvents).toEqual({
        subscribeToPost: expect.any(Function),
        unsubscribeFromPost: expect.any(Function),
        typing: expect.any(Function),
      });
    });
  });

  describe('setupEventHandlers', () => {
    it('should setup all post-related event handlers', () => {
      // Act
      plugin.setupEventHandlers(mockSocket, mockWsService);

      // Assert
      expect(mockSocket.on).toHaveBeenCalledWith('subscribeToPost', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('unsubscribeFromPost', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('typing', expect.any(Function));
    });

    it('should handle subscribeToPost event', () => {
      // Arrange
      plugin.setupEventHandlers(mockSocket, mockWsService);
      const subscribeHandler = (mockSocket.on as jest.Mock).mock.calls.find(
        call => call[0] === 'subscribeToPost'
      )[1];

      // Act
      subscribeHandler(1);

      // Assert
      expect(mockWsService.joinRoom).toHaveBeenCalledWith(mockSocket, 'post:1');
    });

    it('should handle unsubscribeFromPost event', () => {
      // Arrange
      plugin.setupEventHandlers(mockSocket, mockWsService);
      const unsubscribeHandler = (mockSocket.on as jest.Mock).mock.calls.find(
        call => call[0] === 'unsubscribeFromPost'
      )[1];

      // Act
      unsubscribeHandler(1);

      // Assert
      expect(mockWsService.leaveRoom).toHaveBeenCalledWith(mockSocket, 'post:1');
    });

    it('should handle typing event', () => {
      // Arrange
      plugin.setupEventHandlers(mockSocket, mockWsService);
      const typingHandler = (mockSocket.on as jest.Mock).mock.calls.find(
        call => call[0] === 'typing'
      )[1];

      // Act
      typingHandler({ postId: 1, isTyping: true });

      // Assert
      expect(mockSocket.to).toHaveBeenCalledWith('post:1');
      expect(mockSocket.emit).toHaveBeenCalledWith('typing', {
        postId: 1,
        isTyping: true,
        userId: 1,
        userName: 'Test User',
      });
    });

    it('should not emit typing event if user is not authenticated', () => {
      // Arrange
      delete mockSocket.data.userId;
      delete mockSocket.data.userName;
      plugin.setupEventHandlers(mockSocket, mockWsService);
      const typingHandler = (mockSocket.on as jest.Mock).mock.calls.find(
        call => call[0] === 'typing'
      )[1];

      // Act
      typingHandler({ postId: 1, isTyping: true });

      // Assert
      expect(mockSocket.to).not.toHaveBeenCalled();
      expect(mockSocket.emit).not.toHaveBeenCalled();
    });
  });

  describe('onBusinessEvent', () => {
    it('should handle post.created event', async () => {
      // Arrange
      const payload = {
        type: 'created',
        postId: 1,
        authorId: 1,
        authorName: 'Test Author',
        title: 'Test Post',
        content: 'Test content',
      };

      // Act
      await plugin.onBusinessEvent('post.created', payload);

      // Assert
      expect(mockWsService.broadcastToRoom).toHaveBeenCalledWith('general', 'postCreated', {
        post: payload,
        author: 'Test Author',
      });
    });

    it('should handle post.updated event', async () => {
      // Arrange
      const payload = {
        type: 'updated',
        postId: 1,
        authorId: 1,
        authorName: 'Test Author',
        title: 'Updated Post',
        content: 'Updated content',
      };

      // Act
      await plugin.onBusinessEvent('post.updated', payload);

      // Assert
      expect(mockWsService.broadcastToRoom).toHaveBeenCalledWith('general', 'postUpdated', {
        post: payload,
        author: 'Test Author',
      });
      expect(mockWsService.broadcastToRoom).toHaveBeenCalledWith('post:1', 'postUpdated', {
        post: payload,
        author: 'Test Author',
      });
    });

    it('should handle post.deleted event', async () => {
      // Arrange
      const payload = {
        type: 'deleted',
        postId: 1,
        authorId: 1,
        authorName: 'Test Author',
      };

      // Act
      await plugin.onBusinessEvent('post.deleted', payload);

      // Assert
      expect(mockWsService.broadcastToRoom).toHaveBeenCalledWith('general', 'postDeleted', {
        postId: 1,
        author: 'Test Author',
      });
      expect(mockWsService.broadcastToRoom).toHaveBeenCalledWith('post:1', 'postDeleted', {
        postId: 1,
        author: 'Test Author',
      });
    });

    it('should ignore unknown event types', async () => {
      // Arrange
      const payload = { type: 'unknown' };

      // Act
      await plugin.onBusinessEvent('unknown.event', payload);

      // Assert
      expect(mockWsService.broadcastToRoom).not.toHaveBeenCalled();
      expect(mockWsService.broadcastToUser).not.toHaveBeenCalled();
      expect(mockWsService.broadcastToAll).not.toHaveBeenCalled();
    });
  });

  describe('public notification methods', () => {
    it('should notify post created', async () => {
      // Arrange
      const authorName = 'Test Author';

      // Act
      await plugin.notifyPostCreated(mockPost, authorName);

      // Assert
      expect(mockWsService.broadcastToRoom).toHaveBeenCalledWith('general', 'postCreated', {
        post: {
          type: 'created',
          postId: mockPost.id,
          authorId: mockPost.authorId,
          authorName,
          title: mockPost.title,
          content: mockPost.content,
        },
        author: authorName,
      });
    });

    it('should notify post updated', async () => {
      // Arrange
      const authorName = 'Test Author';

      // Act
      await plugin.notifyPostUpdated(mockPost, authorName);

      // Assert
      expect(mockWsService.broadcastToRoom).toHaveBeenCalledWith('general', 'postUpdated', {
        post: {
          type: 'updated',
          postId: mockPost.id,
          authorId: mockPost.authorId,
          authorName,
          title: mockPost.title,
          content: mockPost.content,
        },
        author: authorName,
      });
      expect(mockWsService.broadcastToRoom).toHaveBeenCalledWith(
        `post:${mockPost.id}`,
        'postUpdated',
        {
          post: {
            type: 'updated',
            postId: mockPost.id,
            authorId: mockPost.authorId,
            authorName,
            title: mockPost.title,
            content: mockPost.content,
          },
          author: authorName,
        }
      );
    });

    it('should notify post deleted', async () => {
      // Arrange
      const authorName = 'Test Author';

      // Act
      await plugin.notifyPostDeleted(mockPost, authorName);

      // Assert
      expect(mockWsService.broadcastToRoom).toHaveBeenCalledWith('general', 'postDeleted', {
        postId: mockPost.id,
        author: authorName,
      });
      expect(mockWsService.broadcastToRoom).toHaveBeenCalledWith(
        `post:${mockPost.id}`,
        'postDeleted',
        {
          postId: mockPost.id,
          author: authorName,
        }
      );
    });
  });

  describe('cleanup', () => {
    it('should cleanup without throwing', async () => {
      // Act & Assert
      await expect(plugin.cleanup()).resolves.toBeUndefined();
    });
  });
});
