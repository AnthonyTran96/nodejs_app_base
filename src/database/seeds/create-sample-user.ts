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

  async run(): Promise<void> {
    // Check if users already exist to avoid duplicates
    const existingAdmin = await this.dbConnection.query('SELECT id FROM users WHERE email = ?', [
      'admin@example.com',
    ]);

    const existingUser = await this.dbConnection.query('SELECT id FROM users WHERE email = ?', [
      'user@example.com',
    ]);

    // Create sample admin user if not exists
    if (existingAdmin.rows.length === 0) {
      const hashedPassword = await HashUtil.hash('admin123');

      const insertSQL =
        config.database.type === 'sqlite'
          ? 'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)'
          : 'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)';

      await this.dbConnection.execute(insertSQL, [
        'admin@example.com',
        hashedPassword,
        'Admin User',
        Role.ADMIN,
      ]);

      logger.info('✅ Admin user created: admin@example.com / admin123');
    } else {
      logger.info('ℹ️  Admin user already exists');
    }

    // Create sample regular user if not exists
    if (existingUser.rows.length === 0) {
      const hashedUserPassword = await HashUtil.hash('user123');

      const insertSQL =
        config.database.type === 'sqlite'
          ? 'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)'
          : 'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)';

      await this.dbConnection.execute(insertSQL, [
        'user@example.com',
        hashedUserPassword,
        'Regular User',
        Role.USER,
      ]);

      logger.info('✅ Regular user created: user@example.com / user123');
    } else {
      logger.info('ℹ️  Regular user already exists');
    }

    logger.info('🎯 Sample users seed completed');
  }
}
