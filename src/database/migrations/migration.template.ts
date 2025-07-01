import { DatabaseConnection } from '@/database/connection';
import { Migration } from './migration.interface';
import { config } from '@/config/environment';

export class TemplateMigration implements Migration {
  readonly version = '00X'; // Change to next version number (e.g., '002', '003', etc.)
  readonly name = 'template_migration'; // Change to descriptive name

  private dbConnection: DatabaseConnection;

  constructor() {
    this.dbConnection = DatabaseConnection.getInstance();
  }

  async up(): Promise<void> {
    const isMySQL = config.database.type === 'mysql';
    
    // Write your migration logic here
    // Example: Create table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS example_table (
        id INTEGER PRIMARY KEY ${isMySQL ? 'AUTO_INCREMENT' : 'AUTOINCREMENT'},
        name VARCHAR(255) NOT NULL,
        created_at ${isMySQL ? 'TIMESTAMP' : 'DATETIME'} DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await this.dbConnection.execute(createTableSQL);

    // Example: Add index
    // await this.dbConnection.execute('CREATE INDEX IF NOT EXISTS idx_example_name ON example_table(name)');
  }

  async down(): Promise<void> {
    // Write rollback logic here
    // Example: Drop table
    await this.dbConnection.execute('DROP TABLE IF EXISTS example_table');

    // Example: Drop index
    // await this.dbConnection.execute('DROP INDEX IF EXISTS idx_example_name');
  }
}

/*
MIGRATION CREATION STEPS:

1. Copy this file to a new file with format: XXX_descriptive_name.ts
   Example: 002_add_posts_table.ts

2. Update the version number (must be unique and sequential)
   Example: readonly version = '002';

3. Update the migration name
   Example: readonly name = 'add_posts_table';

4. Implement the up() method with your changes
   - Create tables, add columns, create indexes, etc.

5. Implement the down() method to reverse the changes
   - Drop tables, remove columns, drop indexes, etc.

6. Register the migration in src/database/migrations/index.ts:
   import { YourMigration } from './XXX_your_migration';
   // Add to registerMigrations function:
   migrationManager.registerMigration(new YourMigration());

7. Run the migration:
   yarn db:migrate

NOTES:
- Always test both up() and down() methods
- Use IF NOT EXISTS and IF EXISTS for safety
- Consider database type differences (MySQL vs SQLite)
- Make migrations atomic (use transactions when needed)
- Never modify existing migrations that have been run in production
*/ 