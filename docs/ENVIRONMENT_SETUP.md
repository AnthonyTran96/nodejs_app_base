# 🔧 Environment Setup Guide

## 📋 Overview

This guide covers complete environment configuration for the Node.js backend project, including validation rules, examples for different environments, security configurations, and troubleshooting.

## 🚀 Quick Start

### 1. Copy Environment Template
```bash
cp .env.example .env
```

### 2. Configure Database
```env
# Development (SQLite)
DB_TYPE=sqlite
DB_SQLITE_PATH=./database.sqlite

# Production (PostgreSQL)
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your-password
DB_DATABASE=nodejs_backend
```

### 3. Set Security Keys
```env
# Generate secure keys (minimum 32 characters)
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key
COOKIE_SECRET=your-super-secure-cookie-secret-key
```

### 4. Configure CORS Origins (Optional)
```env
# Development - Automatically uses dynamic PORT
# No configuration needed, defaults work for most cases

# Production - Required for security
ALLOWED_ORIGINS=https://yourdomain.com,https://admin.yourdomain.com

# Development with custom origins (optional)
ALLOWED_ORIGINS=http://localhost:8080,http://myapp.dev:3000
```

### 5. Start Application
```bash
npm run dev
```

## 🌍 Environment Configurations

### 📝 Development Environment

**File: `.env` or `.env.dev`**
```env
# 🌐 Server Configuration
NODE_ENV=development
PORT=3000
API_PREFIX=/api/v1

# 🗄️ Database Configuration
DB_TYPE=sqlite
DB_SQLITE_PATH=./database.sqlite

# 🌐 CORS Configuration (Optional - auto-configured)
# ALLOWED_ORIGINS=http://localhost:8080,http://myapp.dev:3000  # Only if custom origins needed

# 🔐 Security Configuration
JWT_SECRET=development-jwt-secret-at-least-32-characters-long
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=development-refresh-secret-at-least-32-characters
JWT_REFRESH_EXPIRES_IN=30d
COOKIE_SECRET=development-cookie-secret-at-least-32-characters

# 📝 Logging
LOG_LEVEL=debug

# 🔧 Development Features
AUTO_RUN_MIGRATIONS=true
REQUIRE_MIGRATION_APPROVAL=false
ALLOW_DATA_LOSS_MIGRATIONS=true
```

### 🧪 Test Environment

**File: `.env.test`**
```env
# 🌐 Server Configuration
NODE_ENV=test
PORT=3001
API_PREFIX=/api/v1

# 🗄️ Database Configuration (Separate test database)
DB_TYPE=sqlite
DB_SQLITE_PATH=./database.test.sqlite

# 🌐 CORS Configuration (Test-specific if needed)
# ALLOWED_ORIGINS=http://localhost:3001

# 🔐 Security Configuration (Different from dev)
JWT_SECRET=test-jwt-secret-key-for-testing-only
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=test-refresh-secret-for-testing-only
JWT_REFRESH_EXPIRES_IN=2h
COOKIE_SECRET=test-cookie-secret-for-testing-only

# 📝 Logging (Minimal for tests)
LOG_LEVEL=error

# 🔧 Test Features
AUTO_RUN_MIGRATIONS=true
REQUIRE_MIGRATION_APPROVAL=false
ALLOW_DATA_LOSS_MIGRATIONS=true
```

### 🏭 Production Environment

**File: `.env.production`**
```env
# 🌐 Server Configuration
NODE_ENV=production
PORT=3000
API_PREFIX=/api/v1

# 🗄️ Database Configuration (PostgreSQL recommended)
DB_TYPE=postgresql
DB_HOST=your-production-db-host
DB_PORT=5432
DB_USERNAME=your-production-user
DB_PASSWORD=ultra-secure-production-password
DB_DATABASE=nodejs_backend_production

# 🌐 CORS Configuration (REQUIRED for security)
ALLOWED_ORIGINS=https://yourdomain.com,https://admin.yourdomain.com,https://api.yourdomain.com

# 🔐 Security Configuration (Strong secrets required)
JWT_SECRET=ultra-secure-production-jwt-secret-key-minimum-32-chars
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=ultra-secure-production-refresh-secret-minimum-32-chars
JWT_REFRESH_EXPIRES_IN=7d
COOKIE_SECRET=ultra-secure-production-cookie-secret-minimum-32-chars

# 📝 Logging (Production level)
LOG_LEVEL=warn

# 🔧 Production Safety
AUTO_RUN_MIGRATIONS=false
REQUIRE_MIGRATION_APPROVAL=true
ALLOW_DATA_LOSS_MIGRATIONS=false
MIGRATION_TIMEOUT_MS=600000
```

## 🛡️ Environment Validation

The application automatically validates your environment configuration on startup.

### ✅ Required Variables

These variables **must** be set for the application to start:

```env
NODE_ENV=
PORT=
JWT_SECRET=
JWT_REFRESH_SECRET=
COOKIE_SECRET=
DB_TYPE=
```

### 📊 Validation Rules

#### 1. **Database Type**
```env
# ✅ Valid
DB_TYPE=sqlite
DB_TYPE=postgresql

# ❌ Invalid
DB_TYPE=mysql     # Not supported anymore
DB_TYPE=invalid   # Unknown type
```

#### 2. **PostgreSQL Requirements**
When using `DB_TYPE=postgresql`, these are required:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your-password
DB_DATABASE=your-database
```

#### 3. **Security Keys**
```env
# ✅ Good (32+ characters)
JWT_SECRET=ultra-secure-production-jwt-secret-key-minimum-32-chars

# ⚠️ Warning (too short)
JWT_SECRET=short-key

# ❌ Error (development keywords in production)
JWT_SECRET=dev-secret-key    # Contains 'dev'
JWT_SECRET=test-password     # Contains 'test'
```

#### 4. **CORS Origins Configuration**
```env
# ✅ Production (HTTPS required)
ALLOWED_ORIGINS=https://myapp.com,https://admin.myapp.com

# ✅ Development (HTTP localhost allowed)
ALLOWED_ORIGINS=http://localhost:8080,http://myapp.dev:3000

# ⚠️ Development auto-configuration (when ALLOWED_ORIGINS not set)
# Automatically includes: http://localhost:PORT, http://127.0.0.1:PORT, common dev ports

# ❌ Production HTTP (security warning)
ALLOWED_ORIGINS=http://myapp.com  # Should use HTTPS in production
```

#### 5. **Port Numbers**
```env
# ✅ Valid
PORT=3000
DB_PORT=5432

# ❌ Invalid
PORT=abc         # Not a number
PORT=70000       # Outside valid range (1-65535)
```

### 🚨 Common Validation Errors

#### Error: Missing Required Variables
```
❌ Environment Configuration Errors:
   Missing required variables: JWT_SECRET, COOKIE_SECRET

💡 Solution: Add missing variables to your .env file
```

#### Error: Invalid Database Type
```
❌ Environment Configuration Errors:
   Invalid DB_TYPE: mysql. Must be 'sqlite' or 'postgresql'

💡 Solution: Change DB_TYPE to 'sqlite' or 'postgresql'
```

#### Error: Production Security
```
❌ Environment Configuration Errors:
   JWT_SECRET contains development keywords - not safe for production

💡 Solution: Use production-safe secrets without 'dev', 'test', 'example'
```

#### Warning: CORS Configuration
```
⚠️  Environment Configuration Warnings:
   🚨 ALLOWED_ORIGINS not set in production - using default domain. Set ALLOWED_ORIGINS for security.

💡 Recommendation: Set ALLOWED_ORIGINS in production for proper CORS security
```

#### Warning: Short Secrets
```
⚠️  Environment Configuration Warnings:
   JWT_SECRET is too short for production (minimum 32 characters)

💡 Recommendation: Generate longer, crypto-strong secrets
```

## 🌐 CORS Configuration Details

### Automatic Configuration (Development)
When `ALLOWED_ORIGINS` is **not set** in development, the system automatically allows:

```typescript
// Auto-generated based on PORT environment variable
[
  `http://localhost:${PORT}`,     // Dynamic based on your PORT
  `http://127.0.0.1:${PORT}`,    // IP version of your PORT
  'http://localhost:3000',        // Common development port
  'http://localhost:3001',        // Alternative development port
  'http://127.0.0.1:3000',       // IP versions
  'http://127.0.0.1:3001'
]
```

### Custom Configuration (All Environments)
Set `ALLOWED_ORIGINS` to override defaults:

```env
# Single origin
ALLOWED_ORIGINS=https://myapp.com

# Multiple origins (comma-separated)
ALLOWED_ORIGINS=https://myapp.com,https://admin.myapp.com,https://api.myapp.com

# Development with frontend on different port
ALLOWED_ORIGINS=http://localhost:8080,http://localhost:5173

# Mixed environments (not recommended)
ALLOWED_ORIGINS=https://production.com,http://localhost:3000
```

### CORS Security Validation

The system validates CORS origins based on environment:

**Production Environment:**
- ✅ **HTTPS origins** are recommended
- ⚠️ **HTTP origins** generate security warnings (except localhost)
- 🚨 **Missing ALLOWED_ORIGINS** shows warning

**Development Environment:**
- ✅ **HTTP localhost** origins are allowed
- 💡 **HTTPS origins** in development generate informational warnings
- ✅ **Auto-configuration** when no ALLOWED_ORIGINS set

## 🔐 Security Best Practices

### 1. **Generate Strong Secrets**
```bash
# Generate secure random keys
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('COOKIE_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

### 2. **Environment-Specific Secrets**
- ✅ **Different secrets** for dev/test/production
- ✅ **Never commit** `.env` files to git
- ✅ **Use key management** services in production
- ✅ **Rotate secrets** regularly

### 3. **Database Security**
```env
# ✅ Production PostgreSQL
DB_USERNAME=app_user              # Not 'postgres'
DB_PASSWORD=complex-secure-pass   # Strong password
DB_HOST=private-db-host           # Not public IP

# ⚠️ Development SQLite
DB_SQLITE_PATH=./database.sqlite  # Local file only
```

### 4. **CORS Security**
```env
# ✅ Production CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://admin.yourdomain.com

# ✅ Development CORS (automatic)
# No ALLOWED_ORIGINS needed - auto-configures based on PORT

# ✅ Development CORS (manual)
ALLOWED_ORIGINS=http://localhost:8080,http://myapp.dev:3000

# ❌ Avoid wildcard in production
ALLOWED_ORIGINS=*  # Never use this
```

## 🐛 Troubleshooting

### Issue: Application Won't Start
```bash
# Check environment validation
npm run dev 2>&1 | grep -E "(❌|⚠️)"

# Common fixes:
1. Copy .env.example to .env
2. Set all required variables
3. Use correct DB_TYPE values
4. Generate proper length secrets
```

### Issue: CORS Errors
```bash
# Check current CORS configuration
NODE_ENV=development node -e "
const config = require('./dist/config/environment').config;
console.log('Allowed Origins:', config.allowedOrigins);
"

# Common fixes:
1. Set ALLOWED_ORIGINS for custom origins
2. Verify frontend URL matches allowed origins
3. Check protocol (http vs https)
4. Ensure PORT matches your server port
```

### Issue: Database Connection Failed
```bash
# SQLite issues
- Check DB_SQLITE_PATH directory exists
- Ensure write permissions

# PostgreSQL issues  
- Check PostgreSQL is running: systemctl status postgresql
- Verify connection: psql -h HOST -U USER -d DATABASE
- Check firewall rules
```

### Issue: JWT/Cookie Errors
```bash
# Check secret lengths
node -e "console.log('JWT_SECRET length:', process.env.JWT_SECRET?.length || 0)"

# Regenerate if needed
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Issue: Migration Errors
```bash
# Check migration configuration
npm run db:migrate:status

# Safe development reset
rm database.sqlite  # Only in development!
npm run dev         # Will recreate with migrations
```

## 📋 Configuration Checklist

### ✅ Development Setup
- [ ] `.env` file created from template
- [ ] `DB_TYPE=sqlite` configured
- [ ] All required secrets set (32+ chars)
- [ ] `LOG_LEVEL=debug` for development
- [ ] `AUTO_RUN_MIGRATIONS=true` for convenience
- [ ] CORS auto-configured (no ALLOWED_ORIGINS needed)

### ✅ Production Deployment  
- [ ] `.env.production` with strong secrets
- [ ] `DB_TYPE=postgresql` with complete config
- [ ] `NODE_ENV=production`
- [ ] `ALLOWED_ORIGINS` set with HTTPS domains
- [ ] `AUTO_RUN_MIGRATIONS=false` for safety
- [ ] `LOG_LEVEL=warn` or `error`
- [ ] Secrets don't contain dev/test keywords
- [ ] All secrets 32+ characters

### ✅ Security Verification
- [ ] CORS origins use HTTPS in production
- [ ] No wildcard origins in production
- [ ] Database credentials secured
- [ ] Environment variables not in git
- [ ] Secrets rotated regularly

## 🎯 Environment Summary

| Environment | Database | Auto-Migration | Logging | CORS | Secrets |
|-------------|----------|----------------|---------|------|---------|
| **Development** | SQLite | ✅ Enabled | Debug | Auto-configured | Dev-safe |
| **Test** | SQLite | ✅ Enabled | Error only | Test-specific | Test-safe |
| **Production** | PostgreSQL | ❌ Manual | Warn/Error | HTTPS required | Ultra-secure |

## 🔄 Recent Security Enhancements

### Input Sanitization (v1.1.0)
- ✅ **XSS Prevention**: HTML/script content automatically sanitized
- ✅ **Applied to**: All user input fields (name, email, bio, etc.)
- ✅ **Logging**: Sanitization events logged for monitoring

### Request Security (v1.1.0)
- ✅ **Size Limits**: Request payloads limited to 1MB (was 10MB)
- ✅ **Error Handling**: Proper 413 responses for oversized requests
- ✅ **Monitoring**: Large request attempts logged with IP tracking

### Enhanced Headers (v1.1.0)
- ✅ **Content Security Policy**: Strict script and style policies
- ✅ **HSTS**: HTTP Strict Transport Security enabled
- ✅ **XSS Protection**: Browser XSS filtering enabled
- ✅ **CORS Policies**: Enhanced cross-origin security

### Dynamic CORS (v1.1.0)
- ✅ **PORT Awareness**: CORS origins automatically adapt to PORT environment
- ✅ **Environment Flexibility**: ALLOWED_ORIGINS works in all environments
- ✅ **Validation**: Production HTTPS enforcement with warnings

---

**🛡️ Remember**: Proper environment configuration is crucial for application security and reliability! 

For security questions, refer to the comprehensive security testing reports in `reports/security-testing/`. 