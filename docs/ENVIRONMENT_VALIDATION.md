# 🛡️ Environment Validation System

## Overview

The environment validation system is built-in to ensure application configuration is safe and valid before startup. Validation runs automatically when loading environment config.

## 🔍 Validation Categories

### 1. 🔐 Security Validation

#### Required Secrets
```bash
# ❌ Error if missing
JWT_SECRET=
JWT_REFRESH_SECRET=
COOKIE_SECRET=
```

#### Production Security Checks
```bash
# ⚠️ Warning if secret is too short (< 32 characters)
JWT_SECRET=short

# ❌ Error if contains development keywords
JWT_SECRET=dev-secret-key
JWT_SECRET=test-password
JWT_SECRET=example-key
```

### 2. 🗄️ Database Validation

#### Database Type
```bash
# ✅ Valid
DB_TYPE=sqlite
DB_TYPE=mysql

# ❌ Error
DB_TYPE=postgres    # Not supported
DB_TYPE=invalid     # Invalid value
```

#### Production MySQL Requirements
```bash
# When NODE_ENV=production and DB_TYPE=mysql
# ❌ Error if any of these variables are missing:
DB_HOST=production-db-host
DB_USERNAME=prod_user
DB_PASSWORD=secure_password
DB_DATABASE=production_db
```

#### Production SQLite Warning
```bash
# ⚠️ Warning in production
NODE_ENV=production
DB_TYPE=sqlite  # Recommend using MySQL
```

### 3. 🔢 Numeric Validation

#### Port Numbers
```bash
# ✅ Valid
PORT=3000
DB_PORT=3306

# ❌ Error
PORT=abc        # Not a number
PORT=70000      # Outside range 1-65535
DB_PORT=-1      # Negative number
```

#### Migration Timeout
```bash
# ✅ Valid
MIGRATION_TIMEOUT_MS=300000   # 5 minutes
MIGRATION_TIMEOUT_MS=60000    # 1 minute

# ❌ Error
MIGRATION_TIMEOUT_MS=500      # < 1000ms
MIGRATION_TIMEOUT_MS=abc      # Not a number
```

### 4. 🔧 Migration Safety

#### Production Safety Checks
```bash
# ⚠️ Warning - risky in production
NODE_ENV=production
AUTO_RUN_MIGRATIONS=true

# ❌ Error - dangerous in production  
NODE_ENV=production
ALLOW_DATA_LOSS_MIGRATIONS=true
```

#### Development Recommendations
```bash
# 💡 Suggestion for development
NODE_ENV=development
# Not setting AUTO_RUN_MIGRATIONS -> suggest setting true
```

### 5. 📝 Log Level Validation

```bash
# ✅ Valid
LOG_LEVEL=error
LOG_LEVEL=warn
LOG_LEVEL=info
LOG_LEVEL=debug

# ⚠️ Warning
LOG_LEVEL=verbose    # Invalid
LOG_LEVEL=trace      # Not supported
```

## 🚨 Error Types & Solutions

### Error Examples

#### 1. Missing Required Variables
```
❌ Environment Configuration Errors:
   Missing required security variables: JWT_SECRET, COOKIE_SECRET

💡 Solution:
- Add missing variables to .env file
- Copy from .env.example and update values
```

#### 2. Invalid Database Type
```
❌ Environment Configuration Errors:
   Invalid DB_TYPE: postgres. Must be 'sqlite' or 'mysql'

💡 Solution:
- Only use DB_TYPE=sqlite or DB_TYPE=mysql
- See docs to migrate to different database type
```

#### 3. Production MySQL Missing Config
```
❌ Environment Configuration Errors:
   Production MySQL requires: DB_HOST, DB_PASSWORD, DB_DATABASE

💡 Solution:
- Add complete MySQL config for production
- Or switch to SQLite if accepting warning
```

#### 4. Unsafe Production Secrets
```
❌ Environment Configuration Errors:
   🚨 JWT_SECRET contains development keywords - not safe for production

💡 Solution:
- Generate new production secrets
- Ensure they don't contain: dev, test, example
- Minimum 32 characters for production
```

### Warning Examples

#### 1. Production Auto-Migration
```
⚠️  Environment Configuration Warnings:
   🚨 AUTO_RUN_MIGRATIONS=true in production - this is risky!

💡 Recommendation:
- Set AUTO_RUN_MIGRATIONS=false in production
- Run migrations manually before deployment
```

#### 2. Short Production Secrets
```
⚠️  Environment Configuration Warnings:
   🔐 JWT_SECRET is too short for production (minimum 32 characters recommended)

💡 Recommendation:
- Generate secrets longer than 32 characters
- Use crypto-strong random strings
```

## 🔧 Environment Examples

### ✅ Valid Development Config
```env
NODE_ENV=development
PORT=3000
DB_TYPE=sqlite
DB_SQLITE_PATH=./database.sqlite

AUTO_RUN_MIGRATIONS=true
REQUIRE_MIGRATION_APPROVAL=false
ALLOW_DATA_LOSS_MIGRATIONS=true
MIGRATION_TIMEOUT_MS=60000

JWT_SECRET=development-jwt-secret-at-least-32-chars
JWT_REFRESH_SECRET=development-refresh-secret-at-least-32-chars
COOKIE_SECRET=development-cookie-secret-at-least-32-chars
LOG_LEVEL=debug
```

### ✅ Valid Production Config
```env
NODE_ENV=production
PORT=3000
DB_TYPE=mysql
DB_HOST=production-mysql-host
DB_PORT=3306
DB_USERNAME=prod_user
DB_PASSWORD=super-secure-production-password
DB_DATABASE=nodejs_backend_production

AUTO_RUN_MIGRATIONS=false
REQUIRE_MIGRATION_APPROVAL=true
ALLOW_DATA_LOSS_MIGRATIONS=false
MIGRATION_TIMEOUT_MS=600000

JWT_SECRET=ultra-secure-production-jwt-secret-key-with-sufficient-length
JWT_REFRESH_SECRET=ultra-secure-production-refresh-secret-with-sufficient-length
COOKIE_SECRET=ultra-secure-production-cookie-secret-with-sufficient-length
LOG_LEVEL=warn
```

## 🛠️ Debugging Validation

### Check Validation Status
```bash
# View validation messages when running any command
yarn db:migrate:status
yarn build
yarn dev
```

### Test Specific Configuration
```bash
# Test with specific config
NODE_ENV=production DB_TYPE=mysql yarn db:migrate:status

# Test invalid values
DB_TYPE=invalid yarn db:migrate:status
MIGRATION_TIMEOUT_MS=abc yarn db:migrate:status
```

### Override Validation (Development Only)
```bash
# Bypass some checks in development
NODE_ENV=development SKIP_ENV_VALIDATION=true yarn dev
```

## 📋 Validation Checklist

### Development Setup
- [ ] All required secrets set
- [ ] PORT is valid number
- [ ] DB_TYPE is sqlite or mysql
- [ ] MIGRATION_TIMEOUT_MS is valid
- [ ] LOG_LEVEL is valid

### Production Deployment
- [ ] All required secrets set with strong values
- [ ] Secrets don't contain dev/test keywords
- [ ] Secrets are at least 32 characters
- [ ] MySQL config complete (if using MySQL)
- [ ] AUTO_RUN_MIGRATIONS=false
- [ ] ALLOW_DATA_LOSS_MIGRATIONS=false
- [ ] PORT and DB_PORT in valid range

## 🎯 Benefits

1. **Early Error Detection**: Catch configuration errors before runtime
2. **Security Enforcement**: Ensure production secrets are safe
3. **Development Guidance**: Suggest optimal configuration for dev
4. **Production Safety**: Prevent dangerous configuration in production
5. **Clear Error Messages**: Clear error messages with fix guidance

**🛡️ Environment validation helps ensure the application is always safe and properly configured!** 