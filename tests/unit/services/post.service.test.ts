import { InternalServerError, NotFoundError } from '@/middleware/error-handler';
import { FullPost, Post, PostResponse } from '@/models/post.model';
import { User } from '@/models/user.model';
import { PostRepository } from '@/modules/post/post.repository';
import { PostService } from '@/modules/post/post.service';
import { PostWebSocketPlugin } from '@/modules/post/websocket/post-websocket.plugin';
import { Role } from '@/types/role.enum';

jest.mock('@/modules/post/post.repository');
const mockNotifyPostCreated = jest.fn();
const mockNotifyPostUpdated = jest.fn();
const mockNotifyPostDeleted = jest.fn();

jest.mock('@/modules/post/websocket/post-websocket.plugin', () => {
  return {
    PostWebSocketPlugin: jest.fn().mockImplementation(() => {
      return {
        notifyPostCreated: mockNotifyPostCreated,
        notifyPostUpdated: mockNotifyPostUpdated,
        notifyPostDeleted: mockNotifyPostDeleted,
      };
    }),
  };
});

describe('PostService', () => {
  let postService: PostService;
  let mockPostRepository: jest.Mocked<PostRepository>;
  let mockPostWebSocketPlugin: jest.Mocked<PostWebSocketPlugin>;

  const mockUser: User = {
    id: 1,
    email: 'author@example.com',
    password: 'hashedPassword',
    name: 'Author User',
    role: Role.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPost: Post = {
    id: 1,
    title: 'Test Post',
    content: 'This is a test post.',
    authorId: mockUser.id,
    published: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockFullPost: FullPost = {
    ...mockPost,
    author: mockUser,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Instantiate the service with mocked dependencies
    // The mocks are created by the jest.mock factories above
    mockPostRepository = new (jest.requireMock('@/modules/post/post.repository').PostRepository)();
    mockPostWebSocketPlugin = new (jest.requireMock(
      '@/modules/post/websocket/post-websocket.plugin'
    ).PostWebSocketPlugin)();

    postService = new PostService(mockPostRepository, mockPostWebSocketPlugin);
  });

  describe('findById', () => {
    it('should return a full post response when a post is found', async () => {
      mockPostRepository.findFullPostById.mockResolvedValue(mockFullPost);

      const result = await postService.findById(1);

      expect(mockPostRepository.findFullPostById).toHaveBeenCalledWith(1);
      expect(result).not.toBeNull();
      expect(result?.id).toBe(mockFullPost.id);
      expect(result?.author.id).toBe(mockUser.id);
    });

    it('should return null when a post is not found', async () => {
      mockPostRepository.findFullPostById.mockResolvedValue(null);

      const result = await postService.findById(999);

      expect(mockPostRepository.findFullPostById).toHaveBeenCalledWith(999);
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new post and return a post response', async () => {
      const createData = {
        title: 'New Post',
        content: 'Content of new post',
        authorId: 1,
      };
      const newPost = { ...mockPost, ...createData, id: 2 };
      const expectedResponse: PostResponse = {
        id: newPost.id,
        title: newPost.title,
        content: newPost.content,
        authorId: newPost.authorId,
        published: newPost.published,
        createdAt: newPost.createdAt,
        updatedAt: newPost.updatedAt,
      };

      mockPostRepository.create.mockResolvedValue(newPost);

      const result = await postService.create(createData);

      expect(mockPostRepository.create).toHaveBeenCalledWith(createData);
      expect(mockNotifyPostCreated).toHaveBeenCalledWith(
        expectedResponse,
        'User 1' // Placeholder from getAuthorName
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should propagate websocket notification errors during creation', async () => {
      const createData = {
        title: 'New Post',
        content: 'Content of new post',
        authorId: 1,
      };
      const newPost = { ...mockPost, ...createData, id: 2 };
      const expectedResponse: PostResponse = {
        id: newPost.id,
        title: newPost.title,
        content: newPost.content,
        authorId: newPost.authorId,
        published: newPost.published,
        createdAt: newPost.createdAt,
        updatedAt: newPost.updatedAt,
      };

      mockPostRepository.create.mockResolvedValue(newPost);
      mockNotifyPostCreated.mockRejectedValue(new Error('WebSocket error'));

      await expect(postService.create(createData)).rejects.toThrow('WebSocket error');

      expect(mockPostRepository.create).toHaveBeenCalledWith(createData);
      expect(mockNotifyPostCreated).toHaveBeenCalledWith(expectedResponse, 'User 1');
    });
  });

  describe('update', () => {
    const updateData = { title: 'Updated Title' };

    it('should update a post successfully', async () => {
      const updatedPost = { ...mockPost, ...updateData };
      mockPostRepository.findById.mockResolvedValue(mockPost); // First check if exists
      mockPostRepository.update.mockResolvedValue(updatedPost);

      const result = await postService.update(1, updateData);

      expect(mockPostRepository.findById).toHaveBeenCalledWith(1);
      expect(mockPostRepository.update).toHaveBeenCalledWith(1, updateData);
      expect(mockNotifyPostUpdated).toHaveBeenCalledWith(
        expect.objectContaining({ title: updateData.title }),
        'User 1' // Placeholder from getAuthorName
      );
      expect(result.title).toBe(updateData.title);
    });

    it('should throw NotFoundError if the post to update does not exist', async () => {
      mockPostRepository.findById.mockResolvedValue(null); // findById returns null

      await expect(postService.update(999, updateData)).rejects.toThrow(NotFoundError);

      expect(mockPostRepository.findById).toHaveBeenCalledWith(999);
      expect(mockPostRepository.update).not.toHaveBeenCalled();
    });

    it('should throw InternalServerError if update fails', async () => {
      mockPostRepository.findById.mockResolvedValue(mockPost); // findById finds the post
      mockPostRepository.update.mockResolvedValue(null); // update returns null

      await expect(postService.update(1, updateData)).rejects.toThrow(InternalServerError);

      expect(mockPostRepository.findById).toHaveBeenCalledWith(1);
      expect(mockPostRepository.update).toHaveBeenCalledWith(1, updateData);
    });

    it('should propagate websocket notification errors during update', async () => {
      const updatedPost = { ...mockPost, ...updateData };
      mockPostRepository.findById.mockResolvedValue(mockPost);
      mockPostRepository.update.mockResolvedValue(updatedPost);
      mockNotifyPostUpdated.mockRejectedValue(new Error('WebSocket error'));

      await expect(postService.update(1, updateData)).rejects.toThrow('WebSocket error');

      expect(mockPostRepository.findById).toHaveBeenCalledWith(1);
      expect(mockPostRepository.update).toHaveBeenCalledWith(1, updateData);
      expect(mockNotifyPostUpdated).toHaveBeenCalledWith(
        expect.objectContaining({ title: updateData.title }),
        'User 1'
      );
    });

    it('should not call websocket notification if update fails', async () => {
      mockPostRepository.findById.mockResolvedValue(mockPost);
      mockPostRepository.update.mockResolvedValue(null);

      await expect(postService.update(1, updateData)).rejects.toThrow(InternalServerError);

      expect(mockPostRepository.findById).toHaveBeenCalledWith(1);
      expect(mockPostRepository.update).toHaveBeenCalledWith(1, updateData);
      expect(mockNotifyPostUpdated).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete a post successfully and return the deleted post response', async () => {
      mockPostRepository.findById.mockResolvedValue(mockPost);
      mockPostRepository.delete.mockResolvedValue(true);
      const expectedResponse = {
        id: mockPost.id,
        title: mockPost.title,
        content: mockPost.content,
        authorId: mockPost.authorId,
        published: mockPost.published,
        createdAt: mockPost.createdAt,
        updatedAt: mockPost.updatedAt,
      };

      const result = await postService.delete(1);

      expect(mockPostRepository.findById).toHaveBeenCalledWith(1);
      expect(mockPostRepository.delete).toHaveBeenCalledWith(1);
      expect(mockNotifyPostDeleted).toHaveBeenCalledWith(mockPost, 'User 1');
      expect(result).toEqual(expectedResponse);
    });

    it('should throw NotFoundError if the post to delete does not exist', async () => {
      mockPostRepository.findById.mockResolvedValue(null);

      await expect(postService.delete(999)).rejects.toThrow(NotFoundError);

      expect(mockPostRepository.findById).toHaveBeenCalledWith(999);
      expect(mockPostRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw InternalServerError if delete fails', async () => {
      mockPostRepository.findById.mockResolvedValue(mockPost);
      mockPostRepository.delete.mockResolvedValue(false);

      await expect(postService.delete(1)).rejects.toThrow(InternalServerError);

      expect(mockPostRepository.findById).toHaveBeenCalledWith(1);
      expect(mockPostRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should propagate websocket notification errors during deletion', async () => {
      mockPostRepository.findById.mockResolvedValue(mockPost);
      mockPostRepository.delete.mockResolvedValue(true);
      mockNotifyPostDeleted.mockRejectedValue(new Error('WebSocket error'));

      await expect(postService.delete(1)).rejects.toThrow('WebSocket error');

      expect(mockPostRepository.findById).toHaveBeenCalledWith(1);
      expect(mockPostRepository.delete).toHaveBeenCalledWith(1);
      expect(mockNotifyPostDeleted).toHaveBeenCalledWith(mockPost, 'User 1');
    });

    it('should not call websocket notification if delete fails', async () => {
      mockPostRepository.findById.mockResolvedValue(mockPost);
      mockPostRepository.delete.mockResolvedValue(false);

      await expect(postService.delete(1)).rejects.toThrow(InternalServerError);

      expect(mockPostRepository.findById).toHaveBeenCalledWith(1);
      expect(mockPostRepository.delete).toHaveBeenCalledWith(1);
      expect(mockNotifyPostDeleted).not.toHaveBeenCalled();
    });
  });

  describe('findByFilter', () => {
    it('should call findFullPosts on the repository with transformed filters', async () => {
      const filters = {
        title: 'Test',
        content: 'content',
        authorName: 'Author',
        published: true,
      };
      const options = { page: 1, limit: 10 };
      const paginatedResult = {
        data: [mockFullPost],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      };
      mockPostRepository.findFullPosts.mockResolvedValue(paginatedResult);

      await postService.findByFilter(filters, options);

      expect(mockPostRepository.findFullPosts).toHaveBeenCalledWith(
        {
          title: { op: 'like', value: '%Test%' },
          content: { op: 'like', value: '%content%' },
          authorName: { op: 'like', value: '%Author%' },
          published: true,
        },
        options
      );
    });
  });
});
