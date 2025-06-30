import { HashUtil } from '@/utils/hash';

describe('HashUtil', () => {
  describe('hash', () => {
    it('should hash a password successfully', async () => {
      // Arrange
      const password = 'testpassword123';

      // Act
      const hashedPassword = await HashUtil.hash(password);

      // Assert
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(0);
      expect(hashedPassword).toMatch(/^\$2[ab]\$\d+\$/); // bcrypt hash pattern
    });

    it('should generate different hashes for the same password', async () => {
      // Arrange
      const password = 'testpassword123';

      // Act
      const hash1 = await HashUtil.hash(password);
      const hash2 = await HashUtil.hash(password);

      // Assert
      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty string', async () => {
      // Arrange
      const password = '';

      // Act
      const hashedPassword = await HashUtil.hash(password);

      // Assert
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe('');
    });

    it('should handle special characters', async () => {
      // Arrange
      const password = '!@#$%^&*()_+-={}[]|\\:";\'<>?,./';

      // Act
      const hashedPassword = await HashUtil.hash(password);

      // Assert
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
    });

    it('should handle unicode characters', async () => {
      // Arrange
      const password = 'パスワード123مرحبا';

      // Act
      const hashedPassword = await HashUtil.hash(password);

      // Assert
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
    });
  });

  describe('compare', () => {
    it('should return true for correct password', async () => {
      // Arrange
      const password = 'testpassword123';
      const hashedPassword = await HashUtil.hash(password);

      // Act
      const isValid = await HashUtil.compare(password, hashedPassword);

      // Assert
      expect(isValid).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      // Arrange
      const password = 'testpassword123';
      const wrongPassword = 'wrongpassword';
      const hashedPassword = await HashUtil.hash(password);

      // Act
      const isValid = await HashUtil.compare(wrongPassword, hashedPassword);

      // Assert
      expect(isValid).toBe(false);
    });

    it('should return false for empty password against hash', async () => {
      // Arrange
      const password = 'testpassword123';
      const hashedPassword = await HashUtil.hash(password);

      // Act
      const isValid = await HashUtil.compare('', hashedPassword);

      // Assert
      expect(isValid).toBe(false);
    });

    it('should return false for password against empty hash', async () => {
      // Arrange
      const password = 'testpassword123';

      // Act
      const isValid = await HashUtil.compare(password, '');

      // Assert
      expect(isValid).toBe(false);
    });

    it('should return false for invalid hash format', async () => {
      // Arrange
      const password = 'testpassword123';
      const invalidHash = 'not-a-valid-hash';

      // Act
      const isValid = await HashUtil.compare(password, invalidHash);

      // Assert
      expect(isValid).toBe(false);
    });

    it('should handle case sensitivity correctly', async () => {
      // Arrange
      const password = 'TestPassword123';
      const hashedPassword = await HashUtil.hash(password);

      // Act
      const isValidSame = await HashUtil.compare('TestPassword123', hashedPassword);
      const isValidDifferentCase = await HashUtil.compare('testpassword123', hashedPassword);

      // Assert
      expect(isValidSame).toBe(true);
      expect(isValidDifferentCase).toBe(false);
    });

    it('should handle special characters correctly', async () => {
      // Arrange
      const password = '!@#$%^&*()_+-={}[]|\\:";\'<>?,./';
      const hashedPassword = await HashUtil.hash(password);

      // Act
      const isValid = await HashUtil.compare(password, hashedPassword);

      // Assert
      expect(isValid).toBe(true);
    });

    it('should handle unicode characters correctly', async () => {
      // Arrange
      const password = 'パスワード123مرحبا';
      const hashedPassword = await HashUtil.hash(password);

      // Act
      const isValid = await HashUtil.compare(password, hashedPassword);

      // Assert
      expect(isValid).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle very long passwords', async () => {
      // Arrange
      const longPassword = 'a'.repeat(1000);
      
      // Act
      const hashedPassword = await HashUtil.hash(longPassword);
      const isValid = await HashUtil.compare(longPassword, hashedPassword);

      // Assert
      expect(hashedPassword).toBeDefined();
      expect(isValid).toBe(true);
    });

    it('should be consistent across multiple hash/compare cycles', async () => {
      // Arrange
      const password = 'consistencytest123';

      // Act & Assert - Run multiple cycles
      for (let i = 0; i < 5; i++) {
        const hashedPassword = await HashUtil.hash(password);
        const isValid = await HashUtil.compare(password, hashedPassword);
        expect(isValid).toBe(true);
      }
    });
  });
}); 