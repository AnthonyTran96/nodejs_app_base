import { DatabaseConnection } from '@/database/connection';
import { CreatePostRequest } from '@/models/post.model';
import { User } from '@/models/user.model';
import { PostRepository } from '@/modules/post/post.repository';
import { UserRepository } from '@/modules/user/user.repository';
import { Role } from '@/types/role.enum';

describe('PostRepository Integration Tests', () => {
  let postRepository: PostRepository;
  let userRepository: UserRepository;
  let dbConnection: DatabaseConnection;
  let testUser: User;

  beforeAll(async () => {
    postRepository = new PostRepository();
    userRepository = new UserRepository();
    dbConnection = DatabaseConnection.getInstance();
    await dbConnection.initialize();
  });

  beforeEach(async () => {
    // Clean database before each test
    await dbConnection.execute('DELETE FROM posts');
    await dbConnection.execute('DELETE FROM users');

    // Create a user for posts to belong to
    testUser = await userRepository.create({
      email: 'author@example.com',
      password: 'password',
      name: 'Test Author',
      role: Role.USER,
    });
  });

  afterAll(async () => {
    await dbConnection.close();
  });

  describe('create and findById', () => {
    it('should create and retrieve a post', async () => {
      // Arrange
      const postData: CreatePostRequest = {
        title: 'Integration Test Post',
        content: 'Some content here.',
        authorId: testUser.id,
        published: true,
      };

      // Act
      const createdPost = await postRepository.create(postData);

      // Assert
      expect(createdPost).toMatchObject({
        id: expect.any(Number),
        title: postData.title,
        content: postData.content,
        authorId: testUser.id,
        published: true,
      });

      // Verify we can find the post
      const foundPost = await postRepository.findById(createdPost.id);
      expect(foundPost).toMatchObject(createdPost);
    });
  });

  describe('update', () => {
    it('should update a post successfully', async () => {
      // Arrange
      const postData = { title: 'Original', content: '...', authorId: testUser.id };
      const createdPost = await postRepository.create(postData);
      const updateData = { title: 'Updated Title' };

      // Act
      const updatedPost = await postRepository.update(createdPost.id, updateData);

      // Assert
      expect(updatedPost).not.toBeNull();
      expect(updatedPost!.title).toBe(updateData.title);
    });
  });

  describe('delete', () => {
    it('should delete a post successfully', async () => {
      // Arrange
      const postData = { title: 'To Delete', content: '...', authorId: testUser.id };
      const createdPost = await postRepository.create(postData);

      // Act
      const result = await postRepository.delete(createdPost.id);

      // Assert
      expect(result).toBe(true);
      const foundPost = await postRepository.findById(createdPost.id);
      expect(foundPost).toBeNull();
    });
  });

  describe('findFullPosts', () => {
    it('should find posts and include full author information', async () => {
      // Arrange
      await postRepository.create({ title: 'Post 1', content: '...', authorId: testUser.id });
      await postRepository.create({ title: 'Post 2', content: '...', authorId: testUser.id });

      // Act
      const result = await postRepository.findFullPosts();

      // Assert
      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(typeof result.meta.total).toBe('number');
      expect(result.data[0]!.author).toBeDefined();
      expect(result.data[0]!.author.id).toBe(testUser.id);
      expect(result.data[0]!.author.name).toBe('Test Author');
      // Ensure password property exists but is empty, not the real hash
      expect(result.data[0]!.author.password).toBe('');
    });

    it('should filter posts by authorName', async () => {
      // Arrange
      const anotherUser = await userRepository.create({
        email: 'another@author.com',
        name: 'Another Author',
        password: 'password',
        role: Role.USER,
      });
      await postRepository.create({ title: 'Post 1', content: '...', authorId: testUser.id });
      await postRepository.create({ title: 'Post 2', content: '...', authorId: anotherUser.id });

      // Act
      const result = await postRepository.findFullPosts({
        authorName: { op: 'like', value: '%Another%' },
      });

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0]!.author.name).toBe('Another Author');
    });
  });

  describe('findFullPostById', () => {
    it('should find a single post with full author info', async () => {
      // Arrange
      const createdPost = await postRepository.create({
        title: 'Full Post Test',
        content: '...',
        authorId: testUser.id,
      });

      // Act
      const foundPost = await postRepository.findFullPostById(createdPost.id);

      // Assert
      expect(foundPost).not.toBeNull();
      expect(foundPost!.id).toBe(createdPost.id);
      expect(foundPost!.author.id).toBe(testUser.id);
      expect(foundPost!.author.name).toBe(testUser.name);
    });
  });
});
