# Node.js Backend Onboarding Guide

Welcome to the Node.js Backend project! This guide will help you understand the project structure, conventions, and how to add new features.

## 🏗️ Project Architecture

This project follows a **layered architecture** with **centralized dependency injection**:

```
Application Bootstrap
    ↓
ContainerSetup (Dependency Registration)
    ↓
Controllers → Services → Unit of Work → Repositories → Database
```

### Dependency Flow:
1. **Application** initializes database and middleware
2. **ContainerSetup** registers all services and dependencies
3. **Container** manages service instantiation and injection
4. **Routes** are initialized with injected controllers

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
├── middleware/         # Express middleware (auth, validation, etc.)
├── types/              # TypeScript type definitions
│   ├── role.enum.ts    # 🎭 Role enum and type definitions
│   ├── common.ts       # Common interfaces and types
│   └── database.ts     # Database-related types
├── utils/              # Utility functions (logger, response, hash)
├── modules/            # 📦 Feature modules
│   ├── auth/           # Authentication module
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.routes.ts
│   │   └── auth.registry.ts # 🆕 Module self-registration
│   └── user/           # User management module
│       ├── user.controller.ts
│       ├── user.service.ts
│       ├── user.repository.ts
│       ├── user.routes.ts
│       ├── user.dto.ts
│       └── user.registry.ts # 🆕 Module self-registration
└── models/             # Data models and interfaces

tests/
├── unit/               # Unit tests
├── integration/        # Integration tests
└── e2e/                # End-to-end tests

docs/
├── ONBOARDING.md           # 📖 This guide
├── DATABASE_MIGRATION_GUIDE.md # Database management
└── ENVIRONMENT_SETUP.md    # Environment configuration
```

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
// src/app.ts - Clean application setup
export class Application {
  async initialize(): Promise<void> {
    await this.setupDatabase();           // 1. Setup database
    this.setupMiddleware();               // 2. Setup Express middleware
    await this.containerSetup.setupDependencies(); // 3. Register all services
    this.setupRoutes();                   // 4. Mount routes
    this.setupErrorHandling();            // 5. Setup error handling
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
    // 🎯 New modules: just add one line!
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

## 🆕 Adding a New Feature Module

Follow these steps to add a new feature (e.g., "Posts"):

### 1. Create the Module Structure

```bash
mkdir src/modules/post
touch src/modules/post/post.dto.ts
touch src/modules/post/post.repository.ts
touch src/modules/post/post.service.ts
touch src/modules/post/post.controller.ts
touch src/modules/post/post.routes.ts
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

### 3. Create DTOs with Validation

```typescript
// src/modules/post/post.dto.ts
import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreatePostDto {
  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsNotEmpty()
  @IsString()
  content!: string;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}
```

### 4. Create Repository

```typescript
// src/modules/post/post.repository.ts
import { BaseRepository } from '@/core/base.repository';
import { Post } from '@/models/post.model';
import { Service } from '@/core/container';

@Service('PostRepository')
export class PostRepository extends BaseRepository<Post> {
  protected readonly tableName = 'posts';

  async findByAuthor(authorId: number): Promise<Post[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE authorId = ${this.createPlaceholder(0)}`;
    const result = await this.executeQuery<Post>(sql, [authorId]);
    return result.rows.map(row => this.transformDates(row));
  }

  async findPublished(): Promise<Post[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE published = true`;
    const result = await this.executeQuery<Post>(sql);
    return result.rows.map(row => this.transformDates(row));
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

### 7. Create Routes

```typescript
// src/modules/post/post.routes.ts
import { Router } from 'express';
import { PostController } from '@/modules/post/post.controller';
import { ValidateBody, ValidateParams, ValidateQuery } from '@/middleware/validation.middleware';
import { AuthGuard, authorize } from '@/middleware/auth.middleware';
import { CreatePostDto, UpdatePostDto } from '@/modules/post/post.dto';
import { IdParamDto, PaginationDto } from '@/types/common.dto';
import { Role } from '@/types/role.enum';

export function createPostRoutes(postController: PostController): Router {
  const router = Router();

  // All routes require authentication
  router.use(AuthGuard);

  router.get(
    '/',
    ValidateQuery(PaginationDto),
    postController.getPosts.bind(postController)
  );

  router.post(
    '/',
    ValidateBody(CreatePostDto),
    postController.createPost.bind(postController)
  );

  router.delete(
    '/:id',
    authorize([Role.ADMIN]), // Only admins can delete
    ValidateParams(IdParamDto),
    postController.deletePost.bind(postController)
  );

  return router;
}
```

### 8. Create Module Registry (🆕 Key Step!)

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

### 9. Add to Container Setup (Only 1 line!)

```typescript
// src/core/container-setup.ts - Just add ONE line!
private async loadModules(): Promise<void> {
  await import('@/core/core.registry');
  await import('@/modules/user/user.registry');
  await import('@/modules/auth/auth.registry');
  await import('@/modules/post/post.registry'); // ✅ Just add this line!
}
```

### 10. Register Routes

```typescript
// src/core/index.ts - Add to initializeRoutes function
export function initializeRoutes(): void {
  try {
    const authController = container.get<AuthController>('AuthController');
    const userController = container.get<UserController>('UserController');
    const postController = container.get<PostController>('PostController'); // Add this

    router.use('/auth', createAuthRoutes(authController));
    router.use('/users', createUserRoutes(userController));
    router.use('/posts', createPostRoutes(postController)); // Add this line
  } catch (error) {
    logger.error('❌ Failed to initialize routes:', error);
  }
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

## 🛡️ Authentication & Authorization

### Using Guards

```typescript
// Import required modules
import { AuthGuard, authorize } from '@/middleware/auth.middleware';
import { Role } from '@/types/role.enum';

// In route definitions
router.use(AuthGuard);                    // Require authentication
router.use(authorize([Role.ADMIN]));      // Require admin role
router.delete('/:id', authorize([Role.ADMIN])); // Admin-only endpoint

// Multiple roles
router.get('/dashboard', authorize([Role.ADMIN, Role.USER])); // Admin or User access
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
  // ...
}
```

## 📝 Validation

Use class-validator decorators with enum validation:

```typescript
import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { Role, getRoleValues } from '@/types/role.enum';

export class CreateUserDto {
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsEnum(Role, { 
    message: `Role must be one of: ${getRoleValues().join(', ')}` 
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

### Logging

Use the configured logger:

```typescript
import { logger } from '@/utils/logger';

logger.info('Operation completed', { userId, postId });
logger.error('Failed to create post:', error);
logger.debug('Debug information', { data });
```

## 🔒 Security Best Practices

1. **Always validate input** using DTOs and class-validator
2. **Use parameterized queries** (automatically handled by repositories)  
3. **Hash sensitive data** using appropriate utilities
4. **Implement proper authentication** with JWT tokens
5. **Use role-based authorization** with enum-based guards for type safety
6. **Validate roles** using `Role` enum and `isValidRole()` helper function
7. **Use proper environment configuration** (see `docs/ENVIRONMENT_SETUP.md`)

### Role Security Guidelines

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
if (user.role === 'admin') { // No type safety
  // Admin logic
}
```

## 📊 Environment Configuration

- **Development**: SQLite, debug logging, auto-migrations
- **Test**: SQLite, error-only logging, auto-migrations
- **Production**: PostgreSQL, warn logging, manual migrations

See `docs/ENVIRONMENT_SETUP.md` for complete configuration guide.

## 🚦 API Conventions

### Endpoints
- Use RESTful conventions
- Prefix with `/api/v1`
- Use plural nouns for resources (`/users`, `/posts`)

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
```

## 🐛 Debugging

### Local Development
1. Use `npm run dev` for hot reloading
2. Check logs in console
3. Use debugging tools in your IDE
4. Set breakpoints in TypeScript files

### Container Issues
```typescript
// Debug container services
const container = Container.getInstance();
console.log('Registered services:', container.getRegisteredServices());

// Check if service is registered
const isRegistered = container.has('PostService');
console.log('PostService registered:', isRegistered);
```

### Database Debugging
```bash
# SQLite
sqlite3 database.sqlite
.tables
SELECT * FROM posts;

# PostgreSQL
psql -h localhost -U username -d database
\dt
SELECT * FROM posts;
```

## 📚 Additional Resources

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [TypeScript Enums](https://www.typescriptlang.org/docs/handbook/enums.html)
- [Express.js Guide](https://expressjs.com/en/guide/)
- [Class Validator Documentation](https://github.com/typestack/class-validator)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)

## 📖 Project Documentation

- **Environment Setup**: `docs/ENVIRONMENT_SETUP.md`
- **Database Management**: `docs/DATABASE_MIGRATION_GUIDE.md`
- **This Guide**: `docs/ONBOARDING.md`

---

Happy coding! 🎉

For questions or issues, please refer to the project documentation or contact the development team. 