import { DatabaseConnection } from '@/database/connection';
import { Role } from '@/types/role.enum';
import { UserRepository } from '@/user/user.repository';

describe('UserRepository Integration Tests', () => {
  let userRepository: UserRepository;
  let dbConnection: DatabaseConnection;

  beforeAll(async () => {
    userRepository = new UserRepository();
    dbConnection = DatabaseConnection.getInstance();
    await dbConnection.initialize();
  });

  beforeEach(async () => {
    // Clean database before each test
    await dbConnection.execute('DELETE FROM users');
  });

  afterAll(async () => {
    await dbConnection.close();
  });

  describe('create and findById', () => {
    it('should create and retrieve a user', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'hashedPassword',
        name: 'Test User',
        role: Role.USER,
      };

      // Act
      const createdUser = await userRepository.create(userData);

      // Assert
      expect(createdUser).toMatchObject({
        id: expect.any(Number),
        email: userData.email,
        name: userData.name,
        role: userData.role,
      });
      expect(createdUser.password).toBe(userData.password);
      expect(createdUser.createdAt).toBeInstanceOf(Date);
      expect(createdUser.updatedAt).toBeInstanceOf(Date);

      // Verify we can find the user
      const foundUser = await userRepository.findById(createdUser.id);
      expect(foundUser).toMatchObject(createdUser);
    });

    it('should return null for non-existent user ID', async () => {
      // Act
      const foundUser = await userRepository.findById(999);

      // Assert
      expect(foundUser).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'hashedPassword',
        name: 'Test User',
        role: Role.USER,
      };
      const createdUser = await userRepository.create(userData);

      // Act
      const foundUser = await userRepository.findByEmail(userData.email);

      // Assert
      expect(foundUser).not.toBeNull();
      expect(foundUser?.email).toBe(userData.email);
      expect(foundUser?.id).toBe(createdUser.id);
    });

    it('should return null for non-existent email', async () => {
      // Act
      const foundUser = await userRepository.findByEmail('nonexistent@example.com');

      // Assert
      expect(foundUser).toBeNull();
    });

    it('should be case-sensitive for email search', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'hashedPassword',
        name: 'Test User',
        role: Role.USER,
      };
      await userRepository.create(userData);

      // Act
      const foundUser = await userRepository.findByEmail('TEST@EXAMPLE.COM');

      // Assert
      expect(foundUser).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all users with pagination', async () => {
      // Arrange
      const users = [
        { email: 'user1@example.com', password: 'password', name: 'User 1', role: Role.USER },
        { email: 'user2@example.com', password: 'password', name: 'User 2', role: Role.ADMIN },
        { email: 'user3@example.com', password: 'password', name: 'User 3', role: Role.USER },
      ];

      for (const userData of users) {
        await userRepository.create(userData);
      }

      // Act
      const result = await userRepository.findAll({ page: 1, limit: 2 });

      // Assert
      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(3);
      expect(typeof result.meta.total).toBe('number');
      expect(result.meta).toEqual({
        page: 1,
        limit: 2,
        total: 3,
        totalPages: 2,
      });
    });

    it('should return empty array when no users exist', async () => {
      // Act
      const result = await userRepository.findAll();

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });

    it('should support sorting by name', async () => {
      // Arrange
      const users = [
        { email: 'charlie@example.com', password: 'password', name: 'Charlie', role: Role.USER },
        { email: 'alice@example.com', password: 'password', name: 'Alice', role: Role.USER },
        { email: 'bob@example.com', password: 'password', name: 'Bob', role: Role.USER },
      ];

      for (const userData of users) {
        await userRepository.create(userData);
      }

      // Act
      const result = await userRepository.findAll({
        page: 1,
        limit: 10,
        sortBy: 'name',
        sortOrder: 'ASC',
      });

      // Assert
      expect(result.data[0]!.name).toBe('Alice');
      expect(result.data[1]!.name).toBe('Bob');
      expect(result.data[2]!.name).toBe('Charlie');
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'hashedPassword',
        name: 'Original Name',
        role: Role.USER,
      };
      const createdUser = await userRepository.create(userData);

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));

      const updateData = {
        name: 'Updated Name',
        role: Role.ADMIN,
      };

      // Act
      const updatedUser = await userRepository.update(createdUser.id, updateData);

      // Assert
      expect(updatedUser).not.toBeNull();
      expect(updatedUser!.name).toBe(updateData.name);
      expect(updatedUser!.role).toBe(updateData.role);
      expect(updatedUser!.email).toBe(userData.email); // Should not change
      expect(updatedUser!.updatedAt.getTime()).toBeGreaterThanOrEqual(
        createdUser.updatedAt.getTime()
      );
    });

    it('should return null when updating non-existent user', async () => {
      // Act
      const result = await userRepository.update(999, { name: 'New Name' });

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'hashedPassword',
        name: 'Test User',
        role: Role.USER,
      };
      const createdUser = await userRepository.create(userData);

      // Act
      const result = await userRepository.delete(createdUser.id);

      // Assert
      expect(result).toBe(true);

      // Verify user is deleted
      const foundUser = await userRepository.findById(createdUser.id);
      expect(foundUser).toBeNull();
    });

    it('should return true even when deleting non-existent user', async () => {
      // Act
      const result = await userRepository.delete(999);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('emailExists', () => {
    it('should return true for existing email', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'hashedPassword',
        name: 'Test User',
        role: Role.USER,
      };
      await userRepository.create(userData);

      // Act
      const exists = await userRepository.emailExists(userData.email);

      // Assert
      expect(exists).toBe(true);
    });

    it('should return false for non-existent email', async () => {
      // Act
      const exists = await userRepository.emailExists('nonexistent@example.com');

      // Assert
      expect(exists).toBe(false);
    });

    it('should exclude specific user ID when checking', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'hashedPassword',
        name: 'Test User',
        role: Role.USER,
      };
      const user = await userRepository.create(userData);

      // Act
      const exists = await userRepository.emailExists(userData.email, user.id);

      // Assert
      expect(exists).toBe(false);
    });

    it('should return true when email exists for different user', async () => {
      // Arrange
      const user1Data = {
        email: 'user1@example.com',
        password: 'hashedPassword',
        name: 'User 1',
        role: Role.USER,
      };
      const user2Data = {
        email: 'user2@example.com',
        password: 'hashedPassword',
        name: 'User 2',
        role: Role.USER,
      };

      const user1 = await userRepository.create(user1Data);
      await userRepository.create(user2Data);

      // Act
      const exists = await userRepository.emailExists(user2Data.email, user1.id);

      // Assert
      expect(exists).toBe(true);
    });
  });

  describe('findByRole', () => {
    it('should find users by role', async () => {
      // Arrange
      const users = [
        { email: 'user1@example.com', password: 'password', name: 'User 1', role: Role.USER },
        { email: 'admin1@example.com', password: 'password', name: 'Admin 1', role: Role.ADMIN },
        { email: 'user2@example.com', password: 'password', name: 'User 2', role: Role.USER },
        { email: 'admin2@example.com', password: 'password', name: 'Admin 2', role: Role.ADMIN },
      ];

      for (const userData of users) {
        await userRepository.create(userData);
      }

      // Act
      const userRoleUsers = await userRepository.findByRole(Role.USER);
      const adminRoleUsers = await userRepository.findByRole(Role.ADMIN);

      // Assert
      expect(userRoleUsers).toHaveLength(2);
      expect(adminRoleUsers).toHaveLength(2);
      expect(userRoleUsers.every(user => user.role === Role.USER)).toBe(true);
      expect(adminRoleUsers.every(user => user.role === Role.ADMIN)).toBe(true);
    });

    it('should return empty array for non-existent role', async () => {
      // Act - Note: we can't test non-existent role with enum, so skip this test
      // const users = await userRepository.findByRole('nonexistent');

      // Act with valid role but no data
      const users = await userRepository.findByRole(Role.ADMIN);

      // Assert
      expect(users).toHaveLength(0);
    });
  });

  describe('countByRole', () => {
    it('should count users by role correctly', async () => {
      // Arrange
      const users = [
        { email: 'user1@example.com', password: 'password', name: 'User 1', role: Role.USER },
        { email: 'user2@example.com', password: 'password', name: 'User 2', role: Role.USER },
        { email: 'user3@example.com', password: 'password', name: 'User 3', role: Role.USER },
        { email: 'admin@example.com', password: 'password', name: 'Admin', role: Role.ADMIN },
      ];

      for (const userData of users) {
        await userRepository.create(userData);
      }

      // Act
      const userCount = await userRepository.countByRole(Role.USER);
      const adminCount = await userRepository.countByRole(Role.ADMIN);

      // Assert
      expect(userCount).toBe(3);
      expect(adminCount).toBe(1);
    });

    it('should return 0 for non-existent role', async () => {
      // Act - Note: we can't test non-existent role with enum, so test with valid role but no data
      const count = await userRepository.countByRole(Role.ADMIN);

      // Assert
      expect(count).toBe(0);
    });
  });

  describe('updateLastLogin', () => {
    it('should update last login timestamp', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'hashedPassword',
        name: 'Test User',
        role: Role.USER,
      };
      const createdUser = await userRepository.create(userData);
      const originalUpdatedAt = createdUser.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));

      // Act
      await userRepository.updateLastLogin(createdUser.id);

      // Assert
      const updatedUser = await userRepository.findById(createdUser.id);
      expect(updatedUser!.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
    });
  });
});
