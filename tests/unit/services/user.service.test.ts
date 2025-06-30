import { UserService } from '../../../src/services/user.service';
import { UserRepository } from '../../../src/repositories/user.repository';
import { UnitOfWork } from '../../../src/core/unit-of-work';
import { ValidationError, NotFoundError } from '../../../src/middleware/error-handler';
import { HashUtil } from '../../../src/utils/hash';
import { User } from '../../../src/models/user.model';

// Mock dependencies
jest.mock('../../../src/repositories/user.repository');
jest.mock('../../../src/core/unit-of-work');
jest.mock('../../../src/utils/hash');

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockUnitOfWork: jest.Mocked<UnitOfWork>;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedPassword',
    name: 'Test User',
    role: 'user',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(() => {
    mockUserRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      emailExists: jest.fn(),
      countByRole: jest.fn(),
    } as any;

    mockUnitOfWork = {
      executeInTransaction: jest.fn(),
    } as any;

    userService = new UserService(mockUserRepository, mockUnitOfWork);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return user response when user exists', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(mockUser);

      // Act
      const result = await userService.findById(1);

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
    });

    it('should return null when user does not exist', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(null);

      // Act
      const result = await userService.findById(999);

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith(999);
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    const createUserData = {
      email: 'newuser@example.com',
      password: 'password123',
      name: 'New User',
      role: 'user',
    };

    it('should create user successfully', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);
      (HashUtil.hash as jest.Mock).mockResolvedValue('hashedPassword');
      mockUserRepository.create.mockResolvedValue({ ...mockUser, ...createUserData, password: 'hashedPassword' });

      // Act
      const result = await userService.create(createUserData);

      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(createUserData.email);
      expect(HashUtil.hash).toHaveBeenCalledWith(createUserData.password);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        ...createUserData,
        password: 'hashedPassword',
      });
      expect(result.email).toBe(createUserData.email);
      expect(result.name).toBe(createUserData.name);
    });

    it('should throw ValidationError when email already exists', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(userService.create(createUserData)).rejects.toThrow(ValidationError);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(createUserData.email);
      expect(HashUtil.hash).not.toHaveBeenCalled();
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const updateData = {
      name: 'Updated Name',
      email: 'updated@example.com',
    };

    it('should update user successfully', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.emailExists.mockResolvedValue(false);
      const updatedUser = { ...mockUser, ...updateData };
      mockUserRepository.update.mockResolvedValue(updatedUser);

      // Act
      const result = await userService.update(1, updateData);

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith(1);
      expect(mockUserRepository.emailExists).toHaveBeenCalledWith(updateData.email, 1);
      expect(mockUserRepository.update).toHaveBeenCalledWith(1, updateData);
      expect(result.name).toBe(updateData.name);
      expect(result.email).toBe(updateData.email);
    });

    it('should throw NotFoundError when user does not exist', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(userService.update(999, updateData)).rejects.toThrow(NotFoundError);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(999);
      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });

    it('should throw ValidationError when email already exists for another user', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.emailExists.mockResolvedValue(true);

      // Act & Assert
      await expect(userService.update(1, updateData)).rejects.toThrow(ValidationError);
      expect(mockUserRepository.emailExists).toHaveBeenCalledWith(updateData.email, 1);
      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.delete.mockResolvedValue(true);

      // Act
      await userService.delete(1);

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith(1);
      expect(mockUserRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundError when user does not exist', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(userService.delete(999)).rejects.toThrow(NotFoundError);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(999);
      expect(mockUserRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(mockUser);
      (HashUtil.compare as jest.Mock).mockResolvedValue(true);
      (HashUtil.hash as jest.Mock).mockResolvedValue('newHashedPassword');
      mockUserRepository.update.mockResolvedValue(mockUser);
      mockUnitOfWork.executeInTransaction.mockImplementation(callback => callback());

      // Act
      await userService.changePassword(1, 'currentPassword', 'newPassword');

      // Assert
      expect(mockUnitOfWork.executeInTransaction).toHaveBeenCalled();
      expect(HashUtil.compare).toHaveBeenCalledWith('currentPassword', mockUser.password);
      expect(HashUtil.hash).toHaveBeenCalledWith('newPassword');
    });

    it('should throw ValidationError when current password is incorrect', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(mockUser);
      (HashUtil.compare as jest.Mock).mockResolvedValue(false);
      mockUnitOfWork.executeInTransaction.mockImplementation(callback => callback());

      // Act & Assert
      await expect(
        userService.changePassword(1, 'wrongPassword', 'newPassword')
      ).rejects.toThrow(ValidationError);
      expect(HashUtil.hash).not.toHaveBeenCalled();
    });
  });

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      // Arrange
      mockUserRepository.findAll.mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 10, total: 100, totalPages: 10 }
      });
      mockUserRepository.countByRole.mockResolvedValueOnce(10); // admin count
      mockUserRepository.countByRole.mockResolvedValueOnce(90); // user count

      // Act
      const result = await userService.getUserStats();

      // Assert
      expect(result).toEqual({
        totalUsers: 100,
        adminCount: 10,
        userCount: 90,
      });
      expect(mockUserRepository.countByRole).toHaveBeenCalledWith('admin');
      expect(mockUserRepository.countByRole).toHaveBeenCalledWith('user');
    });
  });
}); 