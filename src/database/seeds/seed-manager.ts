import { Seed } from './seed.interface';
import { logger } from '@/utils/logger';

export class SeedManager {
  private seeds: Seed[] = [];

  constructor() {
    // DatabaseConnection is managed externally
  }

  registerSeed(seed: Seed): void {
    this.seeds.push(seed);
    // Sort by order to ensure proper execution sequence
    this.seeds.sort((a, b) => a.order - b.order);
  }

  async runAllSeeds(): Promise<void> {
    if (this.seeds.length === 0) {
      logger.info('No seeds to run');
      return;
    }

    logger.info(`🌱 Running ${this.seeds.length} seeds...`);

    for (const seed of this.seeds) {
      try {
        logger.info(`⏳ Running seed: ${seed.name}`);
        await seed.run();
        logger.info(`✅ Seed completed: ${seed.name}`);
      } catch (error) {
        logger.error(`❌ Seed failed: ${seed.name}`, error);
        throw error;
      }
    }

    logger.info('✅ All seeds completed successfully');
  }

  async runSeed(seedName: string): Promise<void> {
    const seed = this.seeds.find(s => s.name === seedName);

    if (!seed) {
      throw new Error(`Seed "${seedName}" not found`);
    }

    try {
      logger.info(`⏳ Running seed: ${seed.name}`);
      await seed.run();
      logger.info(`✅ Seed completed: ${seed.name}`);
    } catch (error) {
      logger.error(`❌ Seed failed: ${seed.name}`, error);
      throw error;
    }
  }

  listSeeds(): void {
    logger.info('📋 Available Seeds:');

    if (this.seeds.length === 0) {
      logger.info('  No seeds registered');
      return;
    }

    for (const seed of this.seeds) {
      logger.info(`  ${seed.order}. ${seed.name}`);
    }
  }
}
