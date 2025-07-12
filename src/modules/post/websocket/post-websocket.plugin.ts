import { Service } from '@/core/container';
import { PostResponse } from '@/models/post.model';
import {
  BaseCoreSocket,
  ICoreWebSocketService,
  WebSocketEventPayload,
} from '@/modules/websocket/plugins/websocket-core';
import { WebSocketPlugin } from '@/modules/websocket/plugins/websocket-plugin.interface';
import { logger } from '@/utils/logger';
import {
  PostClientToServerEvents,
  PostNotificationData,
  PostServerToClientEvents,
  PostTypingData,
} from './post-websocket.types';

@Service('PostWebSocketPlugin')
export class PostWebSocketPlugin implements WebSocketPlugin {
  readonly name = 'PostWebSocketPlugin';
  readonly version = '1.0.0';

  constructor(private readonly wsService: ICoreWebSocketService) {}

  // Register Post-specific events
  readonly serverToClientEvents: PostServerToClientEvents = {
    postCreated: () => {},
    postUpdated: () => {},
    postDeleted: () => {},
    typing: () => {},
  };

  readonly clientToServerEvents: PostClientToServerEvents = {
    subscribeToPost: () => {},
    unsubscribeFromPost: () => {},
    typing: () => {},
  };

  /**
   * Setup event handlers for post-related WebSocket events
   * (Moving logic from WebSocketService.setupEventHandlers)
   */
  setupEventHandlers(socket: BaseCoreSocket, wsService: ICoreWebSocketService): void {
    // Cast socket to 'any' to allow plugin-specific events
    const pluginSocket = socket as any;

    // Post subscription management
    pluginSocket.on('subscribeToPost', (postId: number) => {
      this.handleSubscribeToPost(socket, wsService, postId);
    });

    pluginSocket.on('unsubscribeFromPost', (postId: number) => {
      this.handleUnsubscribeFromPost(socket, wsService, postId);
    });

    // Typing indicators for posts
    pluginSocket.on('typing', (data: { postId: number; isTyping: boolean }) => {
      this.handleTyping(socket, data);
    });
  }

  /**
   * Handle business events related to posts
   * (Moving logic from WebSocketService.notifyPostXxx methods)
   */
  async onBusinessEvent(eventType: string, payload: WebSocketEventPayload): Promise<void> {
    const postPayload = payload as unknown as PostNotificationData;
    switch (eventType) {
      case 'post.created':
        await this.handlePostCreated(postPayload);
        break;
      case 'post.updated':
        await this.handlePostUpdated(postPayload);
        break;
      case 'post.deleted':
        await this.handlePostDeleted(postPayload);
        break;
      default:
        // Not a post-related event, ignore
        break;
    }
  }

  // Private event handlers (moved from WebSocketService)
  private handleSubscribeToPost(
    socket: BaseCoreSocket,
    wsService: ICoreWebSocketService,
    postId: number
  ): void {
    const room = `post:${postId}`;
    wsService.joinRoom(socket, room);

    logger.debug('Socket subscribed to post', {
      socketId: socket.id,
      userId: socket.data.userId,
      postId,
    });
  }

  private handleUnsubscribeFromPost(
    socket: BaseCoreSocket,
    wsService: ICoreWebSocketService,
    postId: number
  ): void {
    const room = `post:${postId}`;
    wsService.leaveRoom(socket, room);

    logger.debug('Socket unsubscribed from post', {
      socketId: socket.id,
      userId: socket.data.userId,
      postId,
    });
  }

  private handleTyping(socket: BaseCoreSocket, data: { postId: number; isTyping: boolean }): void {
    if (socket.data.userId && socket.data.userName) {
      const typingData: PostTypingData = {
        ...data,
        userId: socket.data.userId,
        userName: socket.data.userName,
      };

      // Broadcast to others in the post room
      (socket.to(`post:${data.postId}`) as any).emit('typing', typingData);
    }
  }

  // Business event handlers (replacing WebSocketService.notifyPostXxx methods)
  private async handlePostCreated(payload: PostNotificationData): Promise<void> {
    // Broadcast to general room
    await this.wsService.broadcastToRoom('general', 'postCreated', {
      post: payload,
      author: payload.authorName,
    });

    logger.debug('Post created notification sent', { postId: payload.postId });
  }

  private async handlePostUpdated(payload: PostNotificationData): Promise<void> {
    // Broadcast to general room and specific post room
    await this.wsService.broadcastToRoom('general', 'postUpdated', {
      post: payload,
      author: payload.authorName,
    });

    await this.wsService.broadcastToRoom(`post:${payload.postId}`, 'postUpdated', {
      post: payload,
      author: payload.authorName,
    });

    logger.debug('Post updated notification sent', { postId: payload.postId });
  }

  private async handlePostDeleted(payload: PostNotificationData): Promise<void> {
    // Broadcast to general room and specific post room
    await this.wsService.broadcastToRoom('general', 'postDeleted', {
      postId: payload.postId,
      author: payload.authorName,
    });

    await this.wsService.broadcastToRoom(`post:${payload.postId}`, 'postDeleted', {
      postId: payload.postId,
      author: payload.authorName,
    });

    logger.debug('Post deleted notification sent', { postId: payload.postId });
  }

  async cleanup(): Promise<void> {
    logger.info('Post WebSocket plugin cleaned up');
  }

  // Public methods for external calls (now instance methods that can be injected)
  async notifyPostCreated(post: PostResponse, authorName: string): Promise<void> {
    await this.handlePostCreated({
      type: 'created',
      postId: post.id,
      authorId: post.authorId,
      authorName,
      title: post.title,
      content: post.content,
    });
  }

  async notifyPostUpdated(post: PostResponse, authorName: string): Promise<void> {
    await this.handlePostUpdated({
      type: 'updated',
      postId: post.id,
      authorId: post.authorId,
      authorName,
      title: post.title,
      content: post.content,
    });
  }

  async notifyPostDeleted(post: PostResponse, authorName: string): Promise<void> {
    await this.handlePostDeleted({
      type: 'deleted',
      postId: post.id,
      authorId: post.authorId,
      authorName,
    });
  }
}
