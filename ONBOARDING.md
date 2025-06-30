# Node.js Backend Onboarding Guide

Welcome to the Node.js Backend project! This guide will help you understand the project structure, conventions, and how to add new features.

## 🏗️ Project Architecture

This project follows a **layered architecture** inspired by NestJS principles:

```
Controllers
    ↓
Services (Business Logic)
    ↓
Unit of Work
    ↓
Repositories (Data Access)
    ↓
Database
```

## 📁 Folder Structure

```
src/
├── config/              # Environment configuration
├── core/               # Core infrastructure (DI, UoW, Base Repository)
├── database/           # Database connection and migrations
├── middleware/         # Express middleware (auth, validation, etc.)
├── types/              # TypeScript type definitions
├── utils/              # Utility functions (logger, response, hash)
├── modules/            # Feature modules
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

### Adding a New Feature

Follow these steps to add a new feature (e.g., "Posts"):

#### 1. Create the Model
```typescript
// src/models/post.model.ts
export interface Post {
  id: number;
  title: string;
  content: string;
  authorId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePostRequest {
  title: string;
  content: string;
  authorId: number;
}

export interface PostResponse {
  id: number;
  title: string;
  content: string;
  authorId: number;
  createdAt: string;
  updatedAt: string;
}
```

#### 2. Create DTOs with Validation
```typescript
// src/modules/post/post.dto.ts
import { IsNotEmpty, IsString, IsInt } from 'class-validator';

export class CreatePostDto {
  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsNotEmpty()
  @IsString()
  content!: string;

  @IsInt()
  authorId!: number;
}

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;
}
```

#### 3. Create Repository
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
}
```

#### 4. Create Service
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
      const post = await this.postRepository.create(postData);
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
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  }
}
```

#### 5. Create Controller
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

#### 6. Create Routes
```typescript
// src/modules/post/post.routes.ts
import { Router } from 'express';
import { PostController } from '@/modules/post/post.controller';
import { ValidateBody, ValidateQuery } from '@/middleware/validation.middleware';
import { AuthGuard } from '@/middleware/auth.middleware';
import { CreatePostDto, UpdatePostDto } from '@/modules/post/post.dto';
import { PaginationDto } from '@/types/common.dto';

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

  return router;
}
```

#### 7. Register Routes
Add to `src/core/index.ts`:
```typescript
import { createPostRoutes } from '@/modules/post/post.routes';

// In initializeRoutes():
export async function initializeRoutes(): Promise<Router> {
  const router = Router();
  const container = Container.getInstance();

  // ... existing code ...

  // Register new post routes
  const { PostController } = await import('@/modules/post/post.controller');
  const postController = container.get<PostController>('PostController');
  router.use('/posts', createPostRoutes(postController));

  return router;
}
```

### Database Migrations

When adding new tables, update `src/database/connection.ts` in the `runMigrations()` method:

```typescript
private async runMigrations(): Promise<void> {
  // Existing migrations...

  // Add new table
  const createPostsTable = `
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY ${this.dbType === 'mysql' ? 'AUTO_INCREMENT' : 'AUTOINCREMENT'},
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      authorId INTEGER NOT NULL,
      published BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (authorId) REFERENCES users(id)
    )
  `;
  await this.execute(createPostsTable);
}
```

## 🧪 Testing

### Running Tests

```bash
# Unit and integration tests only
npm test

# All tests (unit + integration + E2E)
npm run test:all

# Specific test types
npm run test:unit
npm run test:integration
npm run test:e2e

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Writing Tests

#### Unit Tests
Test individual classes in isolation:

```typescript
// tests/unit/modules/post/post.service.test.ts
import { PostService } from '@/modules/post/post.service';
import { PostRepository } from '@/modules/post/post.repository';
import { UnitOfWork } from '@/core/unit-of-work';

jest.mock('@/modules/post/post.repository');
jest.mock('@/core/unit-of-work');

describe('PostService', () => {
  let postService: PostService;
  let postRepository: jest.Mocked<PostRepository>;
  let unitOfWork: jest.Mocked<UnitOfWork>;

  beforeEach(() => {
    postRepository = {
      create: jest.fn(),
      findByAuthor: jest.fn(),
      findAll: jest.fn(),
    } as any;
    
    unitOfWork = {
      executeInTransaction: jest.fn(),
    } as any;

    postService = new PostService(postRepository, unitOfWork);
  });

  it('should create a post', async () => {
    // Arrange
    const postData = { title: 'Test', content: 'Content', authorId: 1 };
    const createdPost = { id: 1, ...postData, createdAt: new Date(), updatedAt: new Date() };
    
    unitOfWork.executeInTransaction.mockImplementation(callback => callback());
    postRepository.create.mockResolvedValue(createdPost);

    // Act
    const result = await postService.create(postData);

    // Assert
    expect(postRepository.create).toHaveBeenCalledWith(postData);
    expect(result.title).toBe(postData.title);
  });
});
```

#### Integration Tests
Test database interactions:

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
    // Clean database
    await dbConnection.execute('DELETE FROM posts');
  });

  afterAll(async () => {
    await dbConnection.close();
  });

  it('should create and find posts', async () => {
    // Arrange
    const postData = { title: 'Test Post', content: 'Test Content', authorId: 1 };

    // Act
    const createdPost = await postRepository.create(postData);
    const foundPost = await postRepository.findById(createdPost.id);

    // Assert
    expect(foundPost).toBeTruthy();
    expect(foundPost?.title).toBe(postData.title);
  });
});
```

#### E2E Tests
Test complete API flows:

```typescript
// tests/e2e/posts.e2e.test.ts
import request from 'supertest';
import { Application } from '@/app';
import { DatabaseConnection } from '@/database/connection';

describe('Posts API', () => {
  let app: Application;
  let accessToken: string;

  beforeAll(async () => {
    app = new Application();
    await app.initialize();
    
    // Login to get token
    const loginResponse = await request(app.getApp())
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });
    
    accessToken = loginResponse.body.data.tokens.accessToken;
  });

  it('should create a post via API', async () => {
    const response = await request(app.getApp())
      .post('/api/v1/posts')
      .set('Cookie', `accessToken=${accessToken}`)
      .send({ title: 'Test Post', content: 'Test Content' })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.title).toBe('Test Post');
  });
});
```

## 🛡️ Authentication & Authorization

### Using Guards

```typescript
// Require authentication
router.use(AuthGuard);

// Require specific role
router.use(RoleGuard('admin'));

// Optional authentication (if needed)
router.use(OptionalAuthGuard);
```

### Accessing User in Controllers

```typescript
async getUserPosts(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.userId; // Available after AuthGuard
  const userRole = req.user?.role;  // User role for authorization
  // ...
}
```

## 📝 Validation

Use class-validator decorators in DTOs:

```typescript
import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsIn, Transform } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email!: string;

  @IsNotEmpty()
  @MinLength(8)
  password!: string;

  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsOptional()
  @IsIn(['user', 'admin'])
  role?: string;
}
```

## 🔧 Utilities

### Response Formatting

Always use `ResponseUtil` for consistent responses:

```typescript
import { ResponseUtil } from '@/utils/response';

// Success
ResponseUtil.success(res, data, 'Success message');

// Success with pagination
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

logger.info('Info message', { additionalData });
logger.error('Error message', error);
logger.debug('Debug message');
logger.warn('Warning message');
```

### Dependency Injection

Register services with the `@Service` decorator:

```typescript
@Service('ServiceName')
export class MyService {
  constructor(private readonly dependency: SomeDependency) {}
}
```

Access from container:
```typescript
import { Container } from '@/core/container';

const container = Container.getInstance();
const service = container.get<MyService>('ServiceName');
```

## 🔒 Security Best Practices

1. **Always validate input** using DTOs and class-validator
2. **Use parameterized queries** (automatically handled by repositories)
3. **Hash passwords** using `HashUtil.hash()`
4. **Implement proper authentication** with JWT tokens
5. **Use role-based authorization** with `RoleGuard`
6. **Sanitize data** before database operations
7. **Use HTTPS in production**
8. **Keep dependencies updated**

## 📊 Environment Configuration

### Development
- Uses SQLite database
- Detailed logging (debug level)
- CORS enabled for all origins
- Hot reloading with nodemon

### Production
- Uses MySQL database
- Error-only logging
- Restricted CORS
- Security headers enabled
- Optimized for performance

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

### Database Debugging
Access the database directly:
```bash
# SQLite
sqlite3 database.sqlite
.tables
SELECT * FROM users;
```

### Testing Database Queries
```typescript
// Add debug logging to repositories
async findByEmail(email: string): Promise<User | null> {
  const sql = `SELECT * FROM ${this.tableName} WHERE email = ? LIMIT 1`;
  console.log('SQL:', sql, 'Params:', [email]); // Debug
  const result = await this.executeQuery<User>(sql, [email]);
  return result.rows[0] ? this.transformDates(result.rows[0]) : null;
}
```

## 📚 Additional Resources

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/)
- [Class Validator Documentation](https://github.com/typestack/class-validator)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)
- [Supertest for API Testing](https://github.com/ladjs/supertest)

---

Happy coding! 🎉

For questions or issues, please refer to the project documentation or contact the development team. 