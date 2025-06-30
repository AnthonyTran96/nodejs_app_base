# Node.js Backend Base Project

A clean, scalable, and testable Node.js backend with TypeScript, Express, and layered architecture inspired by NestJS.

## 🏗️ Architecture

This project implements a **layered architecture** with **dependency injection**:

```
Controllers → Services → Unit of Work → Repositories → Database
     ↓
Dependency Injection Container (ContainerSetup)
     ↓
Application Bootstrap
```

## 🚀 Features

✅ **TypeScript** with strict configuration  
✅ **Express.js** web framework  
✅ **Layered Architecture** (Controllers, Services, Repositories)  
✅ **Dependency Injection** with ContainerSetup  
✅ **DTO Validation** with class-validator  
✅ **Authentication** (JWT + cookies)  
✅ **Authorization** (role-based access control)  
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
│   ├── container-setup.ts # Dependency registration & setup
│   ├── base.repository.ts # Base repository pattern
│   ├── unit-of-work.ts # Transaction management
│   └── index.ts        # Route initialization
├── database/           # Database connection & migrations
├── middleware/         # Express middleware
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
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
├── models/             # Data models and interfaces
└── app.ts              # Application setup (clean & focused)

tests/
├── unit/               # Unit tests
├── integration/        # Integration tests
└── e2e/                # End-to-end tests
```

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

### Dependency Injection
Services are automatically registered via ContainerSetup:

```typescript
// src/core/container-setup.ts
export class ContainerSetup {
  async setupDependencies(): Promise<void> {
    // Import services
    // Register dependencies
    // Initialize container
    // Setup routes
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
Request validation with decorators:

```typescript
export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @MinLength(8)
  password!: string;
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
    await this.setupDatabase();
    this.setupMiddleware();
    await this.containerSetup.setupDependencies(); // Clean separation
    this.setupRoutes();
    this.setupErrorHandling();
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
✅ **Tests**: 79/79 tests passing  
✅ **Architecture**: Clean layered structure with DI  
✅ **Path Aliases**: Configured for clean imports  
✅ **Documentation**: Comprehensive guides available  
✅ **Dependency Injection**: Centralized via ContainerSetup  

## 🤝 Contributing

1. Follow the established architecture patterns
2. Use the ContainerSetup for new service registration
3. Add tests for new features
4. Update documentation as needed
5. Follow the code style (run `npm run format`)
6. Ensure all checks pass (`npm run check`)

## 📝 License

MIT License - see LICENSE file for details.

---

**Ready for development!** 🎉

For detailed setup instructions and development guidelines, see [ONBOARDING.md](./ONBOARDING.md). 