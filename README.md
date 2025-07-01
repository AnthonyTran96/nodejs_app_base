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
✅ **Database Integration** (SQLite for dev, MySQL for production)  
✅ **Repository Pattern** for data access  
✅ **Unit of Work** pattern for transactions  
✅ **Comprehensive Testing** (Unit, Integration, E2E)  
✅ **Code Quality** (ESLint + Prettier)  
✅ **Logging** with Winston  
✅ **Environment Configuration**  

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
├── middleware/         # Express middleware
├── types/              # TypeScript type definitions
│   ├── role.enum.ts    # 🎭 Role enum & type definitions
│   ├── common.ts       # Common interfaces and types
│   └── database.ts     # Database-related types
├── utils/              # Utility functions
├── modules/            # 📦 Feature modules (self-registering)
│   ├── auth/           # Authentication module
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.routes.ts
│   │   └── auth.registry.ts # 🔧 Auth module registration
│   └── user/           # User management module
│       ├── user.controller.ts
│       ├── user.service.ts
│       ├── user.repository.ts
│       ├── user.routes.ts
│       ├── user.dto.ts
│       └── user.registry.ts # 🔧 User module registration
├── models/             # Data models and interfaces
└── app.ts              # Application setup (clean & focused)

tests/
├── unit/               # Unit tests
├── integration/        # Integration tests
└── e2e/                # End-to-end tests
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
  register: async (container) => {
    // Import and register module services
    const { PostService } = await import('./post.service');
    container.register('PostService', PostService);
  },
});

// 2. Add ONE line to container-setup.ts:
await import('@/modules/post/post.registry');
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

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Copy the environment template:
```bash
cp .env.example .env
```

The project comes with development-ready environment variables.

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

### Database
The project uses SQLite for development and supports MySQL for production. The database is automatically initialized with the required tables on startup.

## 🛡️ Security Features

- **JWT Authentication** with refresh tokens
- **Password hashing** with bcrypt
- **Input validation** with class-validator
- **SQL injection protection** with parameterized queries
- **Security headers** with Helmet.js
- **CORS configuration**
- **Request logging**

## 📖 Documentation

See [ONBOARDING.md](./ONBOARDING.md) for detailed documentation on:
- Adding new features and modules
- Dependency injection setup
- Database migrations
- Testing strategies
- Authentication & authorization
- API conventions
- Debugging tips

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

### Validation
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
    message: `Role must be one of: ${getRoleValues().join(', ')}` 
  })
  role?: Role = Role.USER; // Type-safe default
}
```

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
    await this.setupDatabase();           // ✅ Database connection
    this.setupMiddleware();               // ✅ Express middleware
    await this.containerSetup.setupDependencies(); // ✅ Module registry + DI
    this.setupRoutes();                   // ✅ Routes initialization
    this.setupErrorHandling();            // ✅ Error handling
  }

  private setupRoutes(): void {
    try {
      initializeRoutes();
      this.app.use(config.apiPrefix, router);
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
- **Database**: SQLite (dev) / MySQL (prod)
- **Authentication**: JWT
- **Validation**: class-validator
- **Testing**: Jest + Supertest
- **Code Quality**: ESLint + Prettier
- **Logging**: Winston
- **Build Tools**: tsc-alias for path resolution

## 📈 Project Status

✅ **Build**: Compiles successfully  
✅ **Server**: Runs on port 3000  
✅ **Database**: SQLite initialized  
✅ **API**: Health endpoint working  
✅ **Tests**: All tests passing  
✅ **Architecture**: Clean layered structure with Module Registry  
✅ **Module Registry**: Zero-conflict module registration  
✅ **Role System**: Type-safe enum-based roles  
✅ **Path Aliases**: Configured for clean imports  
✅ **Documentation**: Comprehensive guides available  
✅ **Logging**: Route initialization tracking  

## 🤝 Contributing

1. Follow the established architecture patterns
2. **Use Module Registry Pattern** for new modules (see template)
3. **Use Role enum** for type-safe role management
4. Add tests for new features
5. Update documentation as needed
6. Follow the code style (run `npm run format`)
7. Ensure all checks pass (`npm run check`)

### 🚀 **Adding New Modules:**
```bash
# 1. Copy template
cp src/core/template.registry.ts.example src/modules/your-module/your-module.registry.ts

# 2. Edit template
# 3. Add 1 line to container-setup.ts
# 4. Zero conflicts! ✨
```

## 📚 Documentation

- **[ONBOARDING.md](docs/ONBOARDING.md)** - Complete development guide
- **[MODULE_REGISTRY_GUIDE.md](docs/MODULE_REGISTRY_GUIDE.md)** - Module registry system
- **[README.md](docs/README.md)** - Module registry quick reference

## 📝 License

MIT License - see LICENSE file for details.

---

**Ready for conflict-free development!** 🎉

Multiple developers can now work in parallel without merge conflicts using the **Module Registry Pattern**. 