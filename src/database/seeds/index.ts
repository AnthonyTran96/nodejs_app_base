import { DatabaseConnection } from '@/database/connection';
import { SeedManager } from './seed-manager';
import { CreateSampleUsersSeed } from './create-sample-user';
import { logger } from '@/utils/logger';

// Register all seeds here
export function registerSeeds(seedManager: SeedManager): void {
  seedManager.registerSeed(new CreateSampleUsersSeed());

  // Add future seeds here in order:
  // seedManager.registerSeed(new AnotherSeed());
}

export async function runAllSeeds(): Promise<void> {
  const dbConnection = DatabaseConnection.getInstance();
  await dbConnection.initialize();

  const seedManager = new SeedManager();
  registerSeeds(seedManager);

  await seedManager.runAllSeeds();
  await dbConnection.close();
}

export async function runSpecificSeed(seedName: string): Promise<void> {
  const dbConnection = DatabaseConnection.getInstance();
  await dbConnection.initialize();

  const seedManager = new SeedManager();
  registerSeeds(seedManager);

  await seedManager.runSeed(seedName);
  await dbConnection.close();
}

export async function listSeeds(): Promise<void> {
  const seedManager = new SeedManager();
  registerSeeds(seedManager);

  seedManager.listSeeds();
}

// CLI Support - check command line arguments
async function main(): Promise<void> {
  const command = process.argv[2];
  const seedName = process.argv[3];

  try {
    switch (command) {
      case 'run':
      case 'all':
        await runAllSeeds();
        break;
      case 'seed':
        if (!seedName) {
          logger.error('Please specify a seed name');
          logger.info('Usage: ts-node src/database/seeds/index.ts seed [seed-name]');
          process.exit(1);
        }
        await runSpecificSeed(seedName);
        break;
      case 'list':
        await listSeeds();
        break;
      default:
        logger.info('🌱 Database Seed CLI');
        logger.info('Usage: ts-node src/database/seeds/index.ts [command] [options]');
        logger.info('');
        logger.info('Commands:');
        logger.info('  run, all           - Run all seeds');
        logger.info('  seed [seed-name]   - Run specific seed');
        logger.info('  list               - List available seeds');
        logger.info('');
        logger.info('Examples:');
        logger.info('  ts-node src/database/seeds/index.ts run');
        logger.info('  ts-node src/database/seeds/index.ts seed create_sample_users');
        logger.info('  ts-node src/database/seeds/index.ts list');
        logger.info('');
        break;
    }
  } catch (error) {
    logger.error('Seed command failed:', error);
    process.exit(1);
  }
}

// Run CLI if this file is executed directly
if (require.main === module) {
  void main();
}
