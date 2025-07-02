import { DatabaseConnection } from '@/database/connection';
import { Migration, MigrationRecord } from './migration.interface';
import { logger } from '@/utils/logger';
import { config } from '@/config/environment';

export class MigrationManager {
  private dbConnection: DatabaseConnection;
  private migrations: Migration[] = [];

  constructor() {
    this.dbConnection = DatabaseConnection.getInstance();
  }

  // Helper method for database-specific placeholders
  private createPlaceholder(index: number): string {
    if (config.database.type === 'postgresql') {
      return `$${index + 1}`;
    } else {
      return '?';
    }
  }

  registerMigration(migration: Migration): void {
    this.migrations.push(migration);
    // Sort by version to ensure proper execution order
    this.migrations.sort((a, b) => a.version.localeCompare(b.version));
  }

  async initialize(): Promise<void> {
    // Create migrations table if it doesn't exist
    // Both PostgreSQL and SQLite use same TIMESTAMP syntax
    const createMigrationsTable = `
      CREATE TABLE IF NOT EXISTS migrations (
        version VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await this.dbConnection.execute(createMigrationsTable);
    logger.info('✅ Migrations table initialized');
  }

  /**
   * Check for pending migrations without running them
   */
  async checkPendingMigrations(): Promise<Migration[]> {
    await this.initialize();

    const executedMigrations = await this.getExecutedMigrations();
    const executedVersions = new Set(executedMigrations.map(m => m.version));

    const pendingMigrations = this.migrations.filter(
      migration => !executedVersions.has(migration.version)
    );

    if (pendingMigrations.length > 0) {
      logger.warn(`⚠️  Found ${pendingMigrations.length} pending migrations:`);
      for (const migration of pendingMigrations) {
        logger.warn(`   📋 ${migration.version} - ${migration.name}`);
      }

      if (config.nodeEnv === 'production') {
        logger.warn('🚨 PRODUCTION: Run migrations manually before starting app');
        logger.warn('   Command: yarn db:migrate');
      } else {
        logger.info('💡 Run migrations with: yarn db:migrate');
      }
    } else {
      logger.info('✅ No pending migrations');
    }

    return pendingMigrations;
  }

  async runPendingMigrations(forceManual: boolean = false): Promise<void> {
    // 🔒 Safety check for production AUTO-RUN (but allow manual)
    if (config.nodeEnv === 'production' && !config.migration.autoRun && !forceManual) {
      logger.error('🚨 Auto-migration is disabled in production for safety');
      logger.error('   Use manual migration command: npm run migrate:prod');
      throw new Error('Auto-migration disabled in production environment');
    }

    await this.initialize();

    const pendingMigrations = await this.checkPendingMigrations();

    if (pendingMigrations.length === 0) {
      logger.info('✅ No pending migrations to run');
      return;
    }

    // 🔒 Production safety warning
    if (config.nodeEnv === 'production') {
      logger.warn('🚨 RUNNING MIGRATIONS IN PRODUCTION ENVIRONMENT');
      logger.warn('   Ensure you have a recent database backup!');
    }

    logger.info(`🚀 Running ${pendingMigrations.length} pending migrations...`);

    for (const migration of pendingMigrations) {
      await this.runSingleMigration(migration);
    }

    logger.info('✅ All migrations completed successfully');
  }

  private async runSingleMigration(migration: Migration): Promise<void> {
    const startTime = Date.now();

    try {
      await this.dbConnection.beginTransaction();

      logger.info(`⏳ Running migration: ${migration.version} - ${migration.name}`);

      // 🕐 Run migration with timeout
      await this.runWithTimeout(
        migration.up.bind(migration),
        config.migration.timeoutMs,
        `Migration ${migration.version} timed out`
      );

      // Record migration execution with database-agnostic placeholders
      const insertSQL = `INSERT INTO migrations (version, name) VALUES (${this.createPlaceholder(0)}, ${this.createPlaceholder(1)})`;
      await this.dbConnection.execute(insertSQL, [migration.version, migration.name]);

      await this.dbConnection.commit();

      const duration = Date.now() - startTime;
      logger.info(`✅ Migration completed: ${migration.version} (${duration}ms)`);
    } catch (error) {
      await this.dbConnection.rollback();
      const duration = Date.now() - startTime;
      logger.error(`❌ Migration failed: ${migration.version} (${duration}ms)`, error);
      throw error;
    }
  }

  private async runWithTimeout<T>(
    promise: () => Promise<T>,
    timeoutMs: number,
    timeoutMessage: string
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    });

    return Promise.race([promise(), timeoutPromise]);
  }

  async rollbackLastMigration(): Promise<void> {
    // 🔒 Production safety check
    if (config.nodeEnv === 'production' && config.migration.requireManualApproval) {
      logger.warn('🚨 ROLLBACK IN PRODUCTION - This operation can cause data loss!');
      logger.warn('   Ensure you understand the consequences before proceeding');
    }

    await this.initialize();

    const executedMigrations = await this.getExecutedMigrations();
    if (executedMigrations.length === 0) {
      logger.info('ℹ️  No migrations to rollback');
      return;
    }

    // Get the last executed migration
    const lastMigration = executedMigrations[executedMigrations.length - 1];
    if (!lastMigration) {
      logger.info('ℹ️  No migrations to rollback');
      return;
    }

    const migration = this.migrations.find(m => m.version === lastMigration.version);
    if (!migration) {
      throw new Error(`Migration ${lastMigration.version} not found in registered migrations`);
    }

    const startTime = Date.now();

    try {
      await this.dbConnection.beginTransaction();

      logger.info(`⏳ Rolling back migration: ${migration.version} - ${migration.name}`);

      // 🕐 Run rollback with timeout
      await this.runWithTimeout(
        migration.down.bind(migration),
        config.migration.timeoutMs,
        `Rollback ${migration.version} timed out`
      );

      // Remove migration record with database-agnostic placeholder
      const deleteSQL = `DELETE FROM migrations WHERE version = ${this.createPlaceholder(0)}`;
      await this.dbConnection.execute(deleteSQL, [migration.version]);

      await this.dbConnection.commit();

      const duration = Date.now() - startTime;
      logger.info(`✅ Migration rolled back: ${migration.version} (${duration}ms)`);
    } catch (error) {
      await this.dbConnection.rollback();
      const duration = Date.now() - startTime;
      logger.error(`❌ Rollback failed: ${migration.version} (${duration}ms)`, error);
      throw error;
    }
  }

  async getExecutedMigrations(): Promise<MigrationRecord[]> {
    const result = await this.dbConnection.query<MigrationRecord>(
      'SELECT version, name, executed_at FROM migrations ORDER BY version ASC'
    );
    return result.rows;
  }

  async getMigrationStatus(): Promise<void> {
    await this.initialize();

    const executedMigrations = await this.getExecutedMigrations();
    const executedVersions = new Set(executedMigrations.map(m => m.version));

    logger.info('📊 Migration Status:');
    logger.info(`   Environment: ${config.nodeEnv}`);
    logger.info(`   Auto-run: ${config.migration.autoRun ? '✅ Enabled' : '❌ Disabled'}`);
    logger.info(
      `   Manual approval: ${config.migration.requireManualApproval ? '✅ Required' : '❌ Not required'}`
    );
    logger.info(`   Timeout: ${config.migration.timeoutMs}ms`);
    logger.info('');

    if (this.migrations.length === 0) {
      logger.info('   No migrations registered');
      return;
    }

    for (const migration of this.migrations) {
      const status = executedVersions.has(migration.version) ? '✅ EXECUTED' : '⏳ PENDING';
      const executedAt = executedMigrations.find(m => m.version === migration.version)?.executed_at;
      const timeInfo = executedAt ? ` (${new Date(executedAt).toISOString()})` : '';
      logger.info(`   ${status} ${migration.version} - ${migration.name}${timeInfo}`);
    }

    const pendingCount = this.migrations.filter(m => !executedVersions.has(m.version)).length;
    logger.info(
      `\n📈 Summary: ${this.migrations.length} total | ${executedMigrations.length} executed | ${pendingCount} pending`
    );
  }
}
