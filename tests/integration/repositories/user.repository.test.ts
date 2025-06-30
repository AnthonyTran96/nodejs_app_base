import { UserRepository } from '../../../src/repositories/user.repository';
import { DatabaseConnection } from '../../../src/database/connection';

describe('UserRepository Integration Tests', () => {
  let userRepository: UserRepository;
  let dbConnection: DatabaseConnection;

  beforeAll(() => {
    userRepository = new UserRepository();
    dbConnection = DatabaseConnection.getInstance();
  });

  beforeEach(async () => {
    // Clean database before each test
    await dbConnection.execute('DELETE FROM users');
  });

  describe('create and findById', () => {
    it('should create and retrieve a user', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'hashedPassword',
        name: 'Test User',
        role: 'user',
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

      // Verify we can find the user
      const foundUser = await userRepository.findById(createdUser.id);
      expect(foundUser).toMatchObject(createdUser);
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'hashedPassword',
        name: 'Test User',
        role: 'user',
      };
      await userRepository.create(userData);

      // Act
      const foundUser = await userRepository.findByEmail(userData.email);

      // Assert
      expect(foundUser).not.toBeNull();
      expect(foundUser?.email).toBe(userData.email);
    });

    it('should return null for non-existent email', async () => {
      // Act
      const foundUser = await userRepository.findByEmail('nonexistent@example.com');

      // Assert
      expect(foundUser).toBeNull();
    });
  });

  describe('emailExists', () => {
    it('should return true for existing email', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'hashedPassword',
        name: 'Test User',
        role: 'user',
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
        role: 'user',
      };
      const user = await userRepository.create(userData);

      // Act
      const exists = await userRepository.emailExists(userData.email, user.id);

      // Assert
      expect(exists).toBe(false);
    });
  });

  describe('countByRole', () => {
    it('should count users by role correctly', async () => {
      // Arrange
      await userRepository.create({
        email: 'user1@example.com',
        password: 'password',
        name: 'User 1',
        role: 'user',
      });
      await userRepository.create({
        email: 'user2@example.com',
        password: 'password',
        name: 'User 2',
        role: 'user',
      });
      await userRepository.create({
        email: 'admin@example.com',
        password: 'password',
        name: 'Admin',
        role: 'admin',
      });

      // Act
      const userCount = await userRepository.countByRole('user');
      const adminCount = await userRepository.countByRole('admin');

      // Assert
      expect(userCount).toBe(2);
      expect(adminCount).toBe(1);
    });
  });
}); 