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
    const isMySQL = config.database.type === 'mysql';
    
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY ${isMySQL ? 'AUTO_INCREMENT' : 'AUTOINCREMENT'},
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at ${isMySQL ? 'TIMESTAMP' : 'DATETIME'} DEFAULT CURRENT_TIMESTAMP,
        updated_at ${isMySQL ? 'TIMESTAMP' : 'DATETIME'} DEFAULT CURRENT_TIMESTAMP ${isMySQL ? 'ON UPDATE CURRENT_TIMESTAMP' : ''}
      )
    `;

    await this.dbConnection.execute(createUsersTable);

    // Create index for email (performance optimization)
    await this.dbConnection.execute('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    
    // Create index for role (for authorization queries)
    await this.dbConnection.execute('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)');
  }

  async down(): Promise<void> {
    // Drop indexes first
    await this.dbConnection.execute('DROP INDEX IF EXISTS idx_users_email');
    await this.dbConnection.execute('DROP INDEX IF EXISTS idx_users_role');
    
    // Drop table
    await this.dbConnection.execute('DROP TABLE IF EXISTS users');
  }
} 