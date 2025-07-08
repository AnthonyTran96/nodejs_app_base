import { Application } from '@/app';
import { Container } from '@/core/container';
import { DatabaseConnection } from '@/database/connection';
import { PostRepository } from '@/modules/post/post.repository';
import { UserRepository } from '@/modules/user/user.repository';
import { Role } from '@/types/role.enum';
import { HashUtil } from '@/utils/hash';
import request from 'supertest';

describe('Posts E2E Tests', () => {
  let app: Application;
  let dbConnection: DatabaseConnection;
  let userRepository: UserRepository;
  let postRepository: PostRepository;
  let container: Container;
  let adminToken: string;
  let userToken: string;
  let testUserId: number;
  let testPostId: number;

  beforeAll(async () => {
    app = new Application();
    await app.initialize();

    dbConnection = DatabaseConnection.getInstance();
    container = Container.getInstance();
    userRepository = container.get<UserRepository>('UserRepository');
    postRepository = container.get<PostRepository>('PostRepository');
  });

  beforeEach(async () => {
    await dbConnection.execute('DELETE FROM posts');
    await dbConnection.execute('DELETE FROM users');

    const regularUser = await userRepository.create({
      email: 'user@example.com',
      password: await HashUtil.hash('password123'),
      name: 'Regular User',
      role: Role.USER,
    });
    testUserId = regularUser.id;

    const testPost = await postRepository.create({
      title: 'Test Post',
      content: 'Content for the test post.',
      authorId: testUserId,
      published: true,
    });
    testPostId = testPost.id;

    await userRepository.create({
      email: 'admin@example.com',
      password: await HashUtil.hash('password123'),
      name: 'Admin User',
      role: Role.ADMIN,
    });

    const userLogin = await request(app.getApp()).post('/api/v1/auth/login').send({
      email: 'user@example.com',
      password: 'password123',
    });
    userToken = userLogin.body.data.tokens.accessToken;

    const adminLogin = await request(app.getApp()).post('/api/v1/auth/login').send({
      email: 'admin@example.com',
      password: 'password123',
    });
    adminToken = adminLogin.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    await dbConnection.close();
  });

  describe('GET /api/v1/posts', () => {
    it('should get all posts with author info', async () => {
      const response = await request(app.getApp())
        .get('/api/v1/posts')
        .set('Cookie', `accessToken=${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].author.name).toBe('Regular User');
    });

    it('should filter posts by title', async () => {
      const response = await request(app.getApp())
        .get('/api/v1/posts?title=Test')
        .set('Cookie', `accessToken=${userToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/v1/posts/:id', () => {
    it('should get a single post by id', async () => {
      const response = await request(app.getApp())
        .get(`/api/v1/posts/${testPostId}`)
        .set('Cookie', `accessToken=${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testPostId);
      expect(response.body.data.author.id).toBe(testUserId);
    });

    it('should return 404 for a non-existent post', async () => {
      await request(app.getApp())
        .get('/api/v1/posts/999')
        .set('Cookie', `accessToken=${userToken}`)
        .expect(404);
    });
  });

  describe('POST /api/v1/posts', () => {
    it('should create a new post', async () => {
      const newPostData = {
        title: 'A New Post',
        content: 'This is a brand new post.',
        authorId: testUserId,
      };

      const response = await request(app.getApp())
        .post('/api/v1/posts')
        .set('Cookie', `accessToken=${userToken}`)
        .send(newPostData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(newPostData.title);
    });
  });

  describe('PUT /api/v1/posts/:id', () => {
    it('should update an existing post', async () => {
      const updatedData = {
        title: 'Updated Post Title',
      };

      const response = await request(app.getApp())
        .put(`/api/v1/posts/${testPostId}`)
        .set('Cookie', `accessToken=${userToken}`)
        .send(updatedData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updatedData.title);
    });
  });

  describe('DELETE /api/v1/posts/:id', () => {
    it('should delete an existing post as admin', async () => {
      const response = await request(app.getApp())
        .delete(`/api/v1/posts/${testPostId}`)
        .set('Cookie', `accessToken=${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 403 when a non-admin tries to delete a post', async () => {
      await request(app.getApp())
        .delete(`/api/v1/posts/${testPostId}`)
        .set('Cookie', `accessToken=${userToken}`)
        .expect(403);
    });
  });
});
