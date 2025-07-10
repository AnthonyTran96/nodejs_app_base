# Node.js Backend Onboarding Guide

Welcome to the Node.js Backend project! This guide will help you understand the project structure, conventions, and how to add new features safely and securely.

## 🏗️ Project Architecture

This project follows a **layered architecture** with **centralized dependency injection** and **comprehensive security middleware**:

```
Application Bootstrap
    ↓
Security & Sanitization Middleware
    ↓
ContainerSetup (Dependency Registration)
    ↓
Controllers → Services → Unit of Work → Repositories → Database
```

### Dependency Flow:

1. **Application** initializes database and security middleware
2. **Security Layer** sanitizes input and enforces security policies
3. **ContainerSetup** registers all services and dependencies
4. **Container** manages service instantiation and injection
5. **Routes** are initialized with injected controllers

## 📁 Folder Structure

```
src/
├── app.ts               # 🎯 Application bootstrap (clean & focused)
├── config/              # Environment configuration
├── core/               # 🏗️ Core infrastructure
│   ├── container.ts    # Dependency injection container
│   ├── container-setup.ts # 🔧 Centralized dependency registration
│   ├── base.repository.ts # Base repository pattern
│   ├── unit-of-work.ts # Transaction management
│   ├── module-registry.ts # Module registration system
│   └── index.ts        # Route initialization
├── database/           # Database connection and migrations
│   ├── connection.ts   # PostgreSQL/SQLite connection
│   ├── migrations/     # Database schema migrations
│   └── seeds/          # Sample data seeding
├── middleware/         # Express middleware
│   ├── auth.middleware.ts        # Authentication & authorization
│   ├── validation.middleware.ts  # Input validation
│   ├── sanitization.middleware.ts # 🆕 XSS prevention & input cleaning
│   ├── error-handler.ts         # Error handling
│   ├── not-found-handler.ts     # 404 handling
│   └── request-logger.ts        # Request logging
├── routes/             # 🛣️ Centralized API routes
│   ├── index.ts        # Main routes initialization & overview
│   ├── auth.routes.ts  # Authentication routes
│   ├── user.routes.ts  # User management routes
│   └── README.md       # Routes documentation & guidelines
├── types/              # TypeScript type definitions
│   ├── role.enum.ts    # 🎭 Role enum
│   ├── common.ts       # Common interfaces (pagination, etc.)
│   ├── database.ts     # Core database connection types
│   ├── filter.ts       # 🆕 Advanced filtering types
│   └── repository.ts   # 🆕 Repository schema & type definitions
├── utils/              # Utility functions (logger, response, hash)
├── modules/            # 📦 Feature modules
│   ├── auth/           # Authentication module
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.registry.ts
│   └── user/           # User management module
│       ├── user.controller.ts
│       ├── user.service.ts
│       ├── user.repository.ts
│       ├── user.dto.ts
│       └── user.registry.ts
└── models/             # Data models and interfaces

reports/                # 🆕 Security and testing reports
├── security-testing/   # Security audit reports
└── api-testing/        # API testing results

tests/
├── unit/               # Unit tests
├── integration/        # Integration tests
└── e2e/                # End-to-end tests

docs/
├── ONBOARDING.md           # 📖 This guide
├── DATABASE_MIGRATION_GUIDE.md # Database management
└── ENVIRONMENT_SETUP.md    # Environment configuration (now with CORS)
```

## 🛡️ Security-First Development

This project implements **defense-in-depth security** with multiple layers of protection:

### Security Layers:

1. **Input Sanitization** - XSS prevention on all user inputs
2. **Input Validation** - Schema validation with class-validator
3. **Authentication** - JWT-based authentication system
4. **Authorization** - Role-based access control (RBAC)
5. **Security Headers** - Comprehensive HTTP security headers
6. **Request Limits** - Size and rate limiting protection
7. **CORS Security** - Environment-aware cross-origin policies

## 🔒 Security Middleware System

### Input Sanitization Middleware

**Location:** `src/middleware/sanitization.middleware.ts`

Automatically removes dangerous HTML/JavaScript content from user inputs:

```typescript
import { SanitizeUserInput, SanitizeContentInput } from '@/middleware/sanitization.middleware';

// Apply to routes that handle user input
router.post(
  '/register',
  SanitizeUserInput(), // 🛡️ Sanitize first
  ValidateBody(CreateUserDto), // Then validate
  authController.register
);
```

**Protection Features:**

- ✅ Removes `<script>` tags and JavaScript
- ✅ Strips dangerous HTML tags (`iframe`, `object`, etc.)
- ✅ Eliminates event handlers (`onclick`, `onload`)
- ✅ Encodes remaining dangerous characters
- ✅ Logs sanitization events for monitoring
- ✅ Configurable field targeting

**Usage Examples:**

```typescript
// For user data (name, email, bio)
SanitizeUserInput();

// For content that allows basic HTML
SanitizeContentInput();

// Custom field targeting
SanitizeInput({
  fields: ['name', 'description'],
  allowBasicHtml: false,
  logSanitization: true,
});
```

### Enhanced Security Headers

The application includes comprehensive security headers:

```typescript
// Automatically applied in app.ts
Content-Security-Policy: default-src 'self'; script-src 'self'
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: same-origin
```

### Request Security

- **Size Limits**: 1MB maximum request size (prevents DoS)
- **Error Handling**: Proper 413 responses for oversized requests
- **Monitoring**: Request size violations logged with IP tracking

## 🎭 Role System & Type Safety

This project uses a **TypeScript enum-based role system** for enhanced type safety and maintainability.

### Role Enum Definition

```typescript
// src/types/role.enum.ts
export enum Role {
  USER = 'user',
  ADMIN = 'admin',
}

export type RoleType = Role;

// Helper functions for role operations
export const isValidRole = (role: string): role is Role => {
  return Object.values(Role).includes(role as Role);
};

export const getRoleValues = (): string[] => {
  return Object.values(Role);
};
```

### Benefits of Enum-Based Roles

- ✅ **Type Safety**: Compile-time checking prevents invalid role assignments
- ✅ **Single Source of Truth**: All role values defined in one place
- ✅ **IDE Support**: Autocomplete and IntelliSense for role values
- ✅ **Refactoring Safety**: Renaming roles updates all usages automatically
- ✅ **Runtime Validation**: Helper functions for dynamic validation

### Usage in Models and DTOs

```typescript
// src/models/user.model.ts
import { Role } from '@/types/role.enum';

export interface User {
  id: number;
  email: string;
  role: Role; // Type-safe role property
  // ... other properties
}

// src/modules/user/user.dto.ts
import { Role, getRoleValues } from '@/types/role.enum';
import { IsEnum, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsOptional()
  @IsEnum(Role, { message: `Role must be one of: ${getRoleValues().join(', ')}` })
  role?: Role = Role.USER; // Default to USER role
}
```

### Authorization with Role Guards

```typescript
// Import the Role enum
import { Role } from '@/types/role.enum';
import { AuthGuard, authorize } from '@/middleware/auth.middleware';

// Single role authorization
router.delete('/:id', authorize([Role.ADMIN]), deleteHandler);

// Multiple roles authorization
router.get('/dashboard', authorize([Role.ADMIN, Role.USER]), dashboardHandler);

// In controller methods
async deletePost(req: AuthenticatedRequest, res: Response): Promise<void> {
  // Type-safe role checking
  if (req.user?.role === Role.ADMIN) {
    // Admin-specific logic
  }
}
```

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# See docs/ENVIRONMENT_SETUP.md for detailed guide
```

Basic `.env` configuration:

```env
NODE_ENV=development
PORT=3000
DB_TYPE=sqlite
DB_SQLITE_PATH=./database.sqlite
JWT_SECRET=your-development-jwt-secret-key-32-chars
JWT_REFRESH_SECRET=your-development-refresh-secret-32-chars
COOKIE_SECRET=your-development-cookie-secret-32-chars

# CORS is auto-configured for development
# Set ALLOWED_ORIGINS only if you need custom origins
# ALLOWED_ORIGINS=http://localhost:8080,http://myapp.dev:3000
```

### 3. Database Setup

The application will automatically create the SQLite database and run migrations on startup.

For production, configure PostgreSQL in your environment variables.

### 4. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

## 🛠️ Development Workflow

### Understanding the Application Flow

```typescript
// src/app.ts - Clean application setup with security
export class Application {
  async initialize(): Promise<void> {
    await this.setupDatabase(); // 1. Setup database
    this.setupMiddleware(); // 2. Setup security & middleware
    await this.containerSetup.setupDependencies(); // 3. Register all services
    this.setupRoutes(); // 4. Mount routes
    this.setupErrorHandling(); // 5. Setup error handling
  }

  private setupMiddleware(): void {
    // Security headers
    this.app.use(
      helmet({
        /* enhanced config */
      })
    );

    // CORS with environment-aware origins
    this.app.use(
      cors({
        origin: config.allowedOrigins, // Dynamic based on environment
        credentials: true,
      })
    );

    // Request size limits (1MB)
    this.app.use(express.json({ limit: '1mb' }));

    // Request size error handling
    this.app.use((error, req, res, next) => {
      if (error?.type === 'entity.too.large') {
        return res.status(413).json({
          success: false,
          message: 'Request payload too large. Maximum size allowed is 1MB.',
        });
      }
      next(error);
    });
  }
}
```

### Dependency Injection with Module Registry

```typescript
// src/core/container-setup.ts - Module Registry Pattern
export class ContainerSetup {
  async setupDependencies(): Promise<void> {
    // 1. Load all module registries (auto-registers)
    await this.loadModules();

    // 2. Initialize all registered modules
    await ModuleRegistry.initializeAllModules(this.container);

    // 3. Initialize container
    await this.container.initialize();

    // 4. Initialize routes
    initializeRoutes();
  }

  private async loadModules(): Promise<void> {
    // Each module self-registers when imported
    await import('@/core/core.registry');
    await import('@/modules/user/user.registry');
    await import('@/modules/auth/auth.registry');
    await import('@/modules/websocket/websocket.registry'); // 🔌 WebSocket module

    // 🎯 New modules can be added here by any developer
    // await import('@/modules/product/product.registry');
    // await import('@/modules/order/order.registry');
  }
}
```

## 📦 Module Registry System

This project uses a **Module Registry Pattern** to eliminate merge conflicts when multiple developers add services.

### ✅ Benefits:

- **Parallel Development**: Each developer works on separate modules
- **Minimal Conflicts**: Only need to add 1 line per new module
- **Clear Ownership**: Each module manages its own dependencies
- **Type Safety**: Full TypeScript support

### 🎯 How it works:

1. Each module creates a `*.registry.ts` file
2. The registry file self-registers all module services
3. `container-setup.ts` just imports the registry files
4. **No more massive merge conflicts!** 🎉

## 🆕 Adding a New Feature Module (Security-First)

Follow these steps to add a new feature (e.g., "Posts") with proper security:

### 1. Create the Module Structure

```bash
mkdir src/modules/post
touch src/modules/post/post.dto.ts
touch src/modules/post/post.repository.ts
touch src/modules/post/post.service.ts
touch src/modules/post/post.controller.ts
touch src/modules/post/post.registry.ts
```

### 2. Create the Model

```typescript
// src/models/post.model.ts
export interface Post {
  id: number;
  title: string;
  content: string;
  authorId: number;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePostRequest {
  title: string;
  content: string;
  authorId: number;
  published?: boolean;
}

export interface PostResponse {
  id: number;
  title: string;
  content: string;
  authorId: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### 3. Create DTOs with Security Validation

```typescript
// src/modules/post/post.dto.ts
import { IsNotEmpty, IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class CreatePostDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255) // 🔒 Prevent excessively long titles
  title!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(50000) // 🔒 Reasonable content limit
  content!: string;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50000)
  content?: string;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}
```

### 4. Create Repository (with Automatic Data Transformation)

The `BaseRepository` provides powerful, automatic data transformation. You only need to define a `schema` to tell it how to handle data types.

**Key Features:**

- **`transformRow`**: Automatically transforms data read from the database (e.g., SQLite `1`/`0` to `boolean`, date `string` to `Date` object).
- **`transformInputData`**: Automatically transforms data being written to the database (e.g., `camelCase` from your code to `snake_case` for SQL columns), including in filters.

This keeps your repository code clean, declarative, and database-agnostic.

```typescript
// src/modules/post/post.repository.ts
import { BaseRepository } from '@/core/base.repository';
import { Post, CreatePostRequest } from '@/models/post.model';
import { Service } from '@/core/container';
import { RepositorySchema } from '@/types/repository';

@Service('PostRepository')
export class PostRepository extends BaseRepository<Post> {
  protected readonly tableName = 'posts';

  // 🎯 Define the transformation schema.
  // This tells BaseRepository how to convert data types automatically.
  protected override readonly schema: RepositorySchema<Post> = {
    published: 'boolean',
    createdAt: 'date',
    updatedAt: 'date',
  };

  // ✅ The 'create' method is overridden for TYPE SAFETY.
  // It ensures services must provide a valid 'CreatePostRequest'.
  // The actual logic (incl. camelCase -> snake_case) is handled by BaseRepository.
  override async create(data: CreatePostRequest): Promise<Post> {
    return super.create(data);
  }

  // Example of a custom method using the powerful findByFilter.
  // Note: No manual data transformation is needed!
  // `transformInputData` handles the filter keys (authorId -> author_id)
  // `transformRow` handles the output data.
  async findByAuthor(authorId: number): Promise<Post[]> {
    const result = await this.findByFilter({ authorId });
    return result.data;
  }
}
```

### 5. Create Service

```typescript
// src/modules/post/post.service.ts
import { PostRepository } from '@/modules/post/post.repository';
import { UnitOfWork } from '@/core/unit-of-work';
import { Post, CreatePostRequest, PostResponse } from '@/models/post.model';
import { PaginationOptions, PaginatedResult } from '@/types/common';
import { Service } from '@/core/container';

@Service('PostService')
export class PostService {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly unitOfWork: UnitOfWork
  ) {}

  async create(postData: CreatePostRequest): Promise<PostResponse> {
    return this.unitOfWork.executeInTransaction(async () => {
      const post = await this.postRepository.create({
        ...postData,
        published: postData.published ?? false,
      });
      return this.toPostResponse(post);
    });
  }

  async findAll(options?: PaginationOptions): Promise<PaginatedResult<PostResponse>> {
    const result = await this.postRepository.findAll(options);
    return {
      data: result.data.map(post => this.toPostResponse(post)),
      meta: result.meta,
    };
  }

  private toPostResponse(post: Post): PostResponse {
    return {
      id: post.id,
      title: post.title,
      content: post.content,
      authorId: post.authorId,
      published: post.published,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  }
}
```

### 6. Create Controller

```typescript
// src/modules/post/post.controller.ts
import { Response, NextFunction } from 'express';
import { PostService } from '@/modules/post/post.service';
import { ResponseUtil } from '@/utils/response';
import { AuthenticatedRequest } from '@/types/common';
import { Service } from '@/core/container';

@Service('PostController')
export class PostController {
  constructor(private readonly postService: PostService) {}

  async createPost(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const postData = { ...req.body, authorId: req.user?.userId };
      const post = await this.postService.create(postData);
      ResponseUtil.success(res, post, 'Post created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async getPosts(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, sortBy, sortOrder } = req.query;

      const result = await this.postService.findAll({
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'ASC' | 'DESC',
      });

      ResponseUtil.successWithPagination(res, result, 'Posts retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
```

### 7. Create Module Registry (🆕 Key Step!)

```typescript
// src/modules/post/post.registry.ts
import { Container } from '@/core/container';
import { ModuleRegistry } from '@/core/module-registry';

ModuleRegistry.registerModule({
  name: 'PostModule',
  register: async (container: Container) => {
    // Import services for this module only
    const { PostRepository } = await import('@/modules/post/post.repository');
    const { PostService } = await import('@/modules/post/post.service');
    const { PostController } = await import('@/modules/post/post.controller');

    // Register services with dependencies
    container.register('PostRepository', PostRepository);

    container.register('PostService', PostService, {
      dependencies: ['PostRepository', 'UnitOfWork'],
    });

    container.register('PostController', PostController, {
      dependencies: ['PostService'],
    });
  },
});
```

### 8. Add to Container Setup (Only 1 line!)

```typescript
// src/core/container-setup.ts - Just add ONE line!
private async loadModules(): Promise<void> {
  await import('@/core/core.registry');
  await import('@/modules/user/user.registry');
  await import('@/modules/auth/auth.registry');
  await import('@/modules/post/post.registry'); // ✅ Just add this line!
}
```

### 9. Create Routes (🆕 Centralized Routes!)

```typescript
// src/routes/post.routes.ts
import { Router } from 'express';
import { PostController } from '@/modules/post/post.controller';
import { ValidateBody, ValidateParams, ValidateQuery } from '@/middleware/validation.middleware';
import { SanitizeContentInput } from '@/middleware/sanitization.middleware'; // 🆕 Security
import { AuthGuard, authorize } from '@/middleware/auth.middleware';
import { CreatePostDto, UpdatePostDto } from '@/modules/post/post.dto';
import { IdParamDto, PaginationDto } from '@/types/common.dto';
import { Role } from '@/types/role.enum';

export function createPostRoutes(postController: PostController): Router {
  const router = Router();

  // All routes require authentication
  router.use(AuthGuard);

  router.get('/', ValidateQuery(PaginationDto), postController.getPosts.bind(postController));

  router.post(
    '/',
    SanitizeContentInput(), // 🛡️ Sanitize first (allows basic HTML in content)
    ValidateBody(CreatePostDto), // Then validate
    postController.createPost.bind(postController)
  );

  router.put(
    '/:id',
    ValidateParams(IdParamDto),
    SanitizeContentInput(), // 🛡️ Sanitize updates too
    ValidateBody(UpdatePostDto),
    postController.updatePost.bind(postController)
  );

  router.delete(
    '/:id',
    authorize([Role.ADMIN]), // 🔒 Only admins can delete
    ValidateParams(IdParamDto),
    postController.deletePost.bind(postController)
  );

  return router;
}
```

### 10. Register Routes in Centralized Routes

```typescript
// src/routes/index.ts - Add to initializeRoutes function
import { createPostRoutes } from './post.routes';

export function initializeRoutes(): Router {
  const router = Router();
  const container = Container.getInstance();

  // Get controllers from container with proper typing
  const authController = container.get<AuthController>('AuthController');
  const userController = container.get<UserController>('UserController');
  const postController = container.get<PostController>('PostController'); // Add this

  // Register route modules
  router.use('/auth', createAuthRoutes(authController));
  router.use('/users', createUserRoutes(userController));
  router.use('/posts', createPostRoutes(postController)); // Add this line

  return router;
}
```

## 🗄️ Database Management

### Database Support

- **Development**: SQLite (automatic setup)
- **Production**: PostgreSQL (recommended)

### Migration System

```bash
# Run migrations (automatically on startup)
npm run db:migrate

# Check migration status
npm run db:migrate:status

# Rollback last migration
npm run db:migrate:rollback
```

See `docs/DATABASE_MIGRATION_GUIDE.md` for detailed database management.

## 🧪 Testing Strategy

### Security Testing

Test security measures are in place:

```bash
# Security test reports available in:
reports/security-testing/comprehensive-security-test-report.md
reports/security-testing/security-fixes-verification-report.md
```

### Unit Tests

Test services in isolation with mocked dependencies.

### Integration Tests

Test repository interactions with the database.

### E2E Tests

Test complete API workflows.

```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e
```

## 🚀 CI/CD Pipeline

The project includes a comprehensive **GitHub Actions CI/CD pipeline** that automates the entire deployment process with enhanced error handling and debugging capabilities.

### Pipeline Architecture

```
Build & Test → Package → Deploy → Verify
     ↓
┌─ Checkout & Setup
├─ Install Dependencies
├─ Lint Check
├─ Build Application
├─ Optimize for Production
├─ Package & Upload
└─ Multi-Step Deployment:
   ├─ 12a: Deploy Files (5 min timeout)
   ├─ 12b: Setup Dependencies (10 min timeout)
   ├─ 12c: Start Application (3 min timeout)
   └─ 12d: Verify Deployment (2 min timeout)
```

### Deployment Steps Breakdown

#### **Step 12a: Deploy Files to Server** (5 minutes)

- ✅ Unzip and deploy application files
- ✅ Create automatic backup of existing application
- ✅ Environment configuration setup
- ✅ File permission and ownership management

#### **Step 12b: Setup Dependencies** (10 minutes)

- ✅ SQLite module compatibility check with timeout
- ✅ Production dependencies installation (`yarn install --omit=dev`)
- ✅ Native module verification
- ✅ Optimized for production environment

#### **Step 12c: Start Application** (3 minutes)

- ✅ PM2 process management (restart existing or start new)
- ✅ Configuration persistence with `pm2 save`
- ✅ Application stability verification
- ✅ Graceful startup with health monitoring

#### **Step 12d: Verify Deployment** (2 minutes)

- ✅ PM2 process status verification
- ✅ Application health check
- ✅ Log output analysis for errors
- ✅ Deployment success confirmation

### Infrastructure Features

#### **Cloudflare Tunnel Integration**

- 🔒 **Secure SSH**: All connections via Cloudflare Access
- 🌐 **Zero Trust**: No direct server exposure
- ⚡ **ARM64 Optimized**: Native cloudflared for ARM64 runners

#### **Enhanced SSH Configuration**

- ⏱️ **Connection Timeout**: 30 seconds for quick failure detection
- 💓 **Keep-Alive**: 10-second intervals to maintain connection
- 🔐 **ED25519 Keys**: Modern cryptography for enhanced security

#### **Production Optimization**

- 📦 **Dependency Pruning**: Removes dev dependencies for smaller deployment
- 🗜️ **Native Module Check**: Ensures compatibility across environments
- 🔄 **Zero-Downtime**: Graceful restart with backup capability

### Deployment Triggers

```yaml
# Automatic deployment on push to auto-build branch
on:
  push:
    branches:
      - auto-build
```

### Environment Requirements

#### **GitHub Secrets** (Required)

```bash
SSH_PRIVATE_KEY     # ED25519 private key for server access
SSH_HOSTNAME        # Cloudflare tunnel hostname
SSH_USER           # Server username
SSH_FINGERPRINT    # Server host key fingerprint
```

#### **GitHub Variables** (Required)

```bash
APP_NAME           # Application name for deployment paths
```

### Monitoring & Debugging

#### **Enhanced Logging**

- 🎯 **Step-by-step progress** with emoji indicators
- ⏱️ **Timeout monitoring** for each deployment phase
- 🔍 **Detailed error reporting** with specific failure points
- 📊 **Performance tracking** with execution times

#### **Failure Detection**

- ❌ **Fast failure** with specific timeouts per step
- 🔄 **Automatic rollback** on critical failures
- 📋 **Health verification** before deployment completion
- 📜 **Log analysis** for troubleshooting

### Example Deployment Flow

```bash
# 1. Developer pushes to auto-build branch
git push origin auto-build

# 2. GitHub Actions pipeline triggers:
🔄 Checkout repository (9s)
⚙️ Setup Node.js 20 (5s)
🔐 Configure SSH access (0s)
🌐 Setup Cloudflare tunnel (59s)
📦 Install dependencies (21s)
✅ Lint check (1s)
🏗️ Build application (3s)
🗜️ Optimize production bundle (7s)
📤 Upload to server (22s)

# 3. Multi-step deployment:
🚀 Deploy Files (30-60s)
📦 Setup Dependencies (1-3 min)
🔄 Start Application (30-60s)
🩺 Verify Deployment (10-20s)

# 4. Total deployment time: 3-5 minutes
```

### Deployment Best Practices

#### **✅ Recommended Practices**

1. **Branch Protection**: Only deploy from `auto-build` branch
2. **Testing First**: Ensure all tests pass before deployment
3. **Rollback Plan**: Automatic backup created before each deployment
4. **Health Monitoring**: Verify application status after deployment
5. **Environment Isolation**: Use separate configurations for dev/prod

#### **🚨 Troubleshooting Common Issues**

```bash
# SSH connection timeout
- Check Cloudflare tunnel configuration
- Verify SSH_HOSTNAME and credentials

# Dependencies installation hanging
- Check network connectivity on server
- Verify yarn.lock file integrity

# PM2 process management issues
- Check application logs: pm2 logs APP_NAME
- Verify PM2 configuration file

# Application health check failures
- Check server resources (memory, CPU)
- Verify database connectivity
- Review application startup logs
```

### Local Development vs Production

#### **Development Environment**

- 🔧 SQLite database with auto-migrations
- 🔥 Hot reload with nodemon
- 📝 Debug logging enabled
- 🌐 Auto-CORS configuration

#### **Production Deployment**

- 🗄️ PostgreSQL database (recommended)
- ⚡ PM2 process management
- 📊 Structured logging (JSON format)
- 🔒 Secure CORS with explicit origins
- 🗜️ Optimized bundle without dev dependencies

## 🛡️ Authentication & Authorization

### Using Security Guards

```typescript
// Import required modules
import { AuthGuard, authorize } from '@/middleware/auth.middleware';
import { SanitizeUserInput, SanitizeContentInput } from '@/middleware/sanitization.middleware';
import { Role } from '@/types/role.enum';

// In route definitions - Security Layer Order:
router.post(
  '/',
  SanitizeUserInput(), // 1. 🛡️ Sanitize dangerous input
  ValidateBody(CreateDto), // 2. ✅ Validate schema
  AuthGuard, // 3. 🔒 Require authentication
  authorize([Role.ADMIN]), // 4. 👮 Check authorization
  controller.create // 5. 🎯 Execute business logic
);

// Multiple roles
router.get(
  '/dashboard',
  AuthGuard,
  authorize([Role.ADMIN, Role.USER]), // Admin or User access
  controller.dashboard
);
```

### Accessing User in Controllers

```typescript
import { Role } from '@/types/role.enum';

async createPost(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.userId;  // Available after AuthGuard
  const userRole = req.user?.role;  // User role for authorization (type: Role)

  // Type-safe role checking
  if (userRole === Role.ADMIN) {
    // Admin-specific logic
  } else if (userRole === Role.USER) {
    // User-specific logic
  }

  const postData = { ...req.body, authorId: userId };
  // Note: req.body is already sanitized by SanitizeInput middleware
}
```

## 📝 Security-Enhanced Validation

Use class-validator decorators with security considerations:

```typescript
import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsOptional,
  IsBoolean,
  IsEnum,
  MaxLength,
  IsAlphanumeric,
  Matches,
} from 'class-validator';
import { Role, getRoleValues } from '@/types/role.enum';

export class CreateUserDto {
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(255) // 🔒 Prevent excessively long emails
  email!: string;

  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(128) // 🔒 Reasonable password limit
  // @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, { message: 'Password too weak' })  // Optional strength
  password!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100) // 🔒 Prevent excessively long names
  name!: string; // Will be sanitized by SanitizeUserInput middleware

  @IsOptional()
  @IsEnum(Role, {
    message: `Role must be one of: ${getRoleValues().join(', ')}`,
  })
  role?: Role = Role.USER; // Default to USER role
}
```

## 🔧 Utilities

### Response Formatting

Always use `ResponseUtil` for consistent responses:

```typescript
import { ResponseUtil } from '@/utils/response';

// Success responses
ResponseUtil.success(res, data, 'Success message');
ResponseUtil.success(res, data, 'Created successfully', 201);

// Paginated responses
ResponseUtil.successWithPagination(res, paginatedResult);

// Error responses
ResponseUtil.error(res, 'Error message', 400);
ResponseUtil.notFound(res, 'Resource not found');
```

### Security Logging

Use the configured logger for security events:

```typescript
import { logger } from '@/utils/logger';

// Security events are automatically logged by middleware
// Manual security logging:
logger.warn('Suspicious activity detected', {
  userId,
  ip: req.ip,
  userAgent: req.get('user-agent'),
  action: 'multiple_failed_attempts',
});

logger.info('Operation completed', { userId, postId });
logger.error('Failed to create post:', error);
logger.debug('Debug information', { data });
```

## 🔒 Security Best Practices

### 1. Input Security

- ✅ **Always sanitize** user input using `SanitizeUserInput()` or `SanitizeContentInput()`
- ✅ **Validate after sanitization** using DTOs and class-validator
- ✅ **Set maximum lengths** to prevent buffer overflow attacks
- ✅ **Use enum validation** for constrained values like roles

### 2. Route Security

- ✅ **Apply middleware in order**: Sanitize → Validate → Authenticate → Authorize
- ✅ **Use parameterized queries** (automatically handled by repositories)
- ✅ **Implement proper authentication** with JWT tokens
- ✅ **Use role-based authorization** with enum-based guards

### 3. Role Security Guidelines

```typescript
import { Role, isValidRole } from '@/types/role.enum';

// ✅ Good: Type-safe role checking
if (user.role === Role.ADMIN) {
  // Admin logic
}

// ✅ Good: Dynamic role validation
if (isValidRole(inputRole)) {
  user.role = inputRole as Role;
}

// ❌ Bad: Using string literals
if (user.role === 'admin') {
  // No type safety
  // Admin logic
}
```

### 4. Environment Security

- ✅ **Use proper environment configuration** (see `docs/ENVIRONMENT_SETUP.md`)
- ✅ **Set ALLOWED_ORIGINS** in production for CORS security
- ✅ **Never commit** `.env` files to git
- ✅ **Use strong secrets** (32+ characters)
- ✅ **Different secrets** for each environment

### 5. Security Monitoring

- ✅ **Monitor sanitization logs** for attack attempts
- ✅ **Track large request attempts** (DoS indicators)
- ✅ **Log authentication failures** for brute force detection
- ✅ **Review security reports** in `reports/security-testing/`

## 🌐 CORS & Environment Configuration

### Development CORS (Auto-configured)

```typescript
// When ALLOWED_ORIGINS not set, automatically allows:
[
  `http://localhost:${PORT}`, // Your current PORT
  `http://127.0.0.1:${PORT}`, // IP version
  'http://localhost:3000', // Common dev ports
  'http://localhost:3001',
  // ... additional dev ports
];
```

### Production CORS (Required)

```env
# Production .env - REQUIRED for security
ALLOWED_ORIGINS=https://yourdomain.com,https://admin.yourdomain.com
```

### Custom Development CORS

```env
# Development .env - when you need specific origins
ALLOWED_ORIGINS=http://localhost:8080,http://myapp.dev:3000
```

## 📊 Environment Configuration

- **Development**: SQLite, debug logging, auto-migrations, auto-CORS
- **Test**: SQLite, error-only logging, auto-migrations, test-specific CORS
- **Production**: PostgreSQL, warn logging, manual migrations, HTTPS CORS required

See `docs/ENVIRONMENT_SETUP.md` for complete configuration guide including new CORS options.

## 🚦 API Conventions

### Endpoints

- Use RESTful conventions
- Prefix with `/api/v1`
- Use plural nouns for resources (`/users`, `/posts`)

### Security Headers

All responses automatically include:

```http
Content-Security-Policy: default-src 'self'; script-src 'self'
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
```

### Response Format

All responses follow this structure:

```typescript
// Success Response
{
  "success": true,
  "data": any,
  "message": string
}

// Success with Pagination
{
  "success": true,
  "data": any[],
  "message": string,
  "meta": {
    "page": number,
    "limit": number,
    "total": number,
    "totalPages": number
  }
}

// Error Response
{
  "success": false,
  "message": string,
  "errors"?: Record<string, string[]>
}

// Security Error (413 - Request Too Large)
{
  "success": false,
  "message": "Request payload too large. Maximum size allowed is 1MB.",
  "error": "PAYLOAD_TOO_LARGE",
  "maxSize": "1MB"
}
```

## 🗃️ Advanced Repository Features: Field Mapping

### Enhanced Schema System

The repository layer now supports **advanced field mapping** that allows you to map model fields to specific database column names while maintaining automatic type transformations.

### Schema Configuration Types

```typescript
// Simple type definition (uses default snake_case conversion)
protected override readonly schema: RepositorySchema<User> = {
  createdAt: 'date',        // createdAt -> created_at (default)
  isActive: 'boolean',      // isActive -> is_active (default)
};

// Advanced configuration with custom column mapping
protected override readonly schema: RepositorySchema<User> = {
  // Custom column mapping
  emailAddress: {
    type: 'string',
    column: 'email'         // emailAddress -> email (custom)
  },

  isActive: {
    type: 'boolean',
    column: 'active'        // isActive -> active (custom)
  },

  // Mixed: some custom, some default
  createdAt: {
    type: 'date',
    column: 'creation_date' // createdAt -> creation_date (custom)
  },
  updatedAt: 'date',        // updatedAt -> updated_at (default)
};
```

### Field Mapping Examples

#### Example 1: User Repository with Custom Mappings

```typescript
// src/modules/user/user.repository.ts
@Service('UserRepository')
export class UserRepository extends BaseRepository<User> {
  protected readonly tableName = 'users';
  protected override readonly schema: RepositorySchema<User> = {
    // Custom column mappings
    createdAt: { type: 'date', column: 'created_at' },
    updatedAt: { type: 'date', column: 'updated_at' },

    // Fields without mappings use default conversion:
    // id -> id (no change)
    // email -> email (no change)
    // name -> name (no change)
    // role -> role (no change)
    // password -> password (no change)
  };
}
```

#### Example 2: Complex Model with Mixed Mappings

```typescript
interface Product {
  id: number;
  productName: string; // -> product_name (default)
  shortDescription: string; // -> short_desc (custom)
  fullDescription: string; // -> description (custom)
  isAvailable: boolean; // -> available (custom)
  categoryId: number; // -> category_id (default)
  priceData: object; // -> price_info (custom, JSON)
  createdAt: Date; // -> created_at (default)
  lastModified: Date; // -> modified_date (custom)
}

class ProductRepository extends BaseRepository<Product> {
  protected readonly tableName = 'products';
  protected override readonly schema: RepositorySchema<Product> = {
    // Custom mappings
    shortDescription: { type: 'string', column: 'short_desc' },
    fullDescription: { type: 'string', column: 'description' },
    isAvailable: { type: 'boolean', column: 'available' },
    priceData: { type: 'json', column: 'price_info' },
    lastModified: { type: 'date', column: 'modified_date' },

    // Default mappings (no configuration needed)
    // productName -> product_name
    // categoryId -> category_id
    // createdAt -> created_at
  };
}
```

### How Field Mapping Works

#### 1. Reading from Database (`transformRow`)

```typescript
// Database row (snake_case columns)
const dbRow = {
  id: 1,
  email: 'user@example.com', // Custom mapping
  created_at: '2024-01-01', // Custom mapping
  user_name: 'john_doe', // Default conversion
};

// Transformed to model (camelCase fields)
const model = {
  id: 1,
  emailAddress: 'user@example.com', // email -> emailAddress (custom)
  createdAt: new Date('2024-01-01'), // created_at -> createdAt (custom + type)
  userName: 'john_doe', // user_name -> userName (default)
};
```

#### 2. Writing to Database (`transformInputData`)

```typescript
// Model data (camelCase fields)
const modelData = {
  emailAddress: 'user@example.com', // -> email (custom)
  userName: 'john_doe', // -> user_name (default)
  isActive: true, // -> active (custom)
  createdAt: new Date(), // -> creation_date (custom)
};

// Transformed to database format (snake_case columns)
const dbData = {
  email: 'user@example.com', // emailAddress -> email
  user_name: 'john_doe', // userName -> user_name
  active: true, // isActive -> active
  creation_date: new Date(), // createdAt -> creation_date
};
```

### Comprehensive Field Types

The repository system now supports a comprehensive set of field types to handle all common database data types:

```typescript
export type FieldType =
  // String Types
  | 'string' // Default string handling
  | 'text' // Large text fields (semantic distinction)
  | 'uuid' // UUID validation and formatting

  // Number Types
  | 'number' // General number (parseFloat)
  | 'integer' // Specific integer handling (parseInt)
  | 'float' // Explicit float handling (parseFloat)
  | 'decimal' // High precision decimal with optional precision

  // Boolean Type
  | 'boolean' // Enhanced boolean conversion (true/false, 1/0, yes/no, on/off)

  // Date/Time Types
  | 'date' // Date object conversion
  | 'datetime' // Alias for date (semantic distinction)
  | 'timestamp' // Unix timestamp to Date conversion

  // Complex Types
  | 'json' // JSON.parse() for objects
  | 'array' // JSON.parse() for arrays
  | 'bigint' // BigInt() conversion
  | 'buffer' // Buffer handling for binary data

  // Validation Types
  | 'enum'; // Enum validation with enumValues/enumType
```

#### Field Type Examples

```typescript
protected override readonly schema: RepositorySchema<Model> = {
  // String types
  name: 'string',                    // Basic string
  description: 'text',               // Large text content
  userId: 'uuid',                    // UUID with validation

  // Number types
  score: 'number',                   // General number (float)
  count: 'integer',                  // Integer only
  rating: 'float',                   // Explicit float
  price: {                           // Decimal with precision
    type: 'decimal',
    precision: 2                     // 2 decimal places
  },

  // Boolean (handles multiple input formats)
  isActive: 'boolean',               // true/false, 1/0, 'yes'/'no', 'on'/'off'

  // Date/Time types
  createdAt: 'date',                 // Standard Date
  lastLogin: 'datetime',             // Alias for date
  unixTime: 'timestamp',             // Unix timestamp → Date

  // Complex types
  metadata: 'json',                  // Object ↔ JSON string
  tags: 'array',                     // Array ↔ JSON string
  largeId: 'bigint',                 // BigInt ↔ string
  avatar: 'buffer',                  // Buffer ↔ base64 string

  // Enums
  role: { type: 'enum', enumType: Role },
  status: { type: 'enum', enumType: Status },
};
```

### Enum Field Type Usage

The `enum` field type provides automatic validation of enum values with support for string, number, and mixed enums:

#### Method 1: Direct Enum Type Reference (Recommended)

```typescript
import { Role } from '@/types/role.enum';

// String enum
enum Status {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
}

// Number enum
enum Priority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
}

// Mixed enum
enum TaskType {
  PERSONAL = 'personal',
  URGENT = 1,
}

// Use in schema with enumType (RECOMMENDED)
protected override readonly schema: RepositorySchema<Task> = {
  role: {
    type: 'enum',
    enumType: Role          // ✅ Clean, type-safe, auto-completion
  },

  status: {
    type: 'enum',
    enumType: Status        // ✅ String enum support
  },

  priority: {
    type: 'enum',
    enumType: Priority      // ✅ Number enum support
  },

  taskType: {
    type: 'enum',
    enumType: TaskType,     // ✅ Mixed enum support
    column: 'type'          // ✅ Can combine with custom column mapping
  },
};
```

#### Method 2: Manual Enum Values (Legacy Support)

```typescript
// Still supported but not recommended
protected override readonly schema: RepositorySchema<User> = {
  role: {
    type: 'enum',
    enumValues: ['user', 'admin']  // ❌ More verbose, no type safety
  },

  priority: {
    type: 'enum',
    enumValues: [1, 2, 3, 4]       // ✅ Number enum values
  },
};
```

**Enhanced Enum Features:**

- ✅ **String Enums**: `'active'` → `'active'` (direct pass-through)
- ✅ **Number Enums**: `'2'` → `2` (auto-converts string to number)
- ✅ **Mixed Enums**: Handles both string and number values
- ✅ **Type Safety**: Direct enum reference with TypeScript validation
- ✅ **Auto-completion**: IDE suggests valid enum names
- ✅ **Refactoring Safe**: Enum changes update automatically

**Enum Validation Examples:**

```typescript
// String enum validation
// Database: "active" -> Model: "active" ✅
// Database: "invalid" -> Model: "invalid" ⚠️ (with warning)

// Number enum validation
// Database: "2" -> Model: 2 ✅ (auto-converts)
// Database: 2 -> Model: 2 ✅ (already number)
// Database: "99" -> Model: "99" ⚠️ (invalid, with warning)

// Console warning example:
// ⚠️ "Invalid enum value 'invalid_role' for field 'role'. Expected one of: user, admin"
```

#### Type Conversion Behavior

**String Types:**

- `'string'`: Converts any value to string using `toString()`
- `'text'`: Same as string (semantic distinction for large text fields)
- `'uuid'`: Validates UUID format, warns on invalid format but preserves value

**Number Types:**

- `'number'/'float'`: Uses `parseFloat()`, defaults to 0 on NaN
- `'integer'`: Uses `parseInt()`, defaults to 0 on NaN
- `'decimal'`: Uses `parseFloat()` with optional precision rounding

**Boolean Type:**

- `'boolean'`: Enhanced conversion supporting multiple formats:
  - `true/false` → `true/false`
  - `'true'/'1'/'yes'/'on'` → `true`
  - `'false'/'0'/'no'/'off'` → `false`
  - Numbers: `0` → `false`, others → `true`

**Date/Time Types:**

- `'date'/'datetime'`: Uses `new Date()` conversion
- `'timestamp'`: Converts Unix timestamps to Date objects
  - Auto-detects seconds (10 digits) vs milliseconds
  - Handles both string and number inputs

**Complex Types:**

- `'json'`: Bidirectional JSON conversion (parse on read, stringify on write)
- `'array'`: Same as JSON but defaults to `[]` on error
- `'bigint'`: Converts to BigInt on read, stores as string in database
- `'buffer'`: Handles binary data as base64 strings in database

**Error Handling:**

- All type conversions include comprehensive error handling
- Invalid data logs warnings but preserves original values (prevents data loss)
- Provides sensible defaults for failed conversions

### Migration Guide for Existing Repositories

If you have existing repositories, you can gradually adopt field mapping:

```typescript
// Before (still works)
protected override readonly schema: RepositorySchema<User> = {
  createdAt: 'date',
  updatedAt: 'date',
};

// After (enhanced with custom mappings)
protected override readonly schema: RepositorySchema<User> = {
  createdAt: { type: 'date', column: 'created_at' },
  updatedAt: { type: 'date', column: 'updated_at' },
};
```

### Best Practices for Field Mapping

#### ✅ Good Practices

```typescript
// 1. Use custom mappings for legacy database columns
emailAddress: { type: 'string', column: 'email' },

// 2. Map foreign keys to more descriptive names
authorId: { type: 'number', column: 'author_id' },

// 3. Use custom mappings for database-specific naming
createdAt: { type: 'date', column: 'creation_timestamp' },

// 4. Combine type conversion with custom mapping
isActive: { type: 'boolean', column: 'active_flag' },

// 5. Use enum validation with direct enum type (RECOMMENDED)
role: { type: 'enum', enumType: Role },
status: { type: 'enum', enumType: Status },
priority: { type: 'enum', enumType: Priority }, // Works with number enums

// 6. Combine enum with custom column mapping
userType: {
  type: 'enum',
  enumType: UserType,
  column: 'type'
},

// 7. Legacy enum values approach (still supported)
// status: { type: 'enum', enumValues: ['active', 'inactive'] }, // Less preferred
```

#### ❌ Avoid These Patterns

```typescript
// Don't create mappings for every field if you can use schema
// Use DataTransformer.transformRow(row, schema) instead

// Don't use manual type conversion when DataTransformer handles it
published: Boolean(row.published), // Use type: 'boolean' instead

// Don't repeat mapping definitions - create reusable constants
// Define postFieldMappings, authorFieldMappings as constants
```

### Available Methods

```typescript
// Schema-based transformations
DataTransformer.transformRow<T>(row: any, schema: RepositorySchema<T>): T
DataTransformer.transformInputData<T>(data: any, schema: RepositorySchema<T>): any

// Custom field mappings
DataTransformer.transformCustomRow<T>(row: any, mappings: FieldMappings): Partial<T>

// Utility methods
DataTransformer.getFieldConfig<T>(schema: RepositorySchema<T>, fieldKey: keyof T): FieldConfig
DataTransformer.getColumnName<T>(schema: RepositorySchema<T>, fieldKey: string): string
DataTransformer.getFieldName<T>(schema: RepositorySchema<T>, columnName: string): string

// Type-specific transformations
DataTransformer.transformFieldValue(value: any, fieldConfig: FieldConfig, fieldKey: string): any
DataTransformer.transformInputFieldValue(value: any, fieldConfig: FieldConfig, fieldKey: string): any
```

### Example File

See comprehensive usage examples in the DataTransformer section below.

---

## 🔄 DataTransformer Utility

### Overview

The `DataTransformer` utility class extracts and centralizes all data transformation logic from `BaseRepository`, making it reusable across complex queries and custom operations. This is particularly useful for JOIN queries and custom data transformations that don't fit the standard repository schema.

### Key Features

- ✅ **Reusable Logic**: Extract transformation logic from repositories
- ✅ **Custom Mappings**: Handle complex JOIN queries with field mappings
- ✅ **Transform Functions**: Custom transformation logic for specific fields
- ✅ **Type Safety**: Full TypeScript support with generic types
- ✅ **Performance**: Consistent transformation logic across the application

### Basic Usage

#### 1. Schema-Based Transformation

```typescript
import { DataTransformer } from '@/utils/data-transformer';

// Use existing repository schema
const transformedUser = DataTransformer.transformRow(dbRow, userSchema);
const dbData = DataTransformer.transformInputData(userData, userSchema);
```

#### 2. Custom Field Mappings (Complex Queries)

```typescript
// For JOIN queries or custom column names using RepositorySchema with transforms
const postSchema: RepositorySchema<Post> = {
  id: { column: 'post_id', type: 'integer' },
  title: { column: 'post_title', type: 'string' },
  published: { column: 'post_published', type: 'boolean' },
  createdAt: { column: 'post_created_at', type: 'date' },
};

const authorSchema: RepositorySchema<User> = {
  id: { column: 'author_id', type: 'integer' },
  name: { column: 'author_name', type: 'string' },
  email: { column: 'author_email', type: 'string' },
  password: { transform: () => '' }, // Hide sensitive data using transform function
};

// Transform raw query results
const rawResult = await db.query(`
  SELECT 
    p.id as post_id, p.title as post_title, p.published as post_published,
    u.id as author_id, u.name as author_name, u.email as author_email
  FROM posts p 
  JOIN users u ON p.author_id = u.id
`);

const transformedData = rawResult.rows.map(row => {
  const post = DataTransformer.transformRow<Post>(row, postSchema);
  const author = DataTransformer.transformRow<User>(row, authorSchema);
  return { ...post, author };
});
```

#### 3. Custom Transform Functions

```typescript
const customSchema: RepositorySchema<CustomUser> = {
  id: { column: 'user_id', type: 'integer' },
  displayName: {
    column: 'first_name',
    transform: (value: string) => (value ? value.toUpperCase() : 'UNKNOWN'),
  },
  isVip: {
    column: 'subscription_level',
    transform: (level: string) => level === 'premium' || level === 'enterprise',
  },
  fullName: {
    transform: () => 'Custom Value', // Custom logic without column mapping
  },
};

const result = DataTransformer.transformRow<CustomUser>(row, customSchema);
```

### Real-World Example: PostRepository

Here's how `PostRepository.findFullPosts()` uses DataTransformer:

```typescript
async findFullPosts(filters = {}, options?): Promise<PaginatedResult<FullPost>> {
  // Execute complex JOIN query
  const sql = `
    SELECT
      p.id as post_id, p.title, p.content, p.published,
      p.created_at as post_created_at,
      u.id as author_id, u.name as author_name, u.email as author_email,
      u.created_at as author_created_at
    FROM posts p
    JOIN users u ON p.author_id = u.id
  `;

  const result = await this.db.query(sql, params);

  // Define field schemas
  const postSchema: RepositorySchema<Post> = {
    id: { column: 'post_id', type: 'integer' },
    title: { column: 'title', type: 'string' },
    content: { column: 'content', type: 'text' },
    published: { column: 'published', type: 'boolean' },
    createdAt: { column: 'post_created_at', type: 'date' },
  };

  const authorSchema: RepositorySchema<User> = {
    id: { column: 'author_id', type: 'integer' },
    name: { column: 'author_name', type: 'string' },
    email: { column: 'author_email', type: 'string' },
    createdAt: { column: 'author_created_at', type: 'date' },
    password: { transform: () => '' }, // Hide password
  };

  // Transform results using DataTransformer
  const transformedData = result.rows.map(row => {
    const post = DataTransformer.transformRow<Post>(row, postSchema);
    const author = DataTransformer.transformRow<User>(row, authorSchema);
    return { ...post, author } as FullPost;
  });

  return { data: transformedData, meta: paginationMeta };
}
```

### Migration from Manual Transformation

#### Before (Manual Transformation)

```typescript
// ❌ Manual, error-prone transformation
const transformedData = result.rows.map(row => ({
  id: row.post_id,
  title: row.title,
  published: Boolean(row.published), // Manual type conversion
  createdAt: new Date(row.post_created_at), // Manual date conversion
  author: {
    id: row.author_id,
    name: row.author_name,
    email: row.author_email,
    password: '', // Manual hiding
  },
}));
```

#### After (Using DataTransformer)

```typescript
// ✅ Clean, reusable, type-safe transformation
const post = DataTransformer.transformRow<Post>(row, postSchema);
const author = DataTransformer.transformRow<User>(row, authorSchema);
return { ...post, author } as FullPost;
```

### Best Practices

#### ✅ Good Practices

```typescript
// 1. Define reusable schemas
const commonUserSchema: RepositorySchema<User> = {
  id: { column: 'user_id', type: 'integer' },
  email: { column: 'email', type: 'string' },
  createdAt: { column: 'created_at', type: 'date' },
};

// 2. Use transform functions for sensitive data
password: { transform: () => '' },
apiKey: { transform: () => '[HIDDEN]' },

// 3. Combine with type safety
const user = DataTransformer.transformRow<User>(row, userSchema);

// 4. Reuse existing repository schemas when possible
DataTransformer.transformRow(row, this.schema);

// 5. Handle computed fields with transforms
fullName: {
  transform: (value, row) => `${row.first_name} ${row.last_name}`
},
```

#### ❌ Avoid These Patterns

```typescript
// Don't create schemas for every field if you can use existing repository schema
// Use DataTransformer.transformRow(row, this.schema) when possible

// Don't use manual type conversion when DataTransformer handles it
published: Boolean(row.published), // Use type: 'boolean' in schema instead

// Don't repeat schema definitions - create reusable constants
// Define postSchema, authorSchema as constants and reuse them
```

### Available Methods

```typescript
// Primary transformation methods
DataTransformer.transformRow<T>(row: any, schema: RepositorySchema<T>): T
DataTransformer.transformInputData<T>(data: any, schema: RepositorySchema<T>): any

// Utility methods for schema introspection
DataTransformer.getFieldConfig<T>(schema: RepositorySchema<T>, fieldKey: keyof T): FieldConfig
DataTransformer.getColumnName<T>(schema: RepositorySchema<T>, fieldKey: string): string
DataTransformer.getFieldName<T>(schema: RepositorySchema<T>, columnName: string): string

// Type-specific transformations (internal use)
DataTransformer.transformFieldValue(value: any, fieldConfig: FieldConfig, fieldKey: string): any
DataTransformer.transformInputFieldValue(value: any, fieldConfig: FieldConfig, fieldKey: string): any
```

### Key Benefits

- ✅ **Unified API**: Single `transformRow` method for all transformation needs
- ✅ **Type Safety**: Full TypeScript support with generic types
- ✅ **Transform Functions**: Custom logic with access to raw row data
- ✅ **Reusable Schemas**: Standard `RepositorySchema` interface for consistency
- ✅ **Performance**: Optimized transformation logic across the application

---

Happy secure coding! 🎉🔒

For questions or security concerns, please refer to the project documentation or contact the development team.
