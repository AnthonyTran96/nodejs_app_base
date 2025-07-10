import { Service } from '@/core/container';
import { AuthenticatedRequest } from '@/types/common';
import { ResponseUtil } from '@/utils/response';
import { NextFunction, Request, Response } from 'express';
import { TerminalService } from './terminal.service';
import { WebSocketService } from './websocket.service';

@Service('WebSocketController')
export class WebSocketController {
  constructor(
    private readonly webSocketService: WebSocketService,
    private readonly terminalService: TerminalService
  ) {}

  /**
   * Get WebSocket server health and statistics
   */
  async getHealth(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const health = {
        status: 'healthy',
        connections: this.webSocketService.getConnectionCount(),
        terminals: this.terminalService.getAllTerminals().length,
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
        terminals: this.terminalService.getAllTerminals(),
        totalConnections: this.webSocketService.getConnectionCount(),
        totalTerminals: this.terminalService.getAllTerminals().length,
        timestamp: new Date().toISOString(),
      };

      ResponseUtil.success(res, stats, 'WebSocket statistics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new terminal session (Authenticated users)
   */
  async createTerminal(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { cols, rows, shell } = req.body;

      const terminalOptions = {
        ...(cols !== undefined && { cols }),
        ...(rows !== undefined && { rows }),
        ...(shell !== undefined && { shell }),
        ...(req.user?.userId !== undefined && { userId: req.user.userId }),
        ...(req.user?.email !== undefined && { userName: req.user.email }),
      };

      const terminal = await this.terminalService.createTerminal(terminalOptions);

      ResponseUtil.success(
        res,
        {
          terminalId: terminal.id,
          shell: terminal.shell,
          cols: terminal.cols,
          rows: terminal.rows,
          status: terminal.status,
          createdAt: terminal.createdAt,
        },
        'Terminal created successfully',
        201
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's terminals (Authenticated users)
   */
  async getUserTerminals(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        ResponseUtil.error(res, 'User ID is required', 400);
        return;
      }

      const terminals = this.terminalService.getUserTerminals(req.user.userId);
      const terminalInfo = terminals.map(terminal => ({
        id: terminal.id,
        shell: terminal.shell,
        cols: terminal.cols,
        rows: terminal.rows,
        status: terminal.status,
        createdAt: terminal.createdAt,
        lastActivity: terminal.lastActivity,
        pid: terminal.process?.pid,
      }));

      ResponseUtil.success(res, terminalInfo, 'User terminals retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all terminals (Admin only)
   */
  async getAllTerminals(
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const terminals = this.terminalService.getAllTerminals();
      ResponseUtil.success(res, terminals, 'All terminals retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Destroy a terminal session (Authenticated users - own terminals only, Admin - any terminal)
   */
  async destroyTerminal(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { terminalId } = req.params;

      if (!terminalId) {
        ResponseUtil.error(res, 'Terminal ID is required', 400);
        return;
      }

      const terminal = this.terminalService.getTerminal(terminalId);
      if (!terminal) {
        ResponseUtil.notFound(res, 'Terminal not found');
        return;
      }

      // Check ownership or admin role
      const isOwner = terminal.userId === req.user?.userId;
      const isAdmin = req.user?.role === 'admin';

      if (!isOwner && !isAdmin) {
        ResponseUtil.error(res, 'Access denied', 403);
        return;
      }

      const success = await this.terminalService.destroyTerminal(terminalId);
      if (success) {
        ResponseUtil.success(res, null, 'Terminal destroyed successfully');
      } else {
        ResponseUtil.error(res, 'Failed to destroy terminal', 500);
      }
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
