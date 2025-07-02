import { DatabaseConnection } from '@/database/connection';
import { HashUtil } from '@/utils/hash';
import { Seed } from './seed.interface';
import { logger } from '@/utils/logger';
import { config } from '@/config/environment';
import { Role } from '@/types/role.enum';

export class CreateSampleUsersSeed implements Seed {
  readonly name = 'create_sample_users';
  readonly order = 1;

  private dbConnection: DatabaseConnection;

  constructor() {
    this.dbConnection = DatabaseConnection.getInstance();
  }

  // Helper method for database-specific placeholder
  private createPlaceholder(index: number): string {
    if (config.database.type === 'postgresql') {
      return `$${index + 1}`;
    } else {
      return '?';
    }
  }

  // Helper method to create a user if not exists
  private async createUserIfNotExists(
    email: string,
    password: string,
    name: string,
    role: Role,
    description: string
  ): Promise<void> {
    const existingUser = await this.dbConnection.query(
      `SELECT id FROM users WHERE email = ${this.createPlaceholder(0)}`,
      [email]
    );

    if (existingUser.rows.length === 0) {
      const hashedPassword = await HashUtil.hash(password);
      const insertSQL = `INSERT INTO users (email, password, name, role) VALUES (${this.createPlaceholder(0)}, ${this.createPlaceholder(1)}, ${this.createPlaceholder(2)}, ${this.createPlaceholder(3)})`;

      await this.dbConnection.execute(insertSQL, [email, hashedPassword, name, role]);
      logger.info(`✅ ${description} created: ${email} / ${password}`);
    } else {
      logger.info(`ℹ️  ${description} already exists`);
    }
  }

  async run(): Promise<void> {
    // Create sample admin user
    await this.createUserIfNotExists(
      'admin@example.com',
      'admin123',
      'Admin User',
      Role.ADMIN,
      'Admin user'
    );

    // Create sample regular user
    await this.createUserIfNotExists(
      'user@example.com',
      'user123',
      'Regular User',
      Role.USER,
      'Regular user'
    );

    logger.info('🎯 Sample users seed completed');
  }
}
