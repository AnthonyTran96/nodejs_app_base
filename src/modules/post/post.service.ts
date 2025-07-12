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
import { PaginatedResult, PaginationOptions } from '@/types/common';
import { AdvancedFilter, FieldFilter } from '@/types/filter';
import { PostRepository } from './post.repository';
import { PostWebSocketPlugin } from './websocket/post-websocket.plugin';

@Service('PostService')
export class PostService {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly postWebSocketPlugin: PostWebSocketPlugin
  ) {}

  async findByFilter(
    filter: PostFilter = {},
    options?: PaginationOptions
  ): Promise<PaginatedResult<FullPostResponse>> {
    const filters: AdvancedFilter<Post> = {};
    if (filter.content) {
      filters.content = { op: 'like', value: `%${filter.content}%` } as FieldFilter;
    }
    if (typeof filter.published === 'boolean') {
      filters.published = filter.published;
    }
    if (filter.title) {
      filters.title = { op: 'like', value: `%${filter.title}%` } as FieldFilter;
    }
    if (filter.authorName) {
      filters.authorName = { op: 'like', value: `%${filter.authorName}%` } as FieldFilter;
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
    const response = this.toPostResponse(post);

    // Get author name for WebSocket notification
    const authorName = await this.getAuthorName(post.authorId);

    // Send WebSocket notification using injected plugin
    await this.postWebSocketPlugin.notifyPostCreated(response, authorName);

    return response;
  }

  async update(id: number, updateData: UpdatePostRequest): Promise<PostResponse> {
    const existingPost = await this.postRepository.findById(id);
    if (!existingPost) {
      throw new NotFoundError('Post not found');
    }

    const post = await this.postRepository.update(id, updateData);
    if (!post) {
      throw new InternalServerError('Cannot update Post ');
    }

    const response = this.toPostResponse(post);

    // Get author name for WebSocket notification
    const authorName = await this.getAuthorName(post.authorId);

    // Send WebSocket notification using injected plugin
    await this.postWebSocketPlugin.notifyPostUpdated(response, authorName);

    return response;
  }

  async delete(id: number): Promise<PostResponse> {
    // Get post info before deletion for WebSocket notification
    const existingPost = await this.postRepository.findById(id);
    if (!existingPost) {
      throw new NotFoundError('Post not found');
    }

    const success = await this.postRepository.delete(id);
    if (!success) {
      throw new InternalServerError('Cannot delete Post');
    }

    const response = this.toPostResponse(existingPost);

    const authorName = await this.getAuthorName(existingPost.authorId);

    // Send WebSocket notification using injected plugin
    await this.postWebSocketPlugin.notifyPostDeleted(existingPost, authorName);

    return response;
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

  private async getAuthorName(authorId: number): Promise<string> {
    // For now, we can use a simple approach - get the author name from users table
    // In a real application, you might want to inject UserRepository or use a different approach
    // This is a temporary solution to maintain the dependency injection pattern
    return `User ${authorId}`; // Placeholder - in production, this should fetch from UserRepository
  }
}
