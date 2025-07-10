import { AuthGuard, RoleGuard } from '@/middleware/auth.middleware';
import { ValidateBody } from '@/middleware/validation.middleware';
import { WebSocketController } from '@/modules/websocket/websocket.controller';
import {
  CreateTerminalDto,
  SendNotificationDto,
  SendRoomNotificationDto,
  SendUserNotificationDto,
} from '@/modules/websocket/websocket.dto';
import { Role } from '@/types/role.enum';
import { Router } from 'express';

export function createWebSocketRoutes(webSocketController: WebSocketController): Router {
  const router = Router();

  // Public health endpoint
  router.get('/health', webSocketController.getHealth.bind(webSocketController));

  // All other routes require authentication
  router.use(AuthGuard);

  // WebSocket statistics (Admin only)
  router.get(
    '/stats',
    RoleGuard(Role.ADMIN),
    webSocketController.getStats.bind(webSocketController)
  );

  // Terminal management endpoints
  router.post(
    '/terminal',
    ValidateBody(CreateTerminalDto),
    webSocketController.createTerminal.bind(webSocketController)
  );

  router.get('/terminal', webSocketController.getUserTerminals.bind(webSocketController));

  router.get(
    '/terminal/all',
    RoleGuard(Role.ADMIN),
    webSocketController.getAllTerminals.bind(webSocketController)
  );

  router.delete(
    '/terminal/:terminalId',
    webSocketController.destroyTerminal.bind(webSocketController)
  );

  // Notification endpoints (Admin only)
  router.post(
    '/notify/user',
    RoleGuard(Role.ADMIN),
    ValidateBody(SendUserNotificationDto),
    webSocketController.sendNotificationToUser.bind(webSocketController)
  );

  router.post(
    '/notify/broadcast',
    RoleGuard(Role.ADMIN),
    ValidateBody(SendNotificationDto),
    webSocketController.broadcastNotification.bind(webSocketController)
  );

  router.post(
    '/notify/room',
    RoleGuard(Role.ADMIN),
    ValidateBody(SendRoomNotificationDto),
    webSocketController.sendNotificationToRoom.bind(webSocketController)
  );

  // Room management (Admin only)
  router.get(
    '/rooms/:room',
    RoleGuard(Role.ADMIN),
    webSocketController.getRoomInfo.bind(webSocketController)
  );

  router.get(
    '/users/:userId/connections',
    RoleGuard(Role.ADMIN),
    webSocketController.getUserConnections.bind(webSocketController)
  );

  return router;
}
