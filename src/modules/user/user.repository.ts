import { BaseRepository } from '@/core/base.repository';
import { User } from '@/models/user.model';
import { Service } from '@/core/container';
import { Role } from '@/types/role.enum';

@Service('UserRepository')
export class UserRepository extends BaseRepository<User> {
  protected readonly tableName = 'users';

  async findByEmail(email: string): Promise<User | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE email = ${this.createPlaceholder(0)} LIMIT 1`;
    const result = await this.executeQuery<User>(sql, [email]);
    const row = result.rows[0];
    return row ? this.transformDates(row) : null;
  }

  async findByRole(role: Role): Promise<User[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE role = ${this.createPlaceholder(0)}`;
    const result = await this.executeQuery<User>(sql, [role]);
    return result.rows.map(row => this.transformDates(row));
  }

  async emailExists(email: string, excludeId?: number): Promise<boolean> {
    let sql = `SELECT 1 FROM ${this.tableName} WHERE email = ${this.createPlaceholder(0)}`;
    const params: unknown[] = [email];

    if (excludeId) {
      sql += ` AND id != ${this.createPlaceholder(1)}`;
      params.push(excludeId);
    }

    const result = await this.executeQuery(sql, params);
    return result.rows.length > 0;
  }

  async updateLastLogin(userId: number): Promise<void> {
    const sql = `
      UPDATE ${this.tableName}
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = ${this.createPlaceholder(0)}
    `;
    await this.db.execute(sql, [userId]);
  }

  async countByRole(role: Role): Promise<number> {
    const sql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE role = ${this.createPlaceholder(0)}`;
    const result = await this.executeQuery<{ count: number }>(sql, [role]);
    return result.rows[0]?.count || 0;
  }
}
