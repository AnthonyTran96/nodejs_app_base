# 🗄️ Database Migration & Seeding Guide

## Overview

This project uses a custom migration and seeding system to manage database schema changes and sample data. This approach follows industry best practices for database version control.

## 🚀 Migration System

### Architecture

- **Migration Interface**: Defines structure for all migrations
- **Migration Manager**: Handles execution, rollback, and tracking
- **Version Control**: Each migration has a unique version number
- **Transaction Safety**: All migrations run in transactions
- **Rollback Support**: Every migration must implement rollback logic

### Directory Structure

```
src/database/
├── migrations/
│   ├── migration.interface.ts      # Migration interface definition
│   ├── migration-manager.ts        # Core migration engine
│   ├── migration.template.ts       # Template for new migrations
│   ├── 001_create_users_table.ts   # Example migration
│   └── index.ts                    # Migration registry & CLI
└── seeds/
    ├── seed.interface.ts           # Seed interface definition
    ├── seed-manager.ts             # Core seeding engine
    ├── create-sample-user.ts       # Example seed
    └── index.ts                    # Seed registry & CLI
```

## 📝 Creating Migrations

### 1. Copy Template

```bash
cp src/database/migrations/migration.template.ts src/database/migrations/002_add_posts_table.ts
```

### 2. Update Migration

```typescript
export class AddPostsTableMigration implements Migration {
  readonly version = '002';  // Sequential version number
  readonly name = 'add_posts_table';

  async up(): Promise<void> {
    const isMySQL = config.database.type === 'mysql';
    
    const createPostsTable = `
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY ${isMySQL ? 'AUTO_INCREMENT' : 'AUTOINCREMENT'},
        title VARCHAR(255) NOT NULL,
        content TEXT,
        user_id INTEGER NOT NULL,
        created_at ${isMySQL ? 'TIMESTAMP' : 'DATETIME'} DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `;

    await this.dbConnection.execute(createPostsTable);
    await this.dbConnection.execute('CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id)');
  }

  async down(): Promise<void> {
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

export class CreateSamplePostsSeed implements Seed {
  readonly name = 'create_sample_posts';
  readonly order = 2; // Run after users seed

  private dbConnection: DatabaseConnection;

  constructor() {
    this.dbConnection = DatabaseConnection.getInstance();
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
    await this.dbConnection.execute(
      'INSERT INTO posts (title, content, user_id) VALUES (?, ?, ?)',
      ['First Post', 'This is the first post content', 1]
    );

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
yarn db:migrate migrate

# Check migration status
yarn db:migrate:status

# Rollback last migration
yarn db:migrate:rollback

# Show migration help
yarn db:migrate
```

### Seed Commands

```bash
# Run all seeds
yarn db:seed

# List available seeds
yarn db:seed:list

# Run specific seed
yarn db:seed seed create_sample_users

# Show seed help
yarn db:seed
```

## 🔄 Automatic Migrations

Migrations run automatically when the application starts:

```typescript
// In src/app.ts
private async setupDatabase(): Promise<void> {
  // ... database connection ...
  
  // Auto-run migrations on startup
  const migrationManager = new MigrationManager();
  registerMigrations(migrationManager);
  await migrationManager.runPendingMigrations();
}
```

## 📋 Best Practices

### Migration Guidelines

1. **Sequential Versioning**: Use incremental version numbers (001, 002, 003...)
2. **Descriptive Names**: Use clear, descriptive migration names
3. **Idempotent Operations**: Use `IF NOT EXISTS` and `IF EXISTS`
4. **Database Compatibility**: Handle MySQL/SQLite differences
5. **Complete Rollback**: Always implement proper `down()` methods
6. **Atomic Changes**: Keep migrations focused on single concerns
7. **Never Modify**: Don't change existing migrations in production

### Seed Guidelines

1. **Ordered Execution**: Use `order` property for dependencies
2. **Idempotent**: Check if data exists before inserting
3. **Environment-Aware**: Different seeds for dev/staging/prod
4. **Real-like Data**: Use realistic sample data
5. **Performance**: Don't seed large datasets in production

## 🗄️ Database Support

The system supports both SQLite and MySQL:

### SQLite (Development)
- Auto-increment: `AUTOINCREMENT`
- DateTime: `DATETIME`
- File-based: `./database.sqlite`

### MySQL (Production)
- Auto-increment: `AUTO_INCREMENT`
- DateTime: `TIMESTAMP`
- Server-based: Configure via environment

## 🔧 Environment Configuration

```env
# Database Type
DB_TYPE=sqlite                    # or mysql

# SQLite
DB_SQLITE_PATH=./database.sqlite

# MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=password
DB_DATABASE=nodejs_backend
```

## 🚨 Troubleshooting

### Common Issues

1. **Migration Already Exists**: Check version numbers are unique
2. **Rollback Failed**: Ensure `down()` method is properly implemented
3. **Type Errors**: Import database types correctly
4. **Connection Issues**: Check database configuration

### Debug Commands

```bash
# Check current migration status
yarn db:migrate:status

# Test rollback (be careful!)
yarn db:migrate:rollback

# Re-run failed migration
yarn db:migrate migrate
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
  // Consider creating new table and copying data
  throw new Error('Cannot rollback: SQLite does not support DROP COLUMN');
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

1. **Version Control**: Track all database changes
2. **Team Collaboration**: Share schema changes via code
3. **Environment Consistency**: Same schema across dev/staging/prod
4. **Rollback Capability**: Safely undo changes if needed
5. **Automated Deployment**: Migrations run automatically
6. **Audit Trail**: See what changed and when

This migration system ensures your database schema is properly versioned, tracked, and can be safely deployed across different environments! 🚀 