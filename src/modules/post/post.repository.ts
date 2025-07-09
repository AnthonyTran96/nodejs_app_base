import { BaseRepository } from '@/core/base.repository';
import { Service } from '@/core/container';
import { FullPost, Post } from '@/models/post.model';
import { User } from '@/models/user.model';
import { PaginatedResult, PaginationOptions } from '@/types/common';
import { AdvancedFilter, FilterMapping, FilterOptions } from '@/types/filter';
import { RepositorySchema } from '@/types/repository';
import { DataTransformer } from '@/utils/data-transformer';
import { QueryBuilder } from '@/utils/query-builder';

@Service('PostRepository')
export class PostRepository extends BaseRepository<Post> {
  protected readonly tableName = 'posts';
  protected override readonly schema: RepositorySchema<Post> = {
    published: 'boolean',
    createdAt: 'date', // auto-mapped to created_at
    updatedAt: 'date', // auto-mapped to updated_at
    authorId: 'integer', // auto-mapped to author_id
  };

  // Method to find posts with full detail information
  async findFullPosts(
    filters: AdvancedFilter<any> = {},
    options?: PaginationOptions
  ): Promise<PaginatedResult<FullPost>> {
    let sql = `
      SELECT 
        p.id as post_id, p.title, p.content, p.author_id, p.published, p.created_at as post_created_at, p.updated_at as post_updated_at,
        u.id as author_id, u.email as author_email, u.name as author_name, u.role as author_role, 
        u.created_at as author_created_at, u.updated_at as author_updated_at
      FROM posts p
      JOIN users u ON p.author_id = u.id
    `;

    const filterMapping: FilterMapping = {
      authorId: { tableAlias: 'u', column: 'id' },
      authorName: { tableAlias: 'u', column: 'name' },
      authorEmail: { tableAlias: 'u', column: 'email' },
      authorRole: { tableAlias: 'u', column: 'role' },
      authorCreatedAt: { tableAlias: 'u', column: 'created_at' },
      authorUpdatedAt: { tableAlias: 'u', column: 'updated_at' },
    };

    const optionsEngine: FilterOptions = {
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

    const countResult = await this.db.query<{ total: string | number }>(countSql, params);
    const total = Number(countResult.rows[0]?.total || 0);

    // Pagination
    if (options?.limit && options?.page) {
      const offset = (options.page - 1) * options.limit;
      const limitPlaceholder = QueryBuilder.createPlaceholder(params.length);
      const offsetPlaceholder = QueryBuilder.createPlaceholder(params.length + 1);
      sql += ` LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`;
      params.push(options.limit, offset);
    }

    const result = await this.db.query<any>(sql, params);

    // Optimized schemas - omit type for fields that don't need transformation
    const postSchema: RepositorySchema<Post> = {
      id: { column: 'post_id' }, // no type needed - already integer from DB
      // title and content: auto-mapped (column names match field names)
      authorId: { column: 'author_id', type: 'integer' },
      published: 'boolean', // auto-mapped to 'published' column
      createdAt: { column: 'post_created_at', type: 'date' },
      updatedAt: { column: 'post_updated_at', type: 'date' },
    };

    const authorSchema: RepositorySchema<User> = {
      id: { column: 'author_id' }, // no type needed - already integer from DB
      name: { column: 'author_name' }, // no type needed - already string from DB
      email: { column: 'author_email' }, // no type needed - already string from DB
      role: { column: 'author_role' }, // no type needed - already string from DB
      createdAt: { column: 'author_created_at', type: 'date' },
      updatedAt: { column: 'author_updated_at', type: 'date' },
      password: { transform: () => '' }, // Custom transform to hide sensitive data
    };

    // Transform the results to FullPost format using DataTransformer
    const transformedData = result.rows.map(row => {
      const post = DataTransformer.transformRow<Post>(row, postSchema);
      const author = DataTransformer.transformRow<User>(row, authorSchema);

      return {
        ...post,
        author,
      } as FullPost;
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
