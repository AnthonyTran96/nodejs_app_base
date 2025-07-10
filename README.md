# Node.js Backend Base Project

A clean, scalable, and testable Node.js backend with TypeScript, Express, layered architecture, and **Module Registry Pattern** for conflict-free development.

## 🏗️ Architecture

This project implements a **layered architecture** with **Module Registry Pattern** for dependency injection:

```
Controllers → Services → Unit of Work → Repositories → Database
     ↓
Module Registry System (Self-registering modules)
     ↓
Container Setup (Minimal imports)
     ↓
Application Bootstrap
```

### ✨ **Module Registry Benefits:**

- **🚫 Zero Conflicts**: Multiple developers can add modules without merge conflicts
- **📦 Self-Contained**: Each module manages its own dependencies
- **🔄 Parallel Development**: Teams work independently on separate modules
- **⚡ Type Safe**: Full TypeScript support with compile-time checking

## 🚀 Features

✅ **TypeScript** with strict configuration  
✅ **Express.js** web framework  
✅ **Layered Architecture** (Controllers, Services, Repositories)  
✅ **Module Registry Pattern** - Conflict-free module registration  
✅ **Role Enum System** - Type-safe role management  
✅ **DTO Validation** with class-validator  
✅ **Authentication** (JWT + cookies)  
✅ **Authorization** (enum-based role access control)  
✅ **Database Integration** (SQLite for dev, PostgreSQL for production)  
✅ **Repository Pattern** for data access  
✅ **DataTransformer Utility** - Reusable data transformation logic  
✅ **Advanced Field Mapping** - Custom column mapping with type conversion  
✅ **Transform Functions** - Custom transformation logic for complex scenarios  
✅ **Comprehensive Type System** - 15+ field types with automatic conversion  
✅ **Unit of Work** pattern for transactions  
✅ **Database Migrations** with versioning system  
✅ **Comprehensive Testing** (Unit, Integration, E2E)  
✅ **Code Quality** (ESLint + Prettier)  
✅ **Logging** with Winston  
✅ **Environment Configuration** with validation  
✅ **CI/CD Pipeline** - Multi-step GitHub Actions deployment with Cloudflare Tunnel  
✅ **Production Optimization** - Automated dependency pruning and PM2 management  
✅ **Health Monitoring** - Automated deployment verification and rollback capability

## 📁 Project Structure

```
src/
├── config/              # Environment configuration
├── core/               # Core infrastructure
│   ├── container.ts    # Dependency injection container
│   ├── container-setup.ts # Module registry setup (minimal imports)
│   ├── module-registry.ts # 📦 Module registry system
│   ├── core.registry.ts # Core services registration
│   ├── template.registry.ts.example # Template for new modules
│   ├── base.repository.ts # Base repository pattern
│   ├── unit-of-work.ts # Transaction management
│   └── index.ts        # Route initialization
├── database/           # Database connection & migrations
│   ├── connection.ts   # PostgreSQL/SQLite connection
│   ├── migrations/     # Database schema migrations
│   └── seeds/          # Sample data seeding
├── middleware/         # Express middleware
├── routes/             # 🛣️ Centralized API routes
│   ├── index.ts        # Main routes initialization & overview
│   ├── auth.routes.ts  # Authentication routes
│   ├── user.routes.ts  # User management routes
│   └── README.md       # Routes documentation & guidelines
├── types/              # TypeScript type definitions
│   ├── role.enum.ts    # 🎭 Role enum & type definitions
│   ├── common.ts       # Common interfaces and types
│   ├── database.ts     # Database-related types
│   ├── filter.ts       # Advanced filtering types
│   └── repository.ts   # Repository schema & type definitions
├── utils/              # Utility functions
│   ├── data-transformer.ts # 🔄 Reusable data transformation logic
│   ├── query-builder.ts    # SQL query building utilities
│   └── ...                 # Other utility functions
├── modules/            # 📦 Feature modules (self-registering)
│   ├── auth/           # Authentication module
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.registry.ts # 🔧 Auth module registration
│   ├── user/           # User management module
│   │   ├── user.controller.ts
│   │   ├── user.service.ts
│   │   ├── user.repository.ts
│   │   ├── user.dto.ts
│   │   └── user.registry.ts # 🔧 User module registration
│   ├── post/           # Post management module
│   │   ├── post.controller.ts
│   │   ├── post.service.ts
│   │   ├── post.repository.ts
│   │   ├── post.dto.ts
│   │   └── post.registry.ts # 🔧 Post module registration
│   └── websocket/      # 🔌 Real-time WebSocket module
│       ├── websocket.service.ts
│       ├── websocket.controller.ts
│       └── websocket.registry.ts # 🔧 WebSocket module registration
├── models/             # Data models and interfaces
└── app.ts              # Application setup (clean & focused)

.github/workflows/      # 🚀 CI/CD Pipeline
└── deploy-dev.yml      # Multi-step deployment with Cloudflare Tunnel

tests/
├── unit/               # Unit tests
├── integration/        # Integration tests
└── e2e/                # End-to-end tests

docs/
├── ONBOARDING.md           # 📖 Complete development guide
├── DATABASE_MIGRATION_GUIDE.md # Database management
└── ENVIRONMENT_SETUP.md    # Environment configuration
```

## 📦 Module Registry System

This project uses a **Module Registry Pattern** that eliminates merge conflicts when multiple developers add services:

### ✅ **How it works:**

1. Each module creates a `*.registry.ts` file that self-registers its services
2. `container-setup.ts` just imports the registry files
3. **No more conflicts!** Each developer only adds 1 line per module

### 🚀 **Adding a new module:**

```typescript
// 1. Create registry file: src/modules/post/post.registry.ts
ModuleRegistry.registerModule({
  name: 'PostModule',
  register: async container => {
    // Import and register module services
    const { PostService } = await import('./post.service');
    container.register('PostService', PostService);
  },
});

// 2. Add ONE line to container-setup.ts:
await import('@/modules/post/post.registry');

// 3. Create routes in src/routes/post.routes.ts
// 4. Register routes in src/routes/index.ts
```

## 🎭 Role System (Type-Safe)

Using TypeScript enums for **compile-time role safety**:

```typescript
// src/types/role.enum.ts
export enum Role {
  USER = 'user',
  ADMIN = 'admin',
}

// Usage in controllers:
import { Role } from '@/types/role.enum';

// Type-safe authorization
router.delete('/:id', authorize([Role.ADMIN]), deleteHandler);

// Type-safe role checking
if (user.role === Role.ADMIN) {
  // Admin logic
}
```

### ✅ **Benefits:**

- ✅ **Compile-time checking** prevents invalid roles
- ✅ **IDE autocomplete** for role values
- ✅ **Single source of truth** for all roles
- ✅ **Refactor-safe** - renaming updates everywhere

## 🗄️ Database Support

### Development

- **SQLite**: Automatic setup, file-based database
- **Auto-migrations**: Runs automatically on startup
- **Sample data**: Seeding with realistic test data

### Production

- **PostgreSQL**: Recommended for production use
- **Connection pooling**: Optimized for concurrent requests
- **Migration control**: Manual migration approval for safety

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# For detailed environment configuration:
# See docs/ENVIRONMENT_SETUP.md
```

Basic development configuration:

```env
NODE_ENV=development
PORT=3000
DB_TYPE=sqlite
DB_SQLITE_PATH=./database.sqlite
JWT_SECRET=your-development-jwt-secret-key-32-chars
JWT_REFRESH_SECRET=your-development-refresh-secret-32-chars
COOKIE_SECRET=your-development-cookie-secret-32-chars
```

### 3. Build the Project

```bash
npm run build
```

### 4. Start Development Server

```bash
npm run dev
```

The server starts on `http://localhost:3000`

## 📚 API Endpoints

### Health Check

```bash
GET /health
```

### Authentication

```bash
POST /api/v1/auth/register    # Register new user
POST /api/v1/auth/login       # Login
POST /api/v1/auth/refresh     # Refresh token
POST /api/v1/auth/logout      # Logout
GET  /api/v1/auth/profile     # Get current user profile
```

### Users (Authentication Required)

```bash
GET    /api/v1/users          # List users (admin only)
GET    /api/v1/users/:id      # Get user by ID
POST   /api/v1/users          # Create user (admin only)
PUT    /api/v1/users/:id      # Update user
DELETE /api/v1/users/:id      # Delete user (admin only)
POST   /api/v1/users/change-password  # Change password
GET    /api/v1/users/stats    # User statistics (admin only)
```

### Posts (Authentication Required)

```bash
GET    /api/v1/posts          # List posts with filtering
GET    /api/v1/posts/:id      # Get post by ID
POST   /api/v1/posts          # Create new post
PUT    /api/v1/posts/:id      # Update post
DELETE /api/v1/posts/:id      # Delete post (admin only)
```

### 🔌 WebSocket Real-Time Features

#### HTTP Management Endpoints

```bash
GET    /api/v1/websocket/health              # WebSocket server health (public)
GET    /api/v1/websocket/stats               # Server statistics (admin only)
POST   /api/v1/websocket/notify/user         # Send notification to user (admin)
POST   /api/v1/websocket/notify/broadcast    # Broadcast notification (admin)
POST   /api/v1/websocket/notify/room         # Send notification to room (admin)
GET    /api/v1/websocket/rooms/:room         # Get room information (admin)
GET    /api/v1/websocket/users/:userId/connections  # Get user connections (admin)
```

#### WebSocket Events

**Client → Server Events:**

```javascript
'joinRoom'; // Join specific room
'leaveRoom'; // Leave room
'subscribeToPost'; // Subscribe to post updates
'unsubscribeFromPost'; // Unsubscribe from post
'typing'; // Send typing indicator
'ping'; // Ping server
```

**Server → Client Events:**

```javascript
'userJoined'; // User joined notification
'userLeft'; // User left notification
'postCreated'; // New post notification
'postUpdated'; // Post updated notification
'postDeleted'; // Post deleted notification
'notification'; // General notifications
'connectionCount'; // Live connection count
'typing'; // Typing indicators
```

#### WebSocket Client Usage

```javascript
// Connect to WebSocket server
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { token: 'your-jwt-token' }, // Optional authentication
  transports: ['websocket', 'polling'],
});

// Listen for real-time post updates
socket.on('postCreated', data => {
  console.log(`📝 New post: "${data.post.title}" by ${data.author}`);
});

// Join a room for targeted notifications
socket.emit('joinRoom', 'general');

// Subscribe to specific post updates
socket.emit('subscribeToPost', 123);

// Send typing indicators
socket.emit('typing', { postId: 123, isTyping: true });
```

**Key Features:**

- ✅ **JWT Authentication**: Secure WebSocket connections
- ✅ **Real-time Post Updates**: Instant notifications for CRUD operations
- ✅ **Room Management**: Organize users into topic-based rooms
- ✅ **Typing Indicators**: Show when users are typing
- ✅ **User Presence**: Track user join/leave events
- ✅ **Admin Monitoring**: Comprehensive stats and control endpoints
- ✅ **Auto-Integration**: Works seamlessly with existing business logic

#### Testing WebSocket Features

```bash
# Start development server
npm run dev

# Open the WebSocket demo client
open websocket-client-demo.html

# Or test via API endpoints
curl http://localhost:3000/api/v1/websocket/health
```

### API Documentation

```bash
GET /api/v1/docs              # API documentation
```

## 🧪 Testing

```bash
# Run unit and integration tests
npm test

# Run all tests (unit + integration + E2E)
npm run test:all

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

## 🚀 CI/CD Pipeline

This project includes a **production-ready GitHub Actions CI/CD pipeline** with enhanced error handling and multi-step deployment process.

### Pipeline Features

- ✅ **Multi-Step Deployment**: Separated deployment phases for better debugging
- ✅ **Cloudflare Tunnel**: Secure server access without direct exposure
- ✅ **ARM64 Optimized**: Native performance on ARM64 GitHub runners
- ✅ **Health Monitoring**: Automated verification and rollback capability
- ✅ **Production Optimization**: Dependency pruning and PM2 management
- ✅ **Enhanced Logging**: Step-by-step progress with emoji indicators

### Deployment Process

```bash
# Automatic deployment triggered by:
git push origin auto-build

# Pipeline stages:
1. Build & Test (2-3 minutes)
   ├─ Code checkout & Node.js setup
   ├─ Dependencies installation
   ├─ ESLint code quality check
   └─ TypeScript compilation

2. Package & Upload (1 minute)
   ├─ Production optimization
   ├─ Native dependencies removal
   └─ Secure file transfer via Cloudflare

3. Multi-Step Deployment (3-5 minutes)
   ├─ 12a: Deploy Files (5 min timeout)
   ├─ 12b: Setup Dependencies (10 min timeout)
   ├─ 12c: Start Application (3 min timeout)
   └─ 12d: Verify Deployment (2 min timeout)

# Total deployment time: 6-9 minutes
```

### GitHub Configuration Required

#### **Secrets** (Repository Settings → Secrets)

```bash
SSH_PRIVATE_KEY     # ED25519 private key for server access
SSH_HOSTNAME        # Cloudflare tunnel hostname
SSH_USER           # Server username
SSH_FINGERPRINT    # Server host key fingerprint
```

#### **Variables** (Repository Settings → Variables)

```bash
APP_NAME           # Application name for deployment paths
```

### Deployment Monitoring

The pipeline provides detailed monitoring with **emoji-based progress indicators**:

```bash
🚀 Starting file deployment...
📦 Creating backup of existing application...
📁 Moving new files...
⚙️ Copying environment configuration...
✅ Files deployed successfully

🔍 Checking SQLite module...
📦 Installing production dependencies...
✅ Dependencies setup completed

🔄 Managing PM2 process...
💾 Saving PM2 configuration...
⏳ Waiting for application stability...
✅ Application started successfully

🩺 Performing health check...
✅ PM2 process is online
✅ Application is running and healthy
🎉 Deployment verification completed successfully
```

### Troubleshooting Pipeline Issues

#### **Common Issues & Solutions**

```bash
# SSH Connection Timeout
- Verify Cloudflare tunnel configuration
- Check SSH_HOSTNAME and SSH_USER variables

# Dependencies Installation Hanging
- Network connectivity issues on server
- Check yarn.lock file integrity
- Review server disk space

# PM2 Process Management Issues
- Check application logs: pm2 logs APP_NAME
- Verify pm2.config.js configuration
- Review server memory/CPU resources

# Health Check Failures
- Database connectivity issues
- Check environment variables on server
- Review application startup logs
```

### Pipeline Benefits

- 🔒 **Security**: All connections via Cloudflare Zero Trust
- ⚡ **Performance**: ARM64-optimized with connection timeouts
- 🔍 **Debugging**: Detailed logging and specific error reporting
- 🔄 **Reliability**: Automatic backup and rollback capabilities
- 📊 **Monitoring**: Real-time deployment status and health checks

For complete CI/CD documentation, see **[docs/ONBOARDING.md](docs/ONBOARDING.md#-cicd-pipeline)**.

## 🔧 Development

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check everything
npm run check
```

### Build & TypeScript

```bash
# Build for production
npm run build

# Type check without emitting
npx tsc --noEmit
```

### Database Management

```bash
# Run migrations
npm run db:migrate

# Check migration status
npm run db:migrate:status

# Rollback last migration
npm run db:migrate:rollback

# Run seeds
npm run db:seed
```

## 🛡️ Security Features

- **JWT Authentication** with refresh tokens
- **Password hashing** with bcrypt
- **Input validation** with class-validator
- **SQL injection protection** with parameterized queries
- **Security headers** with Helmet.js
- **CORS configuration**
- **Request logging**
- **Environment validation** for production safety

## 📖 Documentation

### 📚 **Complete Guides:**

- **[docs/ONBOARDING.md](docs/ONBOARDING.md)** - Complete development guide with module creation, role system, testing strategies
- **[docs/DATABASE_MIGRATION_GUIDE.md](docs/DATABASE_MIGRATION_GUIDE.md)** - Database migration system, PostgreSQL/SQLite setup
- **[docs/ENVIRONMENT_SETUP.md](docs/ENVIRONMENT_SETUP.md)** - Environment configuration, validation rules, troubleshooting

### 🎯 **What each guide covers:**

- **ONBOARDING**: Architecture, adding modules, testing, debugging
- **DATABASE_MIGRATION**: Migrations, seeds, PostgreSQL setup
- **ENVIRONMENT_SETUP**: Configuration for dev/test/production

## 🌟 Key Components

### Module Registry Pattern

Self-registering modules eliminate conflicts:

```typescript
// src/modules/user/user.registry.ts
ModuleRegistry.registerModule({
  name: 'UserModule',
  register: async (container: Container) => {
    const { UserService } = await import('./user.service');
    container.register('UserService', UserService, {
      dependencies: ['UserRepository', 'UnitOfWork'],
    });
  },
});
```

### Container Setup (Minimal)

```typescript
// src/core/container-setup.ts
export class ContainerSetup {
  private async loadModules(): Promise<void> {
    await import('@/modules/user/user.registry');
    await import('@/modules/auth/auth.registry');
    // New modules: just add 1 line!
  }
}
```

### Service Registration

```typescript
@Service('UserService')
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}
}
```

### Validation with Role Enums

Request validation with decorators and enum validation:

```typescript
import { Role, getRoleValues } from '@/types/role.enum';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsEnum(Role, {
    message: `Role must be one of: ${getRoleValues().join(', ')}`,
  })
  role?: Role = Role.USER; // Type-safe default
}
```

### Database-Agnostic Repositories

Support for both SQLite and PostgreSQL:

```typescript
export class BaseRepository<T> {
  protected createPlaceholder(index: number): string {
    return this.dbType === 'postgresql' ? `$${index + 1}` : '?';
  }

  protected async executeQuery<R>(sql: string, params: any[] = []): Promise<QueryResult<R>> {
    // Handles both PostgreSQL and SQLite parameter styles
    return await this.dbConnection.query<R>(sql, params);
  }
}
```

### DataTransformer Utility

Reusable data transformation logic for complex queries:

```typescript
// For complex JOIN queries with custom field mappings
const postSchema: RepositorySchema<Post> = {
  id: { column: 'post_id', type: 'integer' },
  title: { column: 'post_title', type: 'string' },
  published: { column: 'post_published', type: 'boolean' },
  createdAt: { column: 'post_created_at', type: 'date' },
};

const authorSchema: RepositorySchema<User> = {
  id: { column: 'author_id', type: 'integer' },
  name: { column: 'author_name', type: 'string' },
  password: { transform: () => '' }, // Hide sensitive data
};

// Transform raw query results
const transformedData = result.rows.map(row => {
  const post = DataTransformer.transformRow<Post>(row, postSchema);
  const author = DataTransformer.transformRow<User>(row, authorSchema);
  return { ...post, author };
});
```

**Features:**

- ✅ **15+ Field Types**: String, number, boolean, date, JSON, array, enum, etc.
- ✅ **Custom Column Mapping**: Map database columns to model fields
- ✅ **Transform Functions**: Custom transformation logic for specific fields
- ✅ **Type Safety**: Full TypeScript support with generic types
- ✅ **Automatic Conversion**: Built-in type conversion (string to number, boolean, etc.)

### Path Aliases

Clean imports with TypeScript path mapping:

```typescript
import { UserService } from '@/user/user.service';
import { DatabaseConnection } from '@/database/connection';
import { ContainerSetup } from '@/core/container-setup';
import { config } from '@/config/environment';
import { logger } from '@/utils/logger';
```

### Application Flow

```typescript
// src/app.ts
export class Application {
  async initialize(): Promise<void> {
    await this.setupDatabase(); // ✅ Database connection + migrations
    this.setupMiddleware(); // ✅ Express middleware
    await this.containerSetup.setupDependencies(); // ✅ Module registry + DI
    this.setupRoutes(); // ✅ Routes initialization
    this.setupErrorHandling(); // ✅ Error handling
  }

  private setupRoutes(): void {
    try {
      const moduleRouter = initializeModuleRoutes();
      this.app.use(config.apiPrefix, moduleRouter);
      logger.info('✅ Routes initialized successfully');
      logger.info(`🚀 API available at: ${config.apiPrefix}`);
    } catch (error) {
      logger.error('❌ Failed to setup routes:', error);
      throw error;
    }
  }
}
```

### Response Format

Standardized API responses:

```typescript
{
  "success": true,
  "data": {...},
  "message": "Operation successful",
  "meta": { ... } // For paginated responses
}
```

## 🛠️ Technologies

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **Authentication**: JWT
- **Validation**: class-validator
- **Testing**: Jest + Supertest
- **Code Quality**: ESLint + Prettier
- **Logging**: Winston
- **Build Tools**: tsc-alias for path resolution

## 📈 Project Status

✅ **Build**: Compiles successfully  
✅ **Server**: Runs on port 3000  
✅ **Database**: SQLite initialized with auto-migrations  
✅ **API**: Health endpoint working  
✅ **Tests**: All tests passing (Unit + Integration + E2E)  
✅ **Architecture**: Clean layered structure with Module Registry  
✅ **Module Registry**: Zero-conflict module registration  
✅ **Role System**: Type-safe enum-based roles  
✅ **Path Aliases**: Configured for clean imports  
✅ **Documentation**: Comprehensive guides available  
✅ **PostgreSQL Support**: Production-ready database setup  
✅ **Environment Validation**: Safe configuration management  
✅ **Centralized Routes**: All routes organized in src/routes/  
✅ **CI/CD Pipeline**: Multi-step deployment with Cloudflare Tunnel  
✅ **Production Deployment**: Automated optimization and health monitoring  
✅ **Zero-Downtime**: Graceful restart with automatic backup and rollback

## 🤝 Contributing

1. Follow the established architecture patterns
2. **Use Module Registry Pattern** for new modules (see `src/core/template.registry.ts.example`)
3. **Use Role enum** for type-safe role management
4. **Add routes to src/routes/** directory for centralized route management
5. Add tests for new features
6. Update documentation as needed
7. Follow the code style (run `npm run format`)
8. Ensure all checks pass (`npm run check`)

### 🚀 **Adding New Modules:**

```bash
# 1. Copy template
cp src/core/template.registry.ts.example src/modules/your-module/your-module.registry.ts

# 2. Edit template with your module services
# 3. Add 1 line to container-setup.ts: await import('@/modules/your-module/your-module.registry');
# 4. Create routes in src/routes/your-module.routes.ts
# 5. Register routes in src/routes/index.ts
# 6. Zero conflicts! ✨
```

For detailed module creation guide, see **[docs/ONBOARDING.md](docs/ONBOARDING.md)**.

## 📝 License

MIT License - see LICENSE file for details.

---

**Ready for conflict-free development!** 🎉

Multiple developers can now work in parallel without merge conflicts using the **Module Registry Pattern** and **Centralized Routes**.
