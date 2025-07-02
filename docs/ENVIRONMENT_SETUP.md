# 🔧 Environment Setup Guide

## 📋 Overview

This guide covers complete environment configuration for the Node.js backend project, including validation rules, examples for different environments, and troubleshooting.

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

### 4. Start Application
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

#### 4. **Port Numbers**
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

#### Warning: Short Secrets
```
⚠️  Environment Configuration Warnings:
   JWT_SECRET is too short for production (minimum 32 characters)

💡 Recommendation: Generate longer, crypto-strong secrets
```

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

### ✅ Production Deployment  
- [ ] `.env.production` with strong secrets
- [ ] `DB_TYPE=postgresql` with complete config
- [ ] `NODE_ENV=production`
- [ ] `AUTO_RUN_MIGRATIONS=false` for safety
- [ ] `LOG_LEVEL=warn` or `error`
- [ ] Secrets don't contain dev/test keywords
- [ ] All secrets 32+ characters

## 🎯 Environment Summary

| Environment | Database | Auto-Migration | Logging | Secrets |
|-------------|----------|----------------|---------|---------|
| **Development** | SQLite | ✅ Enabled | Debug | Dev-safe |
| **Test** | SQLite | ✅ Enabled | Error only | Test-safe |
| **Production** | PostgreSQL | ❌ Manual | Warn/Error | Ultra-secure |

---

**🛡️ Remember**: Proper environment configuration is crucial for application security and reliability! 