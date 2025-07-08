import { BaseRepository } from '@/core/base.repository';
import { Service } from '@/core/container';
import { User } from '@/models/user.model';
import { RepositorySchema } from '@/types/repository';
import { Role } from '@/types/role.enum';
import { QueryBuilder } from '@/utils/query-builder';

@Service('UserRepository')
export class UserRepository extends BaseRepository<User> {
  protected readonly tableName = 'users';
  protected override readonly schema: RepositorySchema<User> = {
    createdAt: 'date', // auto-mapped to created_at
    updatedAt: 'date', // auto-mapped to updated_at
    role: { type: 'enum', enumType: Role },
  };

  async findByEmail(email: string): Promise<User | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE email = ${QueryBuilder.createPlaceholder(0)} LIMIT 1`;
    const result = await this.executeQuery<User>(sql, [email]);
    const row = result.rows[0];
    return row ? this.transformRow(row) : null;
  }

  async findByRole(role: Role): Promise<User[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE role = ${QueryBuilder.createPlaceholder(0)}`;
    const result = await this.executeQuery<User>(sql, [role]);
    return result.rows.map(row => this.transformRow(row));
  }

  async emailExists(email: string, excludeId?: number): Promise<boolean> {
    let sql = `SELECT 1 FROM ${this.tableName} WHERE email = ${QueryBuilder.createPlaceholder(0)}`;
    const params: unknown[] = [email];

    if (excludeId) {
      sql += ` AND id != ${QueryBuilder.createPlaceholder(1)}`;
      params.push(excludeId);
    }

    const result = await this.executeQuery(sql, params);
    return result.rows.length > 0;
  }

  async updateLastLogin(userId: number): Promise<void> {
    const sql = `
      UPDATE ${this.tableName}
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = ${QueryBuilder.createPlaceholder(0)}
    `;
    await this.db.execute(sql, [userId]);
  }

  async countByRole(role: Role): Promise<number> {
    const sql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE role = ${QueryBuilder.createPlaceholder(0)}`;
    const result = await this.executeQuery<{ count: number }>(sql, [role]);
    return result.rows[0]?.count || 0;
  }
}
