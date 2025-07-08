import { User, UserResponse } from './user.model';

export interface Post {
  id: number;
  title: string;
  content: string;
  authorId: number;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FullPost extends Post {
  author: User;
}

export interface CreatePostRequest {
  title: string;
  content: string;
  authorId: number;
  published?: boolean;
}

export interface UpdatePostRequest {
  title?: string;
  content?: string;
  published?: boolean;
}

export interface PostResponse {
  id: number;
  title: string;
  content: string;
  authorId: number;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FullPostResponse {
  id: number;
  title: string;
  content: string;
  author: UserResponse;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostFilter {
  title?: string;
  content?: string;
  published?: boolean;
  authorName?: string;
}
