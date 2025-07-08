import { config } from '@/config/environment';
import { DatabaseConnection } from '@/database/connection';
import { Migration } from './migration.interface';

export class CreatePostsTableMigration implements Migration {
  readonly version = '002';
  readonly name = 'create_posts_table';

  private dbConnection: DatabaseConnection;

  constructor() {
    this.dbConnection = DatabaseConnection.getInstance();
  }

  async up(): Promise<void> {
    const isPostgreSQL = config.database.type === 'postgresql';

    const createPostsTable = `
      CREATE TABLE IF NOT EXISTS posts (
        id ${isPostgreSQL ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
        title VARCHAR(255) NOT NULL,
        content TEXT,
        author_id INTEGER NOT NULL,
        published BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `;

    await this.dbConnection.execute(createPostsTable);

    if (isPostgreSQL) {
      await this.dbConnection.execute(`
        CREATE TRIGGER update_posts_updated_at
        BEFORE UPDATE ON posts
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
      `);
    }

    await this.dbConnection.execute(
      'CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id)'
    );
  }

  async down(): Promise<void> {
    const isPostgreSQL = config.database.type === 'postgresql';

    if (isPostgreSQL) {
      await this.dbConnection.execute('DROP TRIGGER IF EXISTS update_posts_updated_at ON posts');
    }

    await this.dbConnection.execute('DROP INDEX IF EXISTS idx_posts_author_id');
    await this.dbConnection.execute('DROP TABLE IF EXISTS posts');
  }
}
