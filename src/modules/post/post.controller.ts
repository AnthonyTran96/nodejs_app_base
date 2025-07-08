import { Service } from '@/core/container';
import { NotFoundError } from '@/middleware/error-handler';
import { CreatePostRequest, PostFilter } from '@/models/post.model';
import { AuthenticatedRequest, PaginationOptions } from '@/types/common';
import { ResponseUtil } from '@/utils/response';
import { NextFunction, Response } from 'express';
import { PostService } from './post.service';

@Service('PostController')
export class PostController {
  constructor(private readonly postService: PostService) {}

  async getPosts(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, sortBy, sortOrder, title, content, published, authorName } = req.query;

      const filters: PostFilter = {
        title: title as string,
        content: content as string,
        authorName: authorName as string,
      };

      if (['true', 'false'].includes(`${published}`)) filters.published = Boolean(published);

      const options: PaginationOptions = {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'ASC' | 'DESC',
      };

      const result = await this.postService.findByFilter(filters, options);

      ResponseUtil.successWithPagination(res, result, 'Posts retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getPostById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const post = await this.postService.findById(Number(id));

      if (!post) {
        throw new NotFoundError('Post not Found');
      }

      ResponseUtil.success(res, post, 'Post retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async createPost(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const postData: CreatePostRequest = req.body;

      const post = await this.postService.create(postData);

      ResponseUtil.success(res, post, 'Post created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async updatePost(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const postData = req.body;

      const post = await this.postService.update(Number(id), postData);

      ResponseUtil.success(res, post, 'Post updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deletePost(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const post = await this.postService.delete(Number(id));

      ResponseUtil.success(res, post, 'Post deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
