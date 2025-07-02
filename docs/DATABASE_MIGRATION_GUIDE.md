# 🗄️ Database Migration & Seeding Guide

## Overview

This project uses a custom migration and seeding system to manage database schema changes and sample data. This approach follows industry best practices for database version control and supports both SQLite (development) and PostgreSQL (production).

## 🚀 Migration System

### Architecture

- **Migration Interface**: Defines structure for all migrations
- **Migration Manager**: Handles execution, rollback, and tracking
- **Version Control**: Each migration has a unique version number
- **Transaction Safety**: All migrations run in transactions
- **Rollback Support**: Every migration must implement rollback logic
- **Database Agnostic**: Supports both SQLite and PostgreSQL

### Directory Structure

```
src/database/
├── connection.ts                   # Database connection management
├── migrations/
│   ├── migration.interface.ts      # Migration interface definition
│   ├── migration-manager.ts        # Core migration engine
│   ├── migration.template.ts       # Template for new migrations
│   ├── 001_create_users_table.ts   # User table migration
│   └── index.ts                    # Migration registry & CLI
└── seeds/
    ├── seed.interface.ts           # Seed interface definition
    ├── seed-manager.ts             # Core seeding engine
    ├── create-sample-user.ts       # User seed data
    └── index.ts                    # Seed registry & CLI
```

## 📝 Creating Migrations

### 1. Copy Template

```bash
cp src/database/migrations/migration.template.ts src/database/migrations/002_add_posts_table.ts
```

### 2. Update Migration

```typescript
// src/database/migrations/002_add_posts_table.ts
export class AddPostsTableMigration implements Migration {
  readonly version = '002';  // Sequential version number
  readonly name = 'add_posts_table';

  async up(): Promise<void> {
    const isPostgreSQL = config.database.type === 'postgresql';
    
    const createPostsTable = `
      CREATE TABLE IF NOT EXISTS posts (
        id ${isPostgreSQL ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
        title VARCHAR(255) NOT NULL,
        content TEXT,
        user_id INTEGER NOT NULL,
        published BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `;

    await this.dbConnection.execute(createPostsTable);
    await this.dbConnection.execute('CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id)');
    
    // PostgreSQL trigger for updated_at
    if (isPostgreSQL) {
      await this.dbConnection.execute(`
        CREATE TRIGGER update_posts_updated_at
        BEFORE UPDATE ON posts
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
      `);
    }
  }

  async down(): Promise<void> {
    const isPostgreSQL = config.database.type === 'postgresql';
    
    if (isPostgreSQL) {
      await this.dbConnection.execute('DROP TRIGGER IF EXISTS update_posts_updated_at ON posts');
    }
    
    await this.dbConnection.execute('DROP INDEX IF EXISTS idx_posts_user_id');
    await this.dbConnection.execute('DROP TABLE IF EXISTS posts');
  }
}
```

### 3. Register Migration

In `src/database/migrations/index.ts`:

```typescript
import { AddPostsTableMigration } from './002_add_posts_table';

export function registerMigrations(migrationManager: MigrationManager): void {
  migrationManager.registerMigration(new CreateUsersTableMigration());
  migrationManager.registerMigration(new AddPostsTableMigration()); // Add new migration
}
```

## 🌱 Creating Seeds

### 1. Create Seed File

```typescript
// src/database/seeds/create-sample-posts.ts
import { DatabaseConnection } from '@/database/connection';
import { Seed } from './seed.interface';
import { logger } from '@/utils/logger';
import { config } from '@/config/environment';

export class CreateSamplePostsSeed implements Seed {
  readonly name = 'create_sample_posts';
  readonly order = 2; // Run after users seed

  private dbConnection: DatabaseConnection;

  constructor() {
    this.dbConnection = DatabaseConnection.getInstance();
  }

  // Helper method for database-agnostic placeholders
  private createPlaceholder(index: number): string {
    if (config.database.type === 'postgresql') {
      return `$${index + 1}`;
    } else {
      return '?';
    }
  }

  async run(): Promise<void> {
    // Check if posts already exist
    const existingPosts = await this.dbConnection.query(
      'SELECT COUNT(*) as count FROM posts'
    );

    if (existingPosts.rows[0].count > 0) {
      logger.info('ℹ️  Sample posts already exist');
      return;
    }

    // Create sample posts
    const insertSQL = `INSERT INTO posts (title, content, user_id, published) VALUES (${this.createPlaceholder(0)}, ${this.createPlaceholder(1)}, ${this.createPlaceholder(2)}, ${this.createPlaceholder(3)})`;
    
    await this.dbConnection.execute(insertSQL, [
      'First Post',
      'This is the first post content',
      1,
      true
    ]);

    logger.info('✅ Sample posts created');
  }
}
```

### 2. Register Seed

In `src/database/seeds/index.ts`:

```typescript
import { CreateSamplePostsSeed } from './create-sample-posts';

export function registerSeeds(seedManager: SeedManager): void {
  seedManager.registerSeed(new CreateSampleUsersSeed());
  seedManager.registerSeed(new CreateSamplePostsSeed()); // Add new seed
}
```

## 🛠️ CLI Commands

### Migration Commands

```bash
# Run all pending migrations
npm run db:migrate

# Check migration status
npm run db:migrate:status

# Rollback last migration
npm run db:migrate:rollback

# Show migration help
npm run db:migrate --help
```

### Seed Commands

```bash
# Run all seeds
npm run db:seed

# List available seeds
npm run db:seed:list

# Run specific seed
npm run db:seed run create_sample_users

# Show seed help
npm run db:seed --help
```

## 🔄 Automatic Migrations

Migrations run automatically when the application starts (configurable via environment):

```typescript
// In src/app.ts
private async setupDatabase(): Promise<void> {
  const dbConnection = DatabaseConnection.getInstance();
  await dbConnection.initialize();
  
  // Auto-run migrations based on environment configuration
  if (config.autoRunMigrations) {
    const migrationManager = new MigrationManager();
    registerMigrations(migrationManager);
    await migrationManager.runPendingMigrations();
  }
}
```

Environment control:
```env
# Development - auto-run enabled
AUTO_RUN_MIGRATIONS=true

# Production - manual control
AUTO_RUN_MIGRATIONS=false
```

## 📋 Best Practices

### Migration Guidelines

1. **Sequential Versioning**: Use incremental version numbers (001, 002, 003...)
2. **Descriptive Names**: Use clear, descriptive migration names
3. **Idempotent Operations**: Use `IF NOT EXISTS` and `IF EXISTS`
4. **Database Compatibility**: Handle PostgreSQL/SQLite differences properly
5. **Complete Rollback**: Always implement proper `down()` methods
6. **Atomic Changes**: Keep migrations focused on single concerns
7. **Never Modify**: Don't change existing migrations in production

### Seed Guidelines

1. **Ordered Execution**: Use `order` property for dependencies
2. **Idempotent**: Check if data exists before inserting
3. **Environment-Aware**: Different seeds for dev/staging/prod
4. **Real-like Data**: Use realistic sample data
5. **Performance**: Don't seed large datasets in production

### Database-Agnostic Code

```typescript
// ✅ Good: Database-agnostic placeholders
private createPlaceholder(index: number): string {
  return config.database.type === 'postgresql' ? `$${index + 1}` : '?';
}

// ✅ Good: Database-specific features
const autoIncrement = config.database.type === 'postgresql' ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';

// ✅ Good: Conditional triggers
if (config.database.type === 'postgresql') {
  await this.dbConnection.execute(`
    CREATE TRIGGER update_table_updated_at
    BEFORE UPDATE ON table_name
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);
}
```

## 🗄️ Database Support

The system supports both SQLite and PostgreSQL with automatic detection:

### SQLite (Development)
- **Auto-increment**: `AUTOINCREMENT`
- **DateTime**: `TIMESTAMP`
- **File-based**: `./database.sqlite`
- **Parameter placeholders**: `?`

### PostgreSQL (Production)
- **Auto-increment**: `SERIAL`
- **DateTime**: `TIMESTAMP`
- **Server-based**: Configure via environment
- **Parameter placeholders**: `$1, $2, $3`
- **Triggers**: Required for `updated_at` automation

## 🔧 Environment Configuration

```env
# Database Type
DB_TYPE=sqlite                    # or postgresql

# SQLite Configuration
DB_SQLITE_PATH=./database.sqlite

# PostgreSQL Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=nodejs_backend

# Migration Control
AUTO_RUN_MIGRATIONS=true          # Auto-run in dev/test
REQUIRE_MIGRATION_APPROVAL=false  # Manual approval in production
ALLOW_DATA_LOSS_MIGRATIONS=true   # Allow destructive operations
MIGRATION_TIMEOUT_MS=300000       # 5 minutes timeout
```

## 🚨 Troubleshooting

### Common Issues

1. **Migration Already Exists**: Check version numbers are unique
2. **Rollback Failed**: Ensure `down()` method is properly implemented
3. **Parameter Placeholder Errors**: Use `createPlaceholder()` helper method
4. **Connection Issues**: Check database configuration and server status

### Debug Commands

```bash
# Check current migration status
npm run db:migrate:status

# Test rollback (be careful in production!)
npm run db:migrate:rollback

# Re-run failed migration
npm run db:migrate
```

### Database-Specific Debugging

```bash
# SQLite
sqlite3 database.sqlite
.tables
.schema users
SELECT * FROM migrations;

# PostgreSQL
psql -h localhost -U username -d database
\dt
\d users
SELECT * FROM migrations;
```

## 📚 Examples

### Adding a Column

```typescript
// 003_add_email_verified_to_users.ts
async up(): Promise<void> {
  await this.dbConnection.execute(
    'ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE'
  );
}

async down(): Promise<void> {
  // Note: SQLite doesn't support DROP COLUMN easily
  // Consider backup/restore approach for SQLite
  if (config.database.type === 'postgresql') {
    await this.dbConnection.execute('ALTER TABLE users DROP COLUMN email_verified');
  } else {
    throw new Error('Cannot rollback: SQLite does not support DROP COLUMN');
  }
}
```

### Creating Index

```typescript
// 004_add_user_email_index.ts
async up(): Promise<void> {
  await this.dbConnection.execute(
    'CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users(email)'
  );
}

async down(): Promise<void> {
  await this.dbConnection.execute(
    'DROP INDEX IF EXISTS idx_users_email_unique'
  );
}
```

### Data Migration with Parameters

```typescript
// 005_update_user_roles.ts
async up(): Promise<void> {
  const updateSQL = `UPDATE users SET role = ${this.createPlaceholder(0)} WHERE role IS NULL`;
  await this.dbConnection.execute(updateSQL, ['user']);
}

async down(): Promise<void> {
  const updateSQL = `UPDATE users SET role = NULL WHERE role = ${this.createPlaceholder(0)}`;
  await this.dbConnection.execute(updateSQL, ['user']);
}
```

## 🎯 Migration vs Manual Setup

### ❌ Before (Manual Setup in Code)

```typescript
// Hard-coded in connection.ts - BAD!
private async runMigrations(): Promise<void> {
  const createUsersTable = `CREATE TABLE users (...)`;
  await this.execute(createUsersTable);
}
```

### ✅ After (Proper Migration System)

```typescript
// Versioned, tracked, rollback-able - GOOD!
export class CreateUsersTableMigration implements Migration {
  readonly version = '001';
  readonly name = 'create_users_table';
  
  async up(): Promise<void> { /* ... */ }
  async down(): Promise<void> { /* ... */ }
}
```

## 🏆 Benefits

1. **Version Control**: Track all database changes in code
2. **Team Collaboration**: Share schema changes via migrations
3. **Environment Consistency**: Same schema across dev/staging/prod
4. **Rollback Capability**: Safely undo changes if needed
5. **Automated Deployment**: Migrations run automatically (configurable)
6. **Audit Trail**: See what changed and when
7. **Database Agnostic**: Works with both SQLite and PostgreSQL

## 🔗 Related Documentation

- **Environment Setup**: `docs/ENVIRONMENT_SETUP.md` - Database configuration
- **Onboarding Guide**: `docs/ONBOARDING.md` - Getting started with development

---

This migration system ensures your database schema is properly versioned, tracked, and can be safely deployed across different environments! 🚀 