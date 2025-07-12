import { PostResponse } from '@/models/post.model';
import { EventHandlerMap } from '@/modules/websocket/plugins/websocket-plugin.interface';

// Post-specific server-to-client events
export interface PostServerToClientEvents extends EventHandlerMap {
  postCreated: (data: { post: PostResponse; author: string }) => void;
  postUpdated: (data: { post: PostResponse; author: string }) => void;
  postDeleted: (data: { postId: number; author: string }) => void;
  typing: (data: { postId: number; isTyping: boolean; userId?: number; userName?: string }) => void;
}

// Post-specific client-to-server events
export interface PostClientToServerEvents extends EventHandlerMap {
  subscribeToPost: (postId: number) => void;
  unsubscribeFromPost: (postId: number) => void;
  typing: (data: { postId: number; isTyping: boolean }) => void;
}

// Post-specific event data types
export interface PostNotificationData {
  type: 'created' | 'updated' | 'deleted';
  postId: number;
  authorId: number;
  authorName: string;
  title?: string;
  content?: string;
}

export interface PostTypingData {
  postId: number;
  isTyping: boolean;
  userId: number;
  userName: string;
}
