# 🔧 Environment Configuration Examples

## Overview

The migration system is fully controlled through environment variables. You can configure each environment according to your specific needs.

## 🚀 Development Environment

**File: `.env.dev`**
```env
# 🌐 Server Configuration
NODE_ENV=development
PORT=3000
API_PREFIX=/api/v1

# 🗄️ Database Configuration
DB_TYPE=sqlite
DB_SQLITE_PATH=./database.sqlite

# 🔧 Migration Configuration - Development
# ✅ Enable auto-run for fast development iteration
AUTO_RUN_MIGRATIONS=true

# No manual approval needed in development
REQUIRE_MIGRATION_APPROVAL=false

# Allow data loss migrations in development (for rapid prototyping)
ALLOW_DATA_LOSS_MIGRATIONS=true

# Shorter timeout for development
MIGRATION_TIMEOUT_MS=60000

# 🔐 JWT Configuration
JWT_SECRET=dev-jwt-secret-key-not-for-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=dev-refresh-secret-key-not-for-production
JWT_REFRESH_EXPIRES_IN=30d

# 🍪 Cookie Configuration
COOKIE_SECRET=dev-cookie-secret-not-for-production

# 📝 Logging Configuration
LOG_LEVEL=debug
```

**Running development:**
```bash
# Copy example file
cp docs/examples/.env.dev.example .env.dev

# Start with auto-migration
yarn dev
```

## 🧪 Test Environment

**File: `.env.test`**
```env
# 🌐 Server Configuration
NODE_ENV=test
PORT=3001
API_PREFIX=/api/v1

# 🗄️ Database Configuration
DB_TYPE=sqlite
DB_SQLITE_PATH=./database.test.sqlite

# 🔧 Migration Configuration - Test
# ✅ Enable auto-run for test setup
AUTO_RUN_MIGRATIONS=true

# No manual approval needed in tests
REQUIRE_MIGRATION_APPROVAL=false

# Allow data loss in tests (for clean slate testing)
ALLOW_DATA_LOSS_MIGRATIONS=true

# Fast timeout for tests
MIGRATION_TIMEOUT_MS=30000

# 🔐 JWT Configuration
JWT_SECRET=test-jwt-secret-key
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=test-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=2h

# 🍪 Cookie Configuration
COOKIE_SECRET=test-cookie-secret

# 📝 Logging Configuration
LOG_LEVEL=error
```

**Running tests:**
```bash
yarn test  # Auto-migration enabled in tests
```

## 🎭 Staging Environment

**File: `.env.staging`**
```env
# 🌐 Server Configuration
NODE_ENV=staging
PORT=3000
API_PREFIX=/api/v1

# 🗄️ Database Configuration
DB_TYPE=mysql
DB_HOST=staging-db-host
DB_PORT=3306
DB_USERNAME=staging_user
DB_PASSWORD=staging_password
DB_DATABASE=nodejs_backend_staging

# 🔧 Migration Configuration - Staging
# ⚠️ Manual control - no auto-run
AUTO_RUN_MIGRATIONS=false

# Require manual approval for safety
REQUIRE_MIGRATION_APPROVAL=true

# NO data loss allowed in staging
ALLOW_DATA_LOSS_MIGRATIONS=false

# Standard timeout
MIGRATION_TIMEOUT_MS=300000

# 🔐 JWT Configuration
JWT_SECRET=staging-super-secret-jwt-key
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=staging-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=7d

# 🍪 Cookie Configuration
COOKIE_SECRET=staging-cookie-secret

# 📝 Logging Configuration
LOG_LEVEL=info
```

**Staging deployment:**
```bash
# App will check migrations but NOT auto-run
yarn start:staging

# Run migrations manually when needed
yarn db:migrate
```

## 🏭 Production Environment

**File: `.env.production`**
```env
# 🌐 Server Configuration
NODE_ENV=production
PORT=3000
API_PREFIX=/api/v1

# 🗄️ Database Configuration
DB_TYPE=mysql
DB_HOST=production-db-host
DB_PORT=3306
DB_USERNAME=prod_user
DB_PASSWORD=super-secure-production-password
DB_DATABASE=nodejs_backend_production

# 🔧 Migration Configuration - Production
# 🚨 NEVER auto-run in production
AUTO_RUN_MIGRATIONS=false

# ALWAYS require manual approval in production
REQUIRE_MIGRATION_APPROVAL=true

# NEVER allow data loss in production
ALLOW_DATA_LOSS_MIGRATIONS=false

# Longer timeout for large production databases
MIGRATION_TIMEOUT_MS=600000

# 🔐 JWT Configuration
JWT_SECRET=production-ultra-secure-jwt-secret-key
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=production-ultra-secure-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

# 🍪 Cookie Configuration
COOKIE_SECRET=production-ultra-secure-cookie-secret

# 📝 Logging Configuration
LOG_LEVEL=warn
```

**Production deployment:**
```bash
# 1. Backup database first
mysqldump production_db > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Deploy code (app will check migrations and error if pending)
yarn start:prod

# 3. If there are pending migrations, run manually
yarn db:migrate
```

## 🔧 Custom Scenarios

### Scenario 1: Development with Manual Migration
```env
NODE_ENV=development
AUTO_RUN_MIGRATIONS=false  # ← Disable auto-run
REQUIRE_MIGRATION_APPROVAL=false
ALLOW_DATA_LOSS_MIGRATIONS=true
```

### Scenario 2: CI/CD Pipeline
```env
NODE_ENV=test
AUTO_RUN_MIGRATIONS=true  # ← Auto-run in CI
REQUIRE_MIGRATION_APPROVAL=false
ALLOW_DATA_LOSS_MIGRATIONS=true
MIGRATION_TIMEOUT_MS=30000  # ← Fast timeout
```

### Scenario 3: Production Emergency (NOT RECOMMENDED)
```env
NODE_ENV=production
AUTO_RUN_MIGRATIONS=true  # ← Only in emergency situations
REQUIRE_MIGRATION_APPROVAL=false
ALLOW_DATA_LOSS_MIGRATIONS=false
```

## 🛠️ Commands

### Check Migration Status
```bash
yarn db:migrate:status
```

### Manual Migration Run
```bash
yarn db:migrate
```

### Rollback Last Migration
```bash
yarn db:migrate:rollback
```

## 📋 Configuration Summary

| Variable | Development | Test | Staging | Production |
|---|---|---|---|---|
| `AUTO_RUN_MIGRATIONS` | `true` | `true` | `false` | `false` |
| `REQUIRE_MIGRATION_APPROVAL` | `false` | `false` | `true` | `true` |
| `ALLOW_DATA_LOSS_MIGRATIONS` | `true` | `true` | `false` | `false` |
| `MIGRATION_TIMEOUT_MS` | `60000` | `30000` | `300000` | `600000` |

## 🎯 Benefits

1. **Complete Control**: You decide when to run migrations
2. **Environment Specific**: Each environment has its own configuration
3. **Safety First**: Production is protected from auto-migrations
4. **Developer Friendly**: Development can auto-run if desired
5. **CI/CD Ready**: Test environment auto-runs migrations
6. **Rollback Support**: Can rollback when needed

**🎉 Migration system is now completely flexible and safe!** 