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
│   └── index.ts        # Route initialization
├── database/           # Database connection and migrations
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
│   │   └── auth.routes.ts
│   └── user/           # User management module
│       ├── user.controller.ts
│       ├── user.service.ts
│       ├── user.repository.ts
│       ├── user.routes.ts
│       └── user.dto.ts
└── models/             # Data models and interfaces

tests/
├── unit/               # Unit tests
├── integration/        # Integration tests
└── e2e/                # End-to-end tests
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

Copy the environment template:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
- Database settings
- JWT secrets
- Other environment-specific values

### 3. Database Setup

The application will automatically create the SQLite database and run migrations on startup.

For production, configure MySQL in your environment variables.

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

📚 **Detailed Guide**: See `docs/MODULE_REGISTRY_GUIDE.md`

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
import { IsNotEmpty, IsString, IsInt, IsOptional, IsBoolean } from 'class-validator';

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
    const sql = `SELECT * FROM ${this.tableName} WHERE authorId = ?`;
    const result = await this.executeQuery<Post>(sql, [authorId]);
    return result.rows.map(row => this.transformDates(row));
  }

  async findPublished(): Promise<Post[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE published = true`;
    const result = await this.executeQuery<Post>(sql);
    return result.rows.map(row => this.transformDates(row));
  }

  async findByStatus(published: boolean): Promise<Post[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE published = ?`;
    const result = await this.executeQuery<Post>(sql, [published]);
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
import { ValidationError, NotFoundError } from '@/middleware/error-handler';
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

  async findById(id: number): Promise<PostResponse | null> {
    const post = await this.postRepository.findById(id);
    return post ? this.toPostResponse(post) : null;
  }

  async update(id: number, updateData: Partial<CreatePostRequest>): Promise<PostResponse | null> {
    return this.unitOfWork.executeInTransaction(async () => {
      const post = await this.postRepository.update(id, updateData);
      return post ? this.toPostResponse(post) : null;
    });
  }

  async delete(id: number): Promise<boolean> {
    return this.unitOfWork.executeInTransaction(async () => {
      return this.postRepository.delete(id);
    });
  }

  async findByAuthor(authorId: number): Promise<PostResponse[]> {
    const posts = await this.postRepository.findByAuthor(authorId);
    return posts.map(post => this.toPostResponse(post));
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

  async getPostById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const post = await this.postService.findById(Number(id));

      if (!post) {
        ResponseUtil.notFound(res, 'Post not found');
        return;
      }

      ResponseUtil.success(res, { post }, 'Post retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async updatePost(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const post = await this.postService.update(Number(id), req.body);

      if (!post) {
        ResponseUtil.notFound(res, 'Post not found');
        return;
      }

      ResponseUtil.success(res, { post }, 'Post updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deletePost(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await this.postService.delete(Number(id));

      if (!deleted) {
        ResponseUtil.notFound(res, 'Post not found');
        return;
      }

      ResponseUtil.success(res, null, 'Post deleted successfully');
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

  router.get(
    '/:id',
    ValidateParams(IdParamDto),
    postController.getPostById.bind(postController)
  );

  router.post(
    '/',
    ValidateBody(CreatePostDto),
    postController.createPost.bind(postController)
  );

  router.put(
    '/:id',
    ValidateParams(IdParamDto),
    ValidateBody(UpdatePostDto),
    postController.updatePost.bind(postController)
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

### 8. Create Module Registry

```typescript
// src/modules/post/post.registry.ts - Create this new file
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

### 9. Add to Container Setup

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

### 11. Database Migration

```typescript
// src/database/connection.ts - Add to runMigrations method
private async runMigrations(): Promise<void> {
  // ... existing migrations ...

  // Add posts table
  const createPostsTable = `
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY ${this.dbType === 'mysql' ? 'AUTO_INCREMENT' : 'AUTOINCREMENT'},
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      authorId INTEGER NOT NULL,
      published BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (authorId) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  await this.execute(createPostsTable);
}
```

## 🧪 Testing Strategy

### Unit Tests

Test services in isolation with mocked dependencies:

```typescript
// tests/unit/modules/post/post.service.test.ts
import { PostService } from '@/modules/post/post.service';
import { PostRepository } from '@/modules/post/post.repository';
import { UnitOfWork } from '@/core/unit-of-work';

jest.mock('@/modules/post/post.repository');
jest.mock('@/core/unit-of-work');

describe('PostService', () => {
  let postService: PostService;
  let mockPostRepository: jest.Mocked<PostRepository>;
  let mockUnitOfWork: jest.Mocked<UnitOfWork>;

  beforeEach(() => {
    mockPostRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByAuthor: jest.fn(),
    } as any;

    mockUnitOfWork = {
      executeInTransaction: jest.fn().mockImplementation(callback => callback()),
    } as any;

    postService = new PostService(mockPostRepository, mockUnitOfWork);
  });

  it('should create a post successfully', async () => {
    // Arrange
    const postData = { title: 'Test Post', content: 'Test Content', authorId: 1 };
    const createdPost = { id: 1, ...postData, published: false, createdAt: new Date(), updatedAt: new Date() };
    
    mockPostRepository.create.mockResolvedValue(createdPost);

    // Act
    const result = await postService.create(postData);

    // Assert
    expect(mockPostRepository.create).toHaveBeenCalledWith({
      ...postData,
      published: false,
    });
    expect(result.title).toBe(postData.title);
  });
});
```

### Integration Tests

Test repository interactions with the database:

```typescript
// tests/integration/modules/post/post.repository.test.ts
import { PostRepository } from '@/modules/post/post.repository';
import { DatabaseConnection } from '@/database/connection';

describe('PostRepository Integration', () => {
  let postRepository: PostRepository;
  let dbConnection: DatabaseConnection;

  beforeAll(async () => {
    dbConnection = DatabaseConnection.getInstance();
    await dbConnection.initialize();
    postRepository = new PostRepository();
  });

  beforeEach(async () => {
    await dbConnection.execute('DELETE FROM posts');
  });

  afterAll(async () => {
    await dbConnection.close();
  });

  it('should create and retrieve posts', async () => {
    // Arrange
    const postData = { title: 'Integration Test', content: 'Test Content', authorId: 1, published: true };

    // Act
    const createdPost = await postRepository.create(postData);
    const foundPost = await postRepository.findById(createdPost.id);

    // Assert
    expect(foundPost).toBeTruthy();
    expect(foundPost?.title).toBe(postData.title);
    expect(foundPost?.published).toBe(true);
  });
});
```

### E2E Tests

Test complete API workflows:

```typescript
// tests/e2e/posts.e2e.test.ts
import request from 'supertest';
import { Application } from '@/app';
import { DatabaseConnection } from '@/database/connection';

describe('Posts E2E Tests', () => {
  let app: Application;
  let accessToken: string;

  beforeAll(async () => {
    app = new Application();
    await app.initialize();
    
    // Login to get access token
    const loginResponse = await request(app.getApp())
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });
    
    accessToken = loginResponse.body.data.tokens.accessToken;
  });

  it('should create a post successfully', async () => {
    const response = await request(app.getApp())
      .post('/api/v1/posts')
      .set('Cookie', `accessToken=${accessToken}`)
      .send({ title: 'E2E Test Post', content: 'Test Content' })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.title).toBe('E2E Test Post');
  });
});
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
import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsBoolean, IsEnum, IsString, Length } from 'class-validator';
import { Role, getRoleValues } from '@/types/role.enum';

export class CreatePostDto {
  @IsNotEmpty()
  @IsString()
  @Length(5, 255)
  title!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  content!: string;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

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
ResponseUtil.unauthorized(res);
ResponseUtil.forbidden(res, 'Access denied');
```

### Logging

Use the configured logger:

```typescript
import { logger } from '@/utils/logger';

logger.info('Operation completed', { userId, postId });
logger.error('Failed to create post:', error);
logger.debug('Debug information', { data });
logger.warn('Warning message');
```

### Container Access

Access services from the container when needed:

```typescript
import { Container } from '@/core/container';

const container = Container.getInstance();
const postService = container.get<PostService>('PostService');
```

## 🔒 Security Best Practices

1. **Always validate input** using DTOs and class-validator
2. **Use parameterized queries** (automatically handled by repositories)  
3. **Hash sensitive data** using appropriate utilities
4. **Implement proper authentication** with JWT tokens
5. **Use role-based authorization** with enum-based guards for type safety
6. **Validate roles** using `Role` enum and `isValidRole()` helper function
7. **Sanitize data** before database operations
8. **Use HTTPS in production**
9. **Keep dependencies updated**
10. **Log security events** appropriately

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

// ✅ Good: Enum-based authorization
router.delete('/:id', authorize([Role.ADMIN]));

// ❌ Bad: String-based authorization  
router.delete('/:id', authorize(['admin'])); // No compile-time checking
```

## 📊 Environment Configuration

### Development
- Uses SQLite database
- Detailed logging (debug level)
- CORS enabled for all origins
- Hot reloading with nodemon
- Path aliases via tsconfig-paths

### Production
- Uses MySQL database
- Error-only logging
- Restricted CORS
- Security headers enabled
- Optimized builds with tsc-alias

## 🚦 API Conventions

### Endpoints
- Use RESTful conventions
- Prefix with `/api/v1`
- Use plural nouns for resources (`/users`, `/posts`)
- Use kebab-case for multi-word resources

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

### Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request / Validation Error
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

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
```

### Testing Database Queries
```typescript
// Add debug logging to repositories
async findByAuthor(authorId: number): Promise<Post[]> {
  const sql = `SELECT * FROM ${this.tableName} WHERE authorId = ?`;
  console.log('SQL:', sql, 'Params:', [authorId]); // Debug
  const result = await this.executeQuery<Post>(sql, [authorId]);
  return result.rows.map(row => this.transformDates(row));
}
```

### Role-Related Debugging

```typescript
import { Role, isValidRole, getRoleValues } from '@/types/role.enum';

// Debug role validation
console.log('Available roles:', getRoleValues());
console.log('Is valid role:', isValidRole('admin')); // true
console.log('Is valid role:', isValidRole('invalid')); // false

// Debug user role in controllers
async someController(req: AuthenticatedRequest, res: Response): Promise<void> {
  console.log('User role:', req.user?.role);
  console.log('Is admin:', req.user?.role === Role.ADMIN);
  console.log('Role type:', typeof req.user?.role);
}

// Debug enum compilation
console.log('Role enum values:', Object.values(Role));
console.log('Role.ADMIN value:', Role.ADMIN); // 'admin'
console.log('Role.USER value:', Role.USER);   // 'user'
```

## 📚 Additional Resources

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [TypeScript Enums](https://www.typescriptlang.org/docs/handbook/enums.html) - Learn more about enum usage and best practices
- [Express.js Guide](https://expressjs.com/en/guide/)
- [Class Validator Documentation](https://github.com/typestack/class-validator)
- [Class Validator Enum Validation](https://github.com/typestack/class-validator#validation-decorators) - Using @IsEnum decorator
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)
- [Supertest for API Testing](https://github.com/ladjs/supertest)

---

Happy coding! 🎉

For questions or issues, please refer to the project documentation or contact the development team. 