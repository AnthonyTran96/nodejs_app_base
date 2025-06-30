import { AuthService } from '@/auth/auth.service';
import { UserService } from '@/user/user.service';
import { HashUtil } from '@/utils/hash';
import { UnauthorizedError } from '@/middleware/error-handler';
import { config } from '@/config/environment';
import jwt from 'jsonwebtoken';
import { Response } from 'express';

// Mock dependencies
jest.mock('@/user/user.service');
jest.mock('@/utils/hash');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserService: jest.Mocked<UserService>;
  let mockResponse: Partial<Response>;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedPassword',
    name: 'Test User',
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserResponse = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockUserService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
    } as any;

    mockResponse = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };

    authService = new AuthService(mockUserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const loginData = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login successfully with valid credentials', async () => {
      // Arrange
      mockUserService.findByEmail.mockResolvedValue(mockUser);
      (HashUtil.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('mock-token');

      // Act
      const result = await authService.login(loginData.email, loginData.password);

      // Assert
      expect(mockUserService.findByEmail).toHaveBeenCalledWith(loginData.email);
      expect(HashUtil.compare).toHaveBeenCalledWith(loginData.password, mockUser.password);
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role,
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt,
        },
        tokens: {
          accessToken: 'mock-token',
          refreshToken: 'mock-token',
        },
      });
    });

    it('should throw UnauthorizedError when user not found', async () => {
      // Arrange
      mockUserService.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.login(loginData.email, loginData.password)).rejects.toThrow(
        UnauthorizedError
      );
      expect(mockUserService.findByEmail).toHaveBeenCalledWith(loginData.email);
      expect(HashUtil.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError when password is invalid', async () => {
      // Arrange
      mockUserService.findByEmail.mockResolvedValue(mockUser);
      (HashUtil.compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(authService.login(loginData.email, loginData.password)).rejects.toThrow(
        UnauthorizedError
      );
      expect(HashUtil.compare).toHaveBeenCalledWith(loginData.password, mockUser.password);
    });
  });

  describe('refreshToken', () => {
    const mockRefreshToken = 'valid-refresh-token';

    it('should refresh tokens successfully with valid refresh token', async () => {
      // Arrange
      const mockPayload = {
        userId: 1,
        email: 'test@example.com',
        role: 'user',
      };
      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);
      mockUserService.findById.mockResolvedValue(mockUserResponse);
      (jwt.sign as jest.Mock).mockReturnValue('new-token');

      // Act
      const result = await authService.refreshToken(mockRefreshToken);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(mockRefreshToken, config.jwt.refreshSecret);
      expect(mockUserService.findById).toHaveBeenCalledWith(mockPayload.userId);
      expect(result).toEqual({
        accessToken: 'new-token',
        refreshToken: 'new-token',
      });
    });

    it('should throw UnauthorizedError when user not found', async () => {
      // Arrange
      const mockPayload = { userId: 999, email: 'test@example.com', role: 'user' };
      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);
      mockUserService.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.refreshToken(mockRefreshToken)).rejects.toThrow(UnauthorizedError);
      expect(mockUserService.findById).toHaveBeenCalledWith(mockPayload.userId);
    });

    it('should throw UnauthorizedError when refresh token is invalid', async () => {
      // Arrange
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.JsonWebTokenError('Invalid token');
      });

      // Act & Assert
      await expect(authService.refreshToken('invalid-token')).rejects.toThrow(UnauthorizedError);
      expect(jwt.verify).toHaveBeenCalledWith('invalid-token', config.jwt.refreshSecret);
    });
  });

  describe('setTokenCookies', () => {
    const mockTokens = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    };

    it('should set cookies in development environment', () => {
      // Arrange
      const originalNodeEnv = config.nodeEnv;
      (config as any).nodeEnv = 'development';

      // Act
      authService.setTokenCookies(mockResponse as Response, mockTokens);

      // Assert
      expect(mockResponse.cookie).toHaveBeenCalledWith('accessToken', mockTokens.accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      expect(mockResponse.cookie).toHaveBeenCalledWith('refreshToken', mockTokens.refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      // Cleanup
      (config as any).nodeEnv = originalNodeEnv;
    });

    it('should set secure cookies in production environment', () => {
      // Arrange
      const originalNodeEnv = config.nodeEnv;
      (config as any).nodeEnv = 'production';

      // Act
      authService.setTokenCookies(mockResponse as Response, mockTokens);

      // Assert
      expect(mockResponse.cookie).toHaveBeenCalledWith('accessToken', mockTokens.accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      // Cleanup
      (config as any).nodeEnv = originalNodeEnv;
    });
  });

  describe('clearTokenCookies', () => {
    it('should clear authentication cookies', () => {
      // Act
      authService.clearTokenCookies(mockResponse as Response);

      // Assert
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('accessToken');
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refreshToken');
    });
  });
}); 