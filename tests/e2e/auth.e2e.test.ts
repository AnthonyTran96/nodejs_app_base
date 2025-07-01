import request from 'supertest';
import { Application } from '../../src/app';
import { DatabaseConnection } from '@/database/connection';
import { Container } from '@/core/container';
import { UserRepository } from '@/user/user.repository';
import { HashUtil } from '@/utils/hash';
import { Role } from '@/types/role.enum';

describe('Auth E2E Tests', () => {
  let app: Application;
  let dbConnection: DatabaseConnection;
  let userRepository: UserRepository;
  let container: Container;

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
  });

  afterAll(async () => {
    await dbConnection.close();
  });

  describe('POST /api/v1/auth/register', () => {
    const validRegistrationData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      role: Role.USER,
    };

    it('should register user successfully', async () => {
      // Act
      const response = await request(app.getApp())
        .post('/api/v1/auth/register')
        .send(validRegistrationData)
        .expect(201);

      // Assert
      expect(response.body).toEqual({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: expect.any(Number),
            email: validRegistrationData.email,
            name: validRegistrationData.name,
            role: validRegistrationData.role,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          },
          tokens: {
            accessToken: expect.any(String),
            refreshToken: expect.any(String),
          },
        },
      });

      // Verify user was created in database
      const createdUser = await userRepository.findByEmail(validRegistrationData.email);
      expect(createdUser).toBeTruthy();
      expect(createdUser!.name).toBe(validRegistrationData.name);

      // Verify password was hashed
      const isPasswordValid = await HashUtil.compare(validRegistrationData.password, createdUser!.password);
      expect(isPasswordValid).toBe(true);

      // Verify cookies are set
      const cookiesHeader = response.headers['set-cookie'];
      const cookies = Array.isArray(cookiesHeader) ? cookiesHeader : [cookiesHeader];
      expect(cookies).toBeDefined();
      expect(cookies.some((cookie: string) => cookie.includes('accessToken'))).toBe(true);
      expect(cookies.some((cookie: string) => cookie.includes('refreshToken'))).toBe(true);
    });

    it('should return 400 for invalid email format', async () => {
      // Act
      const response = await request(app.getApp())
        .post('/api/v1/auth/register')
        .send({
          ...validRegistrationData,
          email: 'invalid-email',
        })
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation failed');
    });

    it('should return 400 for short password', async () => {
      // Act
      const response = await request(app.getApp())
        .post('/api/v1/auth/register')
        .send({
          ...validRegistrationData,
          password: '123',
        })
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation failed');
    });

    it('should return 400 for duplicate email', async () => {
      // Arrange - Create user first
      await userRepository.create({
        email: validRegistrationData.email,
        password: await HashUtil.hash(validRegistrationData.password),
        name: validRegistrationData.name,
        role: validRegistrationData.role,
      });

      // Act
      const response = await request(app.getApp())
        .post('/api/v1/auth/register')
        .send(validRegistrationData)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Email already exists');
    });

    it('should return 400 for missing required fields', async () => {
      // Act
      const response = await request(app.getApp())
        .post('/api/v1/auth/register')
        .send({
          email: validRegistrationData.email,
          // Missing password, name, role
        })
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation failed');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      role: Role.USER,
    };

    beforeEach(async () => {
      // Create test user before each test
      await userRepository.create({
        ...userData,
        password: await HashUtil.hash(userData.password),
      });
    });

    it('should login successfully with valid credentials', async () => {
      // Act
      const response = await request(app.getApp())
        .post('/api/v1/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      // Assert
      expect(response.body).toEqual({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: expect.any(Number),
            email: userData.email,
            name: userData.name,
            role: userData.role,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          },
          tokens: {
            accessToken: expect.any(String),
            refreshToken: expect.any(String),
          },
        },
      });

      // Verify cookies are set
      const cookiesHeader = response.headers['set-cookie'];
      const cookies = Array.isArray(cookiesHeader) ? cookiesHeader : [cookiesHeader];
      expect(cookies).toBeDefined();
      expect(cookies.some((cookie: string) => cookie.includes('accessToken'))).toBe(true);
      expect(cookies.some((cookie: string) => cookie.includes('refreshToken'))).toBe(true);
    });

    it('should return 401 for invalid email', async () => {
      // Act
      const response = await request(app.getApp())
        .post('/api/v1/auth/login')
        .send({
          email: 'wrong@example.com',
          password: userData.password,
        })
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should return 401 for invalid password', async () => {
      // Act
      const response = await request(app.getApp())
        .post('/api/v1/auth/login')
        .send({
          email: userData.email,
          password: 'wrongpassword',
        })
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should return 400 for missing credentials', async () => {
      // Act
      const response = await request(app.getApp())
        .post('/api/v1/auth/login')
        .send({
          email: userData.email,
          // Missing password
        })
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation failed');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    let refreshToken: string;
    let userData: any;

    beforeEach(async () => {
      // Create user and login to get tokens
      userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: Role.USER,
      };

      await userRepository.create({
        ...userData,
        password: await HashUtil.hash(userData.password),
      });

      const loginResponse = await request(app.getApp())
        .post('/api/v1/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        });

      refreshToken = loginResponse.body.data.tokens.refreshToken;
    });

    it('should refresh tokens successfully', async () => {
      // Act
      const response = await request(app.getApp())
        .post('/api/v1/auth/refresh')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(200);

      // Assert
      expect(response.body).toEqual({
        success: true,
        message: 'Tokens refreshed successfully',
        data: {
          tokens: {
            accessToken: expect.any(String),
            refreshToken: expect.any(String),
          },
        },
      });

      // Verify new tokens are different
      expect(response.body.data.tokens.accessToken).not.toBe(refreshToken);
      expect(response.body.data.tokens.refreshToken).not.toBe(refreshToken);
    });

    it('should return 401 for missing refresh token', async () => {
      // Act
      const response = await request(app.getApp())
        .post('/api/v1/auth/refresh')
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Refresh token required');
    });

    it('should return 401 for invalid refresh token', async () => {
      // Act
      const response = await request(app.getApp())
        .post('/api/v1/auth/refresh')
        .set('Cookie', 'refreshToken=invalid-token')
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Create user and login to get token
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: Role.USER,
      };

      await userRepository.create({
        ...userData,
        password: await HashUtil.hash(userData.password),
      });

      const loginResponse = await request(app.getApp())
        .post('/api/v1/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        });

      accessToken = loginResponse.body.data.tokens.accessToken;
    });

    it('should logout successfully', async () => {
      // Act
      const response = await request(app.getApp())
        .post('/api/v1/auth/logout')
        .set('Cookie', `accessToken=${accessToken}`)
        .expect(200);

      // Assert
      expect(response.body).toEqual({
        success: true,
        message: 'Logout successful',
        data: null,
      });

      // Verify cookies are cleared
      const cookiesHeader = response.headers['set-cookie'];
      const cookies = Array.isArray(cookiesHeader) ? cookiesHeader : [cookiesHeader];
      expect(cookies).toBeDefined();
      expect(cookies.some((cookie: string) => cookie.includes('accessToken=;'))).toBe(true);
      expect(cookies.some((cookie: string) => cookie.includes('refreshToken=;'))).toBe(true);
    });

    it('should return 401 for missing access token', async () => {
      // Act
      const response = await request(app.getApp())
        .post('/api/v1/auth/logout')
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/auth/profile', () => {
    let accessToken: string;
    let userId: number;

    beforeEach(async () => {
      // Create user and login to get token
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: Role.USER,
      };

      const createdUser = await userRepository.create({
        ...userData,
        password: await HashUtil.hash(userData.password),
      });
      userId = createdUser.id;

      const loginResponse = await request(app.getApp())
        .post('/api/v1/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        });

      accessToken = loginResponse.body.data.tokens.accessToken;
    });

    it('should get user profile successfully', async () => {
      // Act
      const response = await request(app.getApp())
        .get('/api/v1/auth/profile')
        .set('Cookie', `accessToken=${accessToken}`)
        .expect(200);

      // Assert
      expect(response.body).toEqual({
        success: true,
        message: 'Profile retrieved successfully',
        data: {
          user: {
            id: userId,
            email: 'test@example.com',
            name: 'Test User',
            role: Role.USER,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          },
        },
      });
    });

    it('should return 401 for missing access token', async () => {
      // Act
      const response = await request(app.getApp())
        .get('/api/v1/auth/profile')
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
    });

    it('should return 401 for invalid access token', async () => {
      // Act
      const response = await request(app.getApp())
        .get('/api/v1/auth/profile')
        .set('Cookie', 'accessToken=invalid-token')
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
    });
  });
}); 