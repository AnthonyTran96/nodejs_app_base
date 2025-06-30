/* eslint-disable no-console */
import { DatabaseConnection } from '@/database/connection';
import { HashUtil } from '@/utils/hash';

async function createSampleUser(): Promise<void> {
  const dbConnection = DatabaseConnection.getInstance();
  await dbConnection.initialize();

  // Create sample admin user
  const hashedPassword = await HashUtil.hash('admin123');

  await dbConnection.execute(
    `INSERT OR REPLACE INTO users (email, password, name, role) VALUES (?, ?, ?, ?)`,
    ['admin@example.com', hashedPassword, 'Admin User', 'admin']
  );

  // Create sample regular user
  const hashedUserPassword = await HashUtil.hash('user123');

  await dbConnection.execute(
    `INSERT OR REPLACE INTO users (email, password, name, role) VALUES (?, ?, ?, ?)`,
    ['user@example.com', hashedUserPassword, 'Regular User', 'user']
  );

  console.log('✅ Sample users created successfully!');
  console.log('Admin: admin@example.com / admin123');
  console.log('User: user@example.com / user123');

  await dbConnection.close();
}

void createSampleUser();
