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
import { PostRepository } from './post.repository';

@Service('PostService')
export class PostService {
  constructor(private readonly postRepository: PostRepository) {}

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

    return this.toPostResponse(post);
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

    return this.toPostResponse(updatedPost);
  }

  async delete(id: number): Promise<PostResponse> {
    const existingFullPost = await this.postRepository.findById(id);

    if (!existingFullPost) {
      throw new NotFoundError('Post not found');
    }

    const status = await this.postRepository.delete(id);
    if (!status) {
      throw new InternalServerError('Cannot delete Post');
    }

    return this.toPostResponse(existingFullPost);
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
