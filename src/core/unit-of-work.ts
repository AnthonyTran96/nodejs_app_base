import { DatabaseConnection } from '../database/connection';
import { BaseRepository } from '../repositories/base.repository';

export class UnitOfWork {
  private readonly dbConnection: DatabaseConnection;
  private readonly repositories = new Map<string, BaseRepository<unknown>>();
  private isTransactionActive = false;

  constructor() {
    this.dbConnection = DatabaseConnection.getInstance();
  }

  registerRepository<T>(name: string, repository: BaseRepository<T>): void {
    this.repositories.set(name, repository as BaseRepository<unknown>);
  }

  getRepository<T>(name: string): BaseRepository<T> {
    const repository = this.repositories.get(name);
    if (!repository) {
      throw new Error(`Repository ${name} not found`);
    }
    return repository as BaseRepository<T>;
  }

  async beginTransaction(): Promise<void> {
    if (this.isTransactionActive) {
      throw new Error('Transaction is already active');
    }

    await this.dbConnection.beginTransaction();
    this.isTransactionActive = true;
  }

  async commit(): Promise<void> {
    if (!this.isTransactionActive) {
      throw new Error('No active transaction to commit');
    }

    try {
      await this.dbConnection.commit();
    } finally {
      this.isTransactionActive = false;
    }
  }

  async rollback(): Promise<void> {
    if (!this.isTransactionActive) {
      throw new Error('No active transaction to rollback');
    }

    try {
      await this.dbConnection.rollback();
    } finally {
      this.isTransactionActive = false;
    }
  }

  async executeInTransaction<T>(operation: () => Promise<T>): Promise<T> {
    await this.beginTransaction();
    
    try {
      const result = await operation();
      await this.commit();
      return result;
    } catch (error) {
      await this.rollback();
      throw error;
    }
  }

  isInTransaction(): boolean {
    return this.isTransactionActive;
  }
} 