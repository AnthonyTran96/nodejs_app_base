# Node.js Backend Base Project

A clean, scalable, and testable Node.js backend with TypeScript, Express, and layered architecture inspired by NestJS.

## 🏗️ Architecture

This project implements a **layered architecture**:

```
Controllers → Services → Unit of Work → Repositories → Database
```

## 🚀 Features

✅ **TypeScript** with strict configuration  
✅ **Express.js** web framework  
✅ **Layered Architecture** (Controllers, Services, Repositories)  
✅ **Dependency Injection** container  
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
├── controllers/         # HTTP request handlers
├── core/               # Dependency injection & Unit of Work
├── database/           # Database connection & migrations
├── dtos/               # Data Transfer Objects with validation
├── middleware/         # Express middleware
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
POST /api/v1/auth/login       # Login
POST /api/v1/auth/refresh     # Refresh token
POST /api/v1/auth/logout      # Logout
GET  /api/v1/auth/me          # Get current user
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

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e
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
- Adding new features
- Database migrations
- Testing strategies
- Authentication & authorization
- API conventions
- Debugging tips

## 🌟 Key Components

### Dependency Injection
Services are automatically registered and injected:

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

## 📈 Project Status

✅ **Build**: Compiles successfully  
✅ **Server**: Runs on port 3000  
✅ **Database**: SQLite initialized  
✅ **API**: Health endpoint working  
✅ **Docs**: API documentation available at `/api/v1/docs`  
✅ **Architecture**: Layered structure implemented  
✅ **Testing**: Framework configured  
✅ **Documentation**: Comprehensive guides available  

## 🤝 Contributing

1. Follow the established architecture patterns
2. Add tests for new features
3. Update documentation as needed
4. Follow the code style (run `npm run format`)
5. Ensure all checks pass (`npm run check`)

## 📝 License

MIT License - see LICENSE file for details.

---

**Ready for development!** 🎉

For detailed setup instructions and development guidelines, see [ONBOARDING.md](./ONBOARDING.md). 