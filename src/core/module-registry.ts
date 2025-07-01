import { Container } from '@/core/container';
import { logger } from '@/utils/logger';

export interface ModuleRegistration {
  name: string;
  register: (container: Container) => Promise<void> | void;
}

export class ModuleRegistry {
  private static modules: ModuleRegistration[] = [];

  static registerModule(module: ModuleRegistration): void {
    this.modules.push(module);
    logger.debug(`📦 Module registered: ${module.name}`);
  }

  static async initializeAllModules(container: Container): Promise<void> {
    logger.info('🚀 Initializing modules...');

    for (const module of this.modules) {
      try {
        await module.register(container);
        logger.debug(`✅ Module initialized: ${module.name}`);
      } catch (error) {
        logger.error(`❌ Failed to initialize module ${module.name}:`, error);
        throw error;
      }
    }

    logger.info(`✅ All modules initialized (${this.modules.length} modules)`);
  }

  static getRegisteredModules(): string[] {
    return this.modules.map(m => m.name);
  }
}
