# Terminal Integration with WebSocket

This document describes the comprehensive terminal integration feature that enables real-time terminal access through WebSocket connections using Socket.io and xterm.js.

## Overview

The terminal integration provides:

- **Real-time terminal sessions** through WebSocket connections
- **node-pty integration** for real terminal processes (when available)
- **Simulated terminal** fallback for environments without node-pty
- **Multi-user support** with proper authentication and authorization
- **Session management** with automatic cleanup
- **Frontend integration** using xterm.js

## Architecture

### Backend Components

#### 1. TerminalService (`src/modules/websocket/terminal.service.ts`)

- Manages terminal sessions and PTY processes
- Handles both real (node-pty) and simulated terminals
- Provides session lifecycle management
- Tracks user terminals and provides cleanup

#### 2. WebSocketService Extension

- Integrated terminal event handlers
- Real-time bidirectional communication
- Room-based terminal isolation
- Error handling and logging

#### 3. WebSocketController Extension

- HTTP endpoints for terminal management
- Authentication and authorization
- RESTful terminal operations

#### 4. Type Definitions (`src/types/websocket.ts`)

- Comprehensive TypeScript interfaces
- Event type definitions
- Terminal session structures

### Frontend Components

#### Demo Client (`terminal-client-demo.html`)

- Complete xterm.js integration
- Socket.io client implementation
- Terminal management UI
- Real-time event logging

## Features

### Terminal Session Management

#### Creating Terminals

```typescript
// WebSocket event
socket.emit('terminalCreate', {
  cols: 80,
  rows: 24,
  shell: '/bin/bash' // optional
});

// HTTP endpoint
POST /api/websocket/terminal
{
  "cols": 80,
  "rows": 24,
  "shell": "/bin/bash"
}
```

#### Terminal Input/Output

```typescript
// Send input to terminal
socket.emit('terminalInput', {
  terminalId: 'terminal-123',
  input: 'ls -la\r',
});

// Receive terminal output
socket.on('terminalData', data => {
  console.log(data.terminalId, data.data);
});
```

#### Terminal Resize

```typescript
socket.emit('terminalResize', {
  terminalId: 'terminal-123',
  cols: 100,
  rows: 30,
});
```

#### Destroying Terminals

```typescript
// WebSocket event
socket.emit('terminalDestroy', 'terminal-123');

// HTTP endpoint
DELETE / api / websocket / terminal / terminal - 123;
```

### Authentication & Authorization

#### WebSocket Authentication

- JWT token validation through Socket.io middleware
- Anonymous connections supported with limited features
- User session tracking and cleanup

#### HTTP Authentication

- Bearer token authentication required
- Role-based access control
- Users can only manage their own terminals
- Admins can manage all terminals

### Real vs Simulated Terminals

#### Real Terminals (node-pty)

When node-pty is available:

- Full shell process spawning
- Real command execution
- File system access
- Process management

#### Simulated Terminals

Fallback when node-pty is unavailable:

- Command simulation (pwd, ls, date, whoami, echo, etc.)
- Safe environment without real shell access
- Educational/demo purposes

### Event Types

#### Client to Server Events

- `terminalCreate` - Create new terminal session
- `terminalInput` - Send input to terminal
- `terminalResize` - Resize terminal dimensions
- `terminalDestroy` - Destroy terminal session
- `terminalList` - List user's terminals

#### Server to Client Events

- `terminalCreated` - Terminal creation confirmation
- `terminalData` - Terminal output data
- `terminalDestroyed` - Terminal destruction confirmation
- `terminalError` - Terminal operation errors
- `terminalList` - List of available terminals

## API Endpoints

### Public Endpoints

- `GET /api/websocket/health` - WebSocket service health check

### Authenticated Endpoints

- `POST /api/websocket/terminal` - Create terminal session
- `GET /api/websocket/terminal` - List user terminals
- `DELETE /api/websocket/terminal/:terminalId` - Destroy terminal

### Admin-Only Endpoints

- `GET /api/websocket/stats` - WebSocket statistics
- `GET /api/websocket/terminal/all` - List all terminals

## Security Considerations

### Authentication

- JWT token validation for WebSocket connections
- HTTP Bearer token authentication
- Anonymous connection support with restrictions

### Authorization

- Users can only access their own terminals
- Admin role can access all terminals
- Terminal isolation through rooms

### Resource Management

- Automatic terminal cleanup on disconnect
- Configurable idle timeout
- Memory and process limits

### Input Validation

- Terminal size constraints (cols: 20-200, rows: 5-100)
- Shell path validation
- Input sanitization

## Configuration

### Environment Variables

```bash
# WebSocket Configuration
WEBSOCKET_PORT=3000
WEBSOCKET_CORS_ORIGIN=http://localhost:3000

# Terminal Configuration
TERMINAL_MAX_IDLE_TIME=1800000  # 30 minutes
TERMINAL_DEFAULT_SHELL=/bin/bash
TERMINAL_CLEANUP_INTERVAL=300000  # 5 minutes
```

### Terminal Limits

```typescript
// Default constraints
const TERMINAL_LIMITS = {
  maxCols: 200,
  minCols: 20,
  maxRows: 100,
  minRows: 5,
  maxIdleTime: 30 * 60 * 1000, // 30 minutes
  maxTerminalsPerUser: 5,
};
```

## Usage Examples

### Basic Frontend Integration

```html
<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="https://unpkg.com/xterm@5.3.0/css/xterm.css" />
  </head>
  <body>
    <div id="terminal"></div>

    <script src="https://unpkg.com/xterm@5.3.0/lib/xterm.js"></script>
    <script src="https://unpkg.com/socket.io-client@4.7.2/dist/socket.io.min.js"></script>

    <script>
      // Initialize terminal
      const terminal = new Terminal();
      terminal.open(document.getElementById('terminal'));

      // Connect to WebSocket
      const socket = io('http://localhost:3000', {
        auth: { token: 'your-jwt-token' },
      });

      // Create terminal session
      socket.emit('terminalCreate', { cols: 80, rows: 24 });

      // Handle terminal events
      socket.on('terminalCreated', data => {
        console.log('Terminal created:', data.terminalId);
      });

      socket.on('terminalData', data => {
        terminal.write(data.data);
      });

      // Send input to terminal
      terminal.onData(data => {
        socket.emit('terminalInput', {
          terminalId: currentTerminalId,
          input: data,
        });
      });
    </script>
  </body>
</html>
```

### Backend Service Usage

```typescript
import { TerminalService } from '@/modules/websocket/terminal.service';

// Create terminal programmatically
const terminalService = container.get<TerminalService>('TerminalService');

const terminal = await terminalService.createTerminal({
  cols: 80,
  rows: 24,
  shell: '/bin/bash',
  userId: 123,
  userName: 'user@example.com',
});

// Write to terminal
await terminalService.writeToTerminal(terminal.id, 'echo "Hello World"\r');

// Resize terminal
await terminalService.resizeTerminal(terminal.id, 100, 30);

// Cleanup
await terminalService.destroyTerminal(terminal.id);
```

## Error Handling

### Common Errors

- **Terminal not found** - Terminal ID doesn't exist
- **Access denied** - User doesn't own terminal
- **Creation failed** - Unable to spawn terminal process
- **Write failed** - Unable to send input to terminal
- **Resize failed** - Unable to resize terminal

### Error Response Format

```typescript
socket.on('terminalError', data => {
  console.error(`Terminal ${data.terminalId}: ${data.error}`);
});
```

## Performance Considerations

### Optimization

- Terminal output buffering
- Connection pooling
- Memory usage monitoring
- Automatic cleanup of inactive sessions

### Monitoring

- Terminal session metrics
- Memory usage tracking
- Connection count monitoring
- Error rate tracking

## Testing

### Demo Application

Open `terminal-client-demo.html` in a browser to test:

1. WebSocket connection
2. Terminal creation
3. Interactive terminal usage
4. Session management
5. Error handling

### Integration Tests

```bash
# Run terminal integration tests
npm run test:integration

# Run E2E tests with terminal functionality
npm run test:e2e
```

## Troubleshooting

### Common Issues

#### 1. node-pty Installation Issues

- Ensure build tools are available (Visual Studio Build Tools on Windows)
- Try alternative shells or use simulated mode
- Check platform compatibility

#### 2. WebSocket Connection Issues

- Verify CORS configuration
- Check authentication tokens
- Confirm server is running and accessible

#### 3. Terminal Not Responding

- Check terminal process status
- Verify input format (include \r for commands)
- Check for proper error handling

#### 4. Permission Issues

- Verify user authentication
- Check terminal ownership
- Confirm role permissions

### Debug Mode

Enable debug logging:

```bash
DEBUG=websocket:terminal npm start
```

## Future Enhancements

### Planned Features

- File upload/download through terminal
- Terminal sharing and collaboration
- Screen recording and playback
- Custom terminal themes
- Plugin system for terminal extensions
- Terminal clustering for high availability

### Integration Opportunities

- IDE integration
- CI/CD pipeline integration
- Remote server management
- Development environment provisioning
- Educational platform integration

## Dependencies

### Backend Dependencies

- `socket.io` - WebSocket communication
- `node-pty` - Terminal process management (optional)
- `express` - HTTP API endpoints
- `jsonwebtoken` - JWT authentication

### Frontend Dependencies

- `xterm` - Terminal emulator
- `xterm-addon-fit` - Terminal auto-sizing
- `socket.io-client` - WebSocket client

## License & Credits

This terminal integration is part of the Node.js application base and follows the same licensing terms. Special thanks to the xterm.js and node-pty communities for their excellent libraries.
