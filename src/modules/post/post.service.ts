import { Service } from '@/core/container';
import { InternalServerError, NotFoundError } from '@/middleware/error-handler';
import {
  CreatePostRequest,
  FullPost,
  FullPostResponse,
  Post,
  PostFilter,
  PostResponse,
  UpdatePostRequest,
} from '@/models/post.model';
import { WebSocketService } from '@/modules/websocket/websocket.service';
import { PaginatedResult, PaginationOptions } from '@/types/common';
import { logger } from '@/utils/logger';
import { PostRepository } from './post.repository';

@Service('PostService')
export class PostService {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly webSocketService: WebSocketService
  ) {}

  async findByFilter(
    filter: PostFilter = {},
    options?: PaginationOptions
  ): Promise<PaginatedResult<FullPostResponse>> {
    const filters: any = {};
    if (filter.content) {
      filters.content = { op: 'like', value: `%${filter.content}%` };
    }
    if (typeof filter.published === 'boolean') {
      filters.published = filter.published;
    }
    if (filter.title) {
      filters.title = { op: 'like', value: `%${filter.title}%` };
    }
    if (filter.authorName) {
      filters.authorName = { op: 'like', value: `%${filter.authorName}%` };
    }

    const result = await this.postRepository.findFullPosts(filters, options);

    return {
      data: result.data.map(post => this.toFullPostResponse(post)),
      meta: result.meta,
    };
  }

  async findById(id: number): Promise<FullPostResponse | null> {
    const post = await this.postRepository.findFullPostById(id);
    return post ? this.toFullPostResponse(post) : null;
  }

  async create(postData: CreatePostRequest): Promise<PostResponse> {
    const post = await this.postRepository.create(postData);
    const postResponse = this.toPostResponse(post);

    try {
      // Get author information for WebSocket notification
      const fullPost = await this.postRepository.findFullPostById(post.id);
      if (fullPost) {
        await this.webSocketService.notifyPostCreated(postResponse, fullPost.author.name);
        logger.debug('WebSocket notification sent for new post', { postId: post.id });
      }
    } catch (error) {
      // Don't fail the operation if WebSocket notification fails
      logger.warn('Failed to send WebSocket notification for new post', {
        postId: post.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return postResponse;
  }

  async update(id: number, postData: UpdatePostRequest): Promise<PostResponse> {
    const existingPost = await this.postRepository.findById(id);
    if (!existingPost) {
      throw new NotFoundError('Post not found');
    }

    const updatedPost = await this.postRepository.update(id, postData);
    if (!updatedPost) {
      throw new NotFoundError('Post not found');
    }

    const postResponse = this.toPostResponse(updatedPost);

    try {
      // Get author information for WebSocket notification
      const fullPost = await this.postRepository.findFullPostById(id);
      if (fullPost) {
        await this.webSocketService.notifyPostUpdated(postResponse, fullPost.author.name);
        logger.debug('WebSocket notification sent for updated post', { postId: id });
      }
    } catch (error) {
      // Don't fail the operation if WebSocket notification fails
      logger.warn('Failed to send WebSocket notification for updated post', {
        postId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return postResponse;
  }

  async delete(id: number): Promise<PostResponse> {
    const existingFullPost = await this.postRepository.findFullPostById(id);

    if (!existingFullPost) {
      throw new NotFoundError('Post not found');
    }

    const status = await this.postRepository.delete(id);
    if (!status) {
      throw new InternalServerError('Cannot delete Post');
    }

    const postResponse = this.toPostResponse(existingFullPost);

    try {
      await this.webSocketService.notifyPostDeleted(id, existingFullPost.author.name);
      logger.debug('WebSocket notification sent for deleted post', { postId: id });
    } catch (error) {
      // Don't fail the operation if WebSocket notification fails
      logger.warn('Failed to send WebSocket notification for deleted post', {
        postId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return postResponse;
  }

  private toPostResponse(post: Post): PostResponse {
    return {
      id: post.id,
      title: post.title,
      content: post.content,
      authorId: post.authorId,
      published: post.published,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }

  private toFullPostResponse(post: FullPost): FullPostResponse {
    return {
      id: post.id,
      title: post.title,
      content: post.content,
      author: {
        id: post.author.id,
        email: post.author.email,
        name: post.author.name,
        role: post.author.role,
        createdAt: post.author.createdAt,
        updatedAt: post.author.updatedAt,
      },
      published: post.published,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }
}
