import { BaseRepository } from '@/core/base.repository';
import { Service } from '@/core/container';
import { FullPost, Post, PostFilter } from '@/models/post.model';
import { PaginatedResult, PaginationOptions } from '@/types/common';
import { AdvancedFilter } from '@/types/filter';
import { RepositorySchema } from '@/types/repository';
import { QueryBuilder } from '@/utils/query-builder';

@Service('PostRepository')
export class PostRepository extends BaseRepository<Post> {
  protected readonly tableName = 'posts';
  protected override readonly schema: RepositorySchema<Post> = {
    published: 'boolean',
    createdAt: 'date',
    updatedAt: 'date',
    authorId: 'number', // just for type consistency
  };

  // Method to find posts with full detail information
  async findFullPosts(
    filters: AdvancedFilter<PostFilter> = {},
    options?: PaginationOptions
  ): Promise<PaginatedResult<FullPost>> {
    let sql = `
      SELECT 
        p.id as post_id, p.title, p.content, p.author_id, p.published, p.created_at as createdAt, p.updated_at as updatedAt,
        u.id as author_id, u.email as author_email, u.name as author_name, u.role as author_role, 
        u.created_at as author_createdAt, u.updated_at as author_updatedAt
      FROM posts p
      JOIN users u ON p.author_id = u.id
    `;

    const filterMapping = {
      authorName: { tableAlias: 'u', column: 'name' },
      title: { tableAlias: 'p', column: 'title' },
      content: { tableAlias: 'p', column: 'content' },
      published: { tableAlias: 'p', column: 'published' },
      // authorId: { tableAlias: 'p', column: 'author_id' },
      // id: { tableAlias: 'p', column: 'id' },
    };

    const optionsEngine = {
      tableAlias: 'p',
      filterMapping,
    };

    const { where, params } = QueryBuilder.buildFilterWhereClause(filters, optionsEngine);

    if (where) {
      sql += ' WHERE ' + where;
    }

    // Sorting
    if (options?.sortBy) {
      const order = options.sortOrder || 'ASC';
      sql += ` ORDER BY p.${options.sortBy} ${order}`;
    }

    // Count total
    let countSql = `
      SELECT COUNT(*) as total 
      FROM posts p
      JOIN users u ON p.author_id = u.id
    `;
    if (where) {
      countSql += ' WHERE ' + where;
    }

    const countResult = await this.db.query<{ total: number }>(countSql, params);
    const total = countResult.rows[0]?.total || 0;

    // Pagination
    if (options?.limit && options?.page) {
      const offset = (options.page - 1) * options.limit;
      const limitPlaceholder = QueryBuilder.createPlaceholder(params.length);
      const offsetPlaceholder = QueryBuilder.createPlaceholder(params.length + 1);
      sql += ` LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`;
      params.push(options.limit, offset);
    }

    const result = await this.db.query<any>(sql, params);

    // Transform the results to FullPost format
    const transformedData = result.rows.map(row => {
      const post: FullPost = {
        id: row.post_id,
        title: row.title,
        content: row.content,
        authorId: row.author_id,
        published: Boolean(row.published),
        createdAt: new Date(row.createdat),
        updatedAt: new Date(row.updatedat),
        author: {
          id: row.author_id,
          email: row.author_email,
          name: row.author_name,
          role: row.author_role,
          createdAt: new Date(row.author_createdat),
          updatedAt: new Date(row.author_updatedat),
          password: '', // We don't expose password
        },
      };
      return post;
    });

    return {
      data: transformedData,
      meta: {
        page: options?.page || 1,
        limit: options?.limit || transformedData.length,
        total,
        totalPages: options?.limit ? Math.ceil(total / options.limit) : 1,
      },
    };
  }

  // Method to find a single post by ID with full detail information
  async findFullPostById(id: number): Promise<FullPost | null> {
    const result = await this.findFullPosts({ id }, { page: 1, limit: 1 });
    return result.data[0] || null;
  }
}
