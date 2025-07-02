import { DatabaseConnection } from '@/database/connection';
import { Migration } from './migration.interface';
import { config } from '@/config/environment';

export class CreateUsersTableMigration implements Migration {
  readonly version = '001';
  readonly name = 'create_users_table';

  private dbConnection: DatabaseConnection;

  constructor() {
    this.dbConnection = DatabaseConnection.getInstance();
  }

  async up(): Promise<void> {
    const isPostgreSQL = config.database.type === 'postgresql';

    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id ${isPostgreSQL ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await this.dbConnection.execute(createUsersTable);

    // PostgreSQL doesn't support ON UPDATE CURRENT_TIMESTAMP, so we handle it in application code
    // Create trigger for updated_at if using PostgreSQL
    if (isPostgreSQL) {
      const createUpdateTrigger = `
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ language 'plpgsql';
        
        CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
      `;

      await this.dbConnection.execute(createUpdateTrigger);
    }

    // Create index for email (performance optimization)
    await this.dbConnection.execute('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');

    // Create index for role (for authorization queries)
    await this.dbConnection.execute('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)');
  }

  async down(): Promise<void> {
    const isPostgreSQL = config.database.type === 'postgresql';

    // Drop trigger and function if PostgreSQL
    if (isPostgreSQL) {
      await this.dbConnection.execute('DROP TRIGGER IF EXISTS update_users_updated_at ON users');
      await this.dbConnection.execute('DROP FUNCTION IF EXISTS update_updated_at_column()');
    }

    // Drop indexes first
    await this.dbConnection.execute('DROP INDEX IF EXISTS idx_users_email');
    await this.dbConnection.execute('DROP INDEX IF EXISTS idx_users_role');

    // Drop table
    await this.dbConnection.execute('DROP TABLE IF EXISTS users');
  }
}
