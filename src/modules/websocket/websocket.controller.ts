import { Service } from '@/core/container';
import { WebSocketService } from '@/modules/websocket/websocket.service';
import { AuthenticatedRequest } from '@/types/common';
import { ResponseUtil } from '@/utils/response';
import { NextFunction, Request, Response } from 'express';

@Service('WebSocketController')
export class WebSocketController {
  constructor(private readonly webSocketService: WebSocketService) {}

  /**
   * Get WebSocket server health and statistics
   */
  async getHealth(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const health = {
        status: 'healthy',
        connections: this.webSocketService.getConnectionCount(),
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      };

      ResponseUtil.success(res, health, 'WebSocket server is healthy');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get WebSocket server statistics (Admin only)
   */
  async getStats(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = {
        connections: this.webSocketService.getAllConnections(),
        rooms: this.webSocketService.getAllRooms(),
        totalConnections: this.webSocketService.getConnectionCount(),
        timestamp: new Date().toISOString(),
      };

      ResponseUtil.success(res, stats, 'WebSocket statistics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Send notification to specific user (Admin only)
   */
  async sendNotificationToUser(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId, message, type = 'info' } = req.body;

      if (!userId || !message) {
        ResponseUtil.error(res, 'User ID and message are required', 400);
        return;
      }

      await this.webSocketService.sendNotification({ type: 'user', userId }, message, type);

      ResponseUtil.success(res, null, 'Notification sent successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Broadcast notification to all users (Admin only)
   */
  async broadcastNotification(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { message, type = 'info' } = req.body;

      if (!message) {
        ResponseUtil.error(res, 'Message is required', 400);
        return;
      }

      await this.webSocketService.sendNotification({ type: 'all' }, message, type);

      ResponseUtil.success(res, null, 'Notification broadcasted successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Send notification to specific room (Admin only)
   */
  async sendNotificationToRoom(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { room, message, type = 'info' } = req.body;

      if (!room || !message) {
        ResponseUtil.error(res, 'Room and message are required', 400);
        return;
      }

      await this.webSocketService.sendNotification({ type: 'room', room }, message, type);

      ResponseUtil.success(res, null, 'Notification sent to room successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get information about a specific room (Admin only)
   */
  async getRoomInfo(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { room } = req.params;

      if (!room) {
        ResponseUtil.error(res, 'Room name is required', 400);
        return;
      }

      const roomInfo = this.webSocketService.getRoomInfo(room);

      if (!roomInfo) {
        ResponseUtil.notFound(res, 'Room not found');
        return;
      }

      ResponseUtil.success(res, roomInfo, 'Room information retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's active WebSocket connections (Admin only)
   */
  async getUserConnections(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId) {
        ResponseUtil.error(res, 'User ID is required', 400);
        return;
      }

      const userIdNum = parseInt(userId, 10);
      if (isNaN(userIdNum)) {
        ResponseUtil.error(res, 'Invalid user ID', 400);
        return;
      }

      const connections = this.webSocketService.getUserConnections(userIdNum);
      const connectionInfo = connections.map(socket => ({
        socketId: socket.id,
        userId: socket.data.userId,
        userName: socket.data.userName,
        userRole: socket.data.userRole,
        lastActivity: socket.data.lastActivity,
        rooms: socket.data.rooms,
      }));

      ResponseUtil.success(res, connectionInfo, 'User connections retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
