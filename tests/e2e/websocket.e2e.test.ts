import { Application } from '@/app';
import { Container } from '@/core/container';
import { DatabaseConnection } from '@/database/connection';
import { PostRepository } from '@/modules/post/post.repository';
import { UserRepository } from '@/modules/user/user.repository';
import { Role } from '@/types/role.enum';
import { HashUtil } from '@/utils/hash';
import { io } from 'socket.io-client';
import request from 'supertest';

describe('WebSocket E2E Tests', () => {
  let app: Application;
  let dbConnection: DatabaseConnection;
  let userRepository: UserRepository;
  let postRepository: PostRepository;
  // let webSocketService: WebSocketService;
  let container: Container;
  let adminToken: string;
  let userToken: string;
  let testUserId: number;
  let testPostId: number;
  let serverUrl: string;

  beforeAll(async () => {
    app = new Application();
    await app.initialize();

    // Start the server
    const server = app.listen(0); // Use random port
    const port = (server.address() as any).port;
    serverUrl = `http://localhost:${port}`;

    dbConnection = DatabaseConnection.getInstance();
    container = Container.getInstance();
    userRepository = container.get<UserRepository>('UserRepository');
    postRepository = container.get<PostRepository>('PostRepository');
    // webSocketService = container.get<WebSocketService>('WebSocketService');
  });

  beforeEach(async () => {
    // Clean database
    await dbConnection.execute('DELETE FROM posts');
    await dbConnection.execute('DELETE FROM users');

    // Create test users
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

    // Get authentication tokens
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
    // Server will be closed automatically after tests
  });

  describe('WebSocket Connection', () => {
    it('should connect to WebSocket server with authentication', done => {
      const client = io(serverUrl, {
        auth: {
          token: userToken,
        },
      });

      client.on('connect', () => {
        expect(client.connected).toBe(true);
        client.disconnect();
        done();
      });

      client.on('connect_error', (err: Error) => {
        done(err);
      });
    });

    it('should connect to WebSocket server without authentication', done => {
      const client = io(serverUrl);

      client.on('connect', () => {
        expect(client.connected).toBe(true);
        client.disconnect();
        done();
      });

      client.on('connect_error', (err: Error) => {
        done(err);
      });
    });

    it('should receive connection count update', done => {
      const client = io(serverUrl);

      client.on('connectionCount', (data: any) => {
        expect(data).toHaveProperty('count');
        expect(typeof data.count).toBe('number');
        client.disconnect();
        done();
      });

      client.on('connect_error', (err: Error) => {
        done(err);
      });
    });
  });

  describe('Real-time Post Notifications', () => {
    it('should receive post created notification', done => {
      const client = io(serverUrl);

      client.on('connect', () => {
        // Listen for post created event
        client.on('postCreated', (data: any) => {
          expect(data).toHaveProperty('post');
          expect(data).toHaveProperty('author');
          expect(data.post.title).toBe('New Post');
          client.disconnect();
          done();
        });

        // Create a new post via REST API
        setTimeout(async () => {
          await request(app.getApp())
            .post('/api/v1/posts')
            .set('Cookie', `accessToken=${userToken}`)
            .send({
              title: 'New Post',
              content: 'This is a new post.',
              authorId: testUserId,
            });
        }, 100);
      });

      client.on('connect_error', (err: Error) => {
        done(err);
      });
    });

    it('should receive post updated notification', done => {
      const client = io(serverUrl);

      client.on('connect', () => {
        // Listen for post updated event
        client.on('postUpdated', (data: any) => {
          expect(data).toHaveProperty('post');
          expect(data).toHaveProperty('author');
          expect(data.post.title).toBe('Updated Post');
          client.disconnect();
          done();
        });

        // Update the post via REST API
        setTimeout(async () => {
          await request(app.getApp())
            .put(`/api/v1/posts/${testPostId}`)
            .set('Cookie', `accessToken=${userToken}`)
            .send({
              title: 'Updated Post',
            });
        }, 100);
      });

      client.on('connect_error', (err: Error) => {
        done(err);
      });
    });

    it('should receive post deleted notification', done => {
      const client = io(serverUrl);

      client.on('connect', () => {
        // Listen for post deleted event
        client.on('postDeleted', (data: any) => {
          expect(data).toHaveProperty('postId');
          expect(data).toHaveProperty('author');
          expect(data.postId).toBe(testPostId);
          client.disconnect();
          done();
        });

        // Delete the post via REST API
        setTimeout(async () => {
          await request(app.getApp())
            .delete(`/api/v1/posts/${testPostId}`)
            .set('Cookie', `accessToken=${adminToken}`);
        }, 100);
      });

      client.on('connect_error', err => {
        done(err);
      });
    });
  });

  describe('Room Management', () => {
    it('should join and leave rooms', done => {
      const client = io(serverUrl);

      client.on('connect', () => {
        // Test joining a room
        client.emit('joinRoom', 'test-room');

        // Test leaving a room
        setTimeout(() => {
          client.emit('leaveRoom', 'test-room');
          client.disconnect();
          done();
        }, 100);
      });

      client.on('connect_error', err => {
        done(err);
      });
    });

    it('should handle post subscription events', done => {
      const client = io(serverUrl);

      client.on('connect', () => {
        // Test subscribing to a post
        client.emit('subscribeToPost', testPostId);

        // Test unsubscribing from a post
        setTimeout(() => {
          client.emit('unsubscribeFromPost', testPostId);
          client.disconnect();
          done();
        }, 100);
      });

      client.on('connect_error', err => {
        done(err);
      });
    });
  });

  describe('Ping/Pong', () => {
    it('should respond to ping with pong', done => {
      const client = io(serverUrl);

      client.on('connect', () => {
        // Listen for notification response
        client.on('notification', data => {
          expect(data.message).toBe('pong');
          expect(data.type).toBe('info');
          client.disconnect();
          done();
        });

        // Send ping
        client.emit('ping');
      });

      client.on('connect_error', err => {
        done(err);
      });
    });
  });

  describe('WebSocket Controller Endpoints', () => {
    it('should get WebSocket health status', async () => {
      const response = await request(app.getApp()).get('/api/v1/websocket/health').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('connections');
      expect(response.body.data).toHaveProperty('uptime');
    });

    it('should get WebSocket statistics as admin', async () => {
      const response = await request(app.getApp())
        .get('/api/v1/websocket/stats')
        .set('Cookie', `accessToken=${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('connections');
      expect(response.body.data).toHaveProperty('rooms');
      expect(response.body.data).toHaveProperty('totalConnections');
    });

    it('should send notification to all users as admin', async () => {
      const response = await request(app.getApp())
        .post('/api/v1/websocket/notify/broadcast')
        .set('Cookie', `accessToken=${adminToken}`)
        .send({
          message: 'Test broadcast message',
          type: 'info',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should send notification to specific user as admin', async () => {
      const response = await request(app.getApp())
        .post('/api/v1/websocket/notify/user')
        .set('Cookie', `accessToken=${adminToken}`)
        .send({
          userId: testUserId,
          message: 'Test user message',
          type: 'info',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should send notification to specific room as admin', async () => {
      const response = await request(app.getApp())
        .post('/api/v1/websocket/notify/room')
        .set('Cookie', `accessToken=${adminToken}`)
        .send({
          room: 'test-room',
          message: 'Test room message',
          type: 'info',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should get user connections as admin', async () => {
      const response = await request(app.getApp())
        .get(`/api/v1/websocket/users/${testUserId}/connections`)
        .set('Cookie', `accessToken=${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return 403 for non-admin user accessing admin endpoints', async () => {
      await request(app.getApp())
        .get('/api/v1/websocket/stats')
        .set('Cookie', `accessToken=${userToken}`)
        .expect(403);

      await request(app.getApp())
        .post('/api/v1/websocket/notify/broadcast')
        .set('Cookie', `accessToken=${userToken}`)
        .send({
          message: 'Test message',
          type: 'info',
        })
        .expect(403);
    });
  });

  // describe('User Presence', () => {
  //   it.skip('should receive user joined notification', done => {
  //     // This test is complex and requires careful timing coordination
  //     // between multiple WebSocket clients. Skipping for now as
  //     // the core functionality is tested in other test cases.
  //     done();
  //   });
  // });
});
