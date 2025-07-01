import { DatabaseConnection } from '@/database/connection';
import { MigrationManager } from './migration-manager';
import { CreateUsersTableMigration } from './001_create_users_table';
import { logger } from '@/utils/logger';

// Register all migrations here
export function registerMigrations(migrationManager: MigrationManager): void {
  migrationManager.registerMigration(new CreateUsersTableMigration());

  // Add future migrations here:
  // migrationManager.registerMigration(new NextMigration());
}

export async function runMigrations(): Promise<void> {
  const dbConnection = DatabaseConnection.getInstance();
  await dbConnection.initialize();

  const migrationManager = new MigrationManager();
  registerMigrations(migrationManager);

  // CLI migrations are manual migrations, so force manual = true
  await migrationManager.runPendingMigrations(true);
  await dbConnection.close();
}

export async function rollbackMigration(): Promise<void> {
  const dbConnection = DatabaseConnection.getInstance();
  await dbConnection.initialize();

  const migrationManager = new MigrationManager();
  registerMigrations(migrationManager);

  await migrationManager.rollbackLastMigration();
  await dbConnection.close();
}

export async function migrationStatus(): Promise<void> {
  const dbConnection = DatabaseConnection.getInstance();
  await dbConnection.initialize();

  const migrationManager = new MigrationManager();
  registerMigrations(migrationManager);

  await migrationManager.getMigrationStatus();
  await dbConnection.close();
}

// CLI Support - check command line arguments
async function main(): Promise<void> {
  const command = process.argv[2];

  try {
    switch (command) {
      case 'up':
      case 'migrate':
        await runMigrations();
        break;
      case 'down':
      case 'rollback':
        await rollbackMigration();
        break;
      case 'status':
        await migrationStatus();
        break;
      default:
        logger.info('🗄️  Database Migration CLI');
        logger.info('Usage: ts-node src/database/migrations/index.ts [command]');
        logger.info('');
        logger.info('Commands:');
        logger.info('  up, migrate     - Run pending migrations');
        logger.info('  down, rollback  - Rollback last migration');
        logger.info('  status          - Show migration status');
        logger.info('');
        break;
    }
  } catch (error) {
    logger.error('Migration command failed:', error);
    process.exit(1);
  }
}

// Run CLI if this file is executed directly
if (require.main === module) {
  void main();
}
