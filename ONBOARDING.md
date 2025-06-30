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
├── controllers/         # HTTP request handlers
├── core/               # Core infrastructure (DI, UoW)
├── database/           # Database connection and migrations
├── dtos/               # Data Transfer Objects with validation
├── middleware/         # Express middleware (auth, validation, etc.)
├── models/             # Data models and interfaces
├── repositories/       # Data access layer
├── routes/             # Route definitions
├── services/           # Business logic layer
├── types/              # TypeScript type definitions
└── utils/              # Utility functions

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
```

#### 2. Create DTOs with Validation
```typescript
// src/dtos/post.dto.ts
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
```

#### 3. Create Repository
```typescript
// src/repositories/post.repository.ts
import { BaseRepository } from './base.repository';
import { Post } from '../models/post.model';
import { Service } from '../core/container';

@Service('PostRepository')
export class PostRepository extends BaseRepository<Post> {
  protected readonly tableName = 'posts';

  async findByAuthor(authorId: number): Promise<Post[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE authorId = ?`;
    const result = await this.executeQuery<Post>(sql, [authorId]);
    return result.rows;
  }
}
```

#### 4. Create Service
```typescript
// src/services/post.service.ts
import { PostRepository } from '../repositories/post.repository';
import { Post, CreatePostRequest } from '../models/post.model';
import { Service } from '../core/container';

@Service('PostService')
export class PostService {
  constructor(private readonly postRepository: PostRepository) {}

  async create(postData: CreatePostRequest): Promise<Post> {
    return this.postRepository.create(postData);
  }

  async findByAuthor(authorId: number): Promise<Post[]> {
    return this.postRepository.findByAuthor(authorId);
  }
}
```

#### 5. Create Controller
```typescript
// src/controllers/post.controller.ts
import { Request, Response, NextFunction } from 'express';
import { PostService } from '../services/post.service';
import { ResponseUtil } from '../utils/response';
import { Service } from '../core/container';

@Service('PostController')
export class PostController {
  constructor(private readonly postService: PostService) {}

  async createPost(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const post = await this.postService.create(req.body);
      ResponseUtil.success(res, post, 'Post created successfully', 201);
    } catch (error) {
      next(error);
    }
  }
}
```

#### 6. Create Routes
```typescript
// src/routes/post.routes.ts
import { Router } from 'express';
import { PostController } from '../controllers/post.controller';
import { ValidateBody } from '../middleware/validation.middleware';
import { AuthGuard } from '../middleware/auth.middleware';
import { CreatePostDto } from '../dtos/post.dto';

export function createPostRoutes(postController: PostController): Router {
  const router = Router();

  router.use(AuthGuard); // Require authentication

  router.post('/', ValidateBody(CreatePostDto), postController.createPost.bind(postController));

  return router;
}
```

#### 7. Register Routes
Add to `src/routes/index.ts`:
```typescript
import { createPostRoutes } from './post.routes';

// In initializeRoutes():
const postController = container.get<PostController>('PostController');
router.use('/posts', createPostRoutes(postController));
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
# All tests
npm test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch

# E2E tests
npm run test:e2e
```

### Writing Tests

#### Unit Tests
Test individual classes in isolation:

```typescript
// tests/unit/services/post.service.test.ts
describe('PostService', () => {
  let postService: PostService;
  let postRepository: jest.Mocked<PostRepository>;

  beforeEach(() => {
    postRepository = {
      create: jest.fn(),
      findByAuthor: jest.fn(),
    } as any;
    postService = new PostService(postRepository);
  });

  it('should create a post', async () => {
    // Test implementation
  });
});
```

#### Integration Tests
Test database interactions:

```typescript
// tests/integration/repositories/post.repository.test.ts
describe('PostRepository Integration', () => {
  let postRepository: PostRepository;

  beforeEach(async () => {
    // Clean database
    await dbConnection.execute('DELETE FROM posts');
  });

  it('should create and find posts', async () => {
    // Test implementation
  });
});
```

#### E2E Tests
Test complete API flows:

```typescript
// tests/e2e/posts.e2e.test.ts
describe('Posts API', () => {
  it('should create a post via API', async () => {
    const response = await request(app.getApp())
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test Post', content: 'Content' })
      .expect(201);
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

// Optional authentication
router.use(OptionalAuthGuard);
```

### Accessing User in Controllers

```typescript
async getUserPosts(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.userId; // Available after AuthGuard
  // ...
}
```

## 📝 Validation

Use class-validator decorators in DTOs:

```typescript
export class CreateUserDto {
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email!: string;

  @IsNotEmpty()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsIn(['user', 'admin'])
  role?: string;
}
```

## 🔧 Utilities

### Response Formatting

Always use `ResponseUtil` for consistent responses:

```typescript
// Success
ResponseUtil.success(res, data, 'Success message');

// Success with pagination
ResponseUtil.successWithPagination(res, paginatedResult);

// Error responses
ResponseUtil.error(res, 'Error message', 400);
ResponseUtil.notFound(res, 'Resource not found');
ResponseUtil.unauthorized(res);
```

### Logging

Use the configured logger:

```typescript
import { logger } from '../utils/logger';

logger.info('Info message');
logger.error('Error message', error);
logger.debug('Debug message');
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
const service = container.get<MyService>('ServiceName');
```

## 🔒 Security Best Practices

1. **Always validate input** using DTOs
2. **Use parameterized queries** (automatically handled by repositories)
3. **Hash passwords** using `HashUtil.hash()`
4. **Implement proper authentication** with JWT
5. **Use HTTPS in production**
6. **Keep dependencies updated**

## 📊 Environment Configuration

### Development
- Uses SQLite database
- Detailed logging
- CORS enabled for all origins

### Production
- Uses MySQL database
- Error-only logging
- Restricted CORS
- Security headers enabled

## 🚦 API Conventions

### Endpoints
- Use RESTful conventions
- Prefix with `/api/v1`
- Use plural nouns for resources

### Response Format
All responses follow this structure:

```typescript
{
  "success": boolean,
  "data"?: any,
  "message"?: string,
  "errors"?: Record<string, string[]>,
  "meta"?: {
    "page": number,
    "limit": number,
    "total": number,
    "totalPages": number
  }
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

### Testing Database Queries
Access the database directly:
```bash
# SQLite
sqlite3 database.sqlite
.tables
SELECT * FROM users;
```

## 📚 Additional Resources

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/)
- [Class Validator Documentation](https://github.com/typestack/class-validator)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)

---

Happy coding! 🎉

For questions or issues, please refer to the project documentation or contact the development team. 