import request from 'supertest';
import { Application } from '../../src/app';
import { DatabaseConnection } from '@/database/connection';
import { Container } from '@/core/container';
import { UserRepository } from '@/user/user.repository';
import { HashUtil } from '@/utils/hash';
import { Role } from '@/types/role.enum';

describe('Users E2E Tests', () => {
  let app: Application;
  let dbConnection: DatabaseConnection;
  let userRepository: UserRepository;
  let container: Container;
  let adminToken: string;
  let userToken: string;
  let testUserId: number;

  beforeAll(async () => {
    app = new Application();
    await app.initialize();
    
    dbConnection = DatabaseConnection.getInstance();
    container = Container.getInstance();
    userRepository = container.get<UserRepository>('UserRepository');
  });

  beforeEach(async () => {
    // Clean database before each test
    await dbConnection.execute('DELETE FROM users');

    // Create test users
    await userRepository.create({
      email: 'admin@example.com',
      password: await HashUtil.hash('password123'),
      name: 'Admin User',
      role: Role.ADMIN,
    });

    const regularUser = await userRepository.create({
      email: 'user@example.com',
      password: await HashUtil.hash('password123'),
      name: 'Regular User',
      role: Role.USER,
    });

    testUserId = regularUser.id;

    // Get tokens for authentication
    const adminLogin = await request(app.getApp())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'password123',
      });

    const userLogin = await request(app.getApp())
      .post('/api/v1/auth/login')
      .send({
        email: 'user@example.com',
        password: 'password123',
      });

    adminToken = adminLogin.body.data.tokens.accessToken;
    userToken = userLogin.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    await dbConnection.close();
  });

  describe('GET /api/v1/users', () => {
    it('should get all users as admin', async () => {
      // Act
      const response = await request(app.getApp())
        .get('/api/v1/users')
        .set('Cookie', `accessToken=${adminToken}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(2);
    });

    it('should return 403 for non-admin users', async () => {
      // Act
      const response = await request(app.getApp())
        .get('/api/v1/users')
        .set('Cookie', `accessToken=${userToken}`)
        .expect(403);

      // Assert
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('should get user by ID as admin', async () => {
      // Act
      const response = await request(app.getApp())
        .get(`/api/v1/users/${testUserId}`)
        .set('Cookie', `accessToken=${adminToken}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(testUserId);
    });

    it('should allow users to get their own profile', async () => {
      // Act
      const response = await request(app.getApp())
        .get(`/api/v1/users/${testUserId}`)
        .set('Cookie', `accessToken=${userToken}`)
        .expect(200);

      // Assert
      expect(response.body.data.user.id).toBe(testUserId);
    });

    it('should return 404 for non-existent user', async () => {
      // Act
      const response = await request(app.getApp())
        .get('/api/v1/users/999')
        .set('Cookie', `accessToken=${adminToken}`)
        .expect(404);

      // Assert
      expect(response.body.success).toBe(false);
    });
  });
}); 