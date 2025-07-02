/* eslint-disable no-console */
// Console logging is appropriate for test setup and teardown

import { DatabaseConnection } from '@/database/connection';
import { MigrationManager } from '@/database/migrations/migration-manager';
import { registerMigrations } from '@/database/migrations';

// Global test setup
beforeAll(async () => {
  try {
    // Initialize database connection first
    const dbConnection = DatabaseConnection.getInstance();
    await dbConnection.initialize();
    
    // Run migrations for test environment
    const migrationManager = new MigrationManager();
    registerMigrations(migrationManager);
    await migrationManager.runPendingMigrations();
    
    console.log('✅ Test database initialized with migrations');
  } catch (error) {
    console.error('❌ Failed to initialize test database:', error);
    throw error;
  }
});

afterAll(async () => {
  try {
    // Clean up database connection
    const dbConnection = DatabaseConnection.getInstance();
    await dbConnection.close();
    console.log('✅ Test database connection closed');
  } catch (error) {
    console.error('❌ Failed to close test database:', error);
  }
});