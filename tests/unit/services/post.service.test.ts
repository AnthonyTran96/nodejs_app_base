import { NotFoundError } from '@/middleware/error-handler';
import { FullPost, Post } from '@/models/post.model';
import { User } from '@/models/user.model';
import { PostRepository } from '@/modules/post/post.repository';
import { PostService } from '@/modules/post/post.service';
import { Role } from '@/types/role.enum';

jest.mock('@/modules/post/post.repository');

describe('PostService', () => {
  let postService: PostService;
  let mockPostRepository: jest.Mocked<PostRepository>;

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
    mockPostRepository = {
      findFullPosts: jest.fn(),
      findFullPostById: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByFilter: jest.fn(),
    } as any;

    postService = new PostService(mockPostRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
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
      mockPostRepository.create.mockResolvedValue({ ...mockPost, ...createData });

      const result = await postService.create(createData);

      expect(mockPostRepository.create).toHaveBeenCalledWith(createData);
      expect(result.title).toBe(createData.title);
    });
  });

  describe('update', () => {
    const updateData = { title: 'Updated Title' };

    it('should update a post successfully', async () => {
      mockPostRepository.findById.mockResolvedValue(mockPost);
      mockPostRepository.update.mockResolvedValue({ ...mockPost, ...updateData });

      const result = await postService.update(1, updateData);

      expect(mockPostRepository.findById).toHaveBeenCalledWith(1);
      expect(mockPostRepository.update).toHaveBeenCalledWith(1, updateData);
      expect(result.title).toBe(updateData.title);
    });

    it('should throw NotFoundError if the post to update does not exist', async () => {
      mockPostRepository.findById.mockResolvedValue(null);

      await expect(postService.update(999, updateData)).rejects.toThrow(NotFoundError);

      expect(mockPostRepository.findById).toHaveBeenCalledWith(999);
      expect(mockPostRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete a post successfully', async () => {
      mockPostRepository.findById.mockResolvedValue(mockPost);
      mockPostRepository.delete.mockResolvedValue(true);

      await postService.delete(1);

      expect(mockPostRepository.findById).toHaveBeenCalledWith(1);
      expect(mockPostRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundError if the post to delete does not exist', async () => {
      mockPostRepository.findById.mockResolvedValue(null);

      await expect(postService.delete(999)).rejects.toThrow(NotFoundError);

      expect(mockPostRepository.findById).toHaveBeenCalledWith(999);
      expect(mockPostRepository.delete).not.toHaveBeenCalled();
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
