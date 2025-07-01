import { UserRepository } from '@/user/user.repository';
import { UnitOfWork } from '@/core/unit-of-work';
import { HashUtil } from '@/utils/hash';
import { User, CreateUserRequest, UpdateUserRequest, UserResponse } from '@/models/user.model';
import { PaginationOptions, PaginatedResult } from '@/types/common';
import { ValidationError, NotFoundError } from '@/middleware/error-handler';
import { Service } from '@/core/container';
import { Role } from '@/types/role.enum';

@Service('UserService')
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly unitOfWork: UnitOfWork
  ) {}

  async findAll(options?: PaginationOptions): Promise<PaginatedResult<UserResponse>> {
    const result = await this.userRepository.findAll(options);

    return {
      data: result.data.map(user => this.toUserResponse(user)),
      meta: result.meta,
    };
  }

  async findById(id: number): Promise<UserResponse | null> {
    const user = await this.userRepository.findById(id);
    return user ? this.toUserResponse(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async create(userData: CreateUserRequest): Promise<UserResponse> {
    // Validate email uniqueness
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new ValidationError('Email already exists', {
        email: ['Email address is already in use'],
      });
    }

    // Hash password
    const hashedPassword = await HashUtil.hash(userData.password);

    const user = await this.userRepository.create({
      ...userData,
      password: hashedPassword,
    });

    return this.toUserResponse(user);
  }

  async update(id: number, userData: UpdateUserRequest): Promise<UserResponse> {
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new NotFoundError('User not found');
    }

    // Validate email uniqueness if email is being updated
    if (userData.email && userData.email !== existingUser.email) {
      const emailExists = await this.userRepository.emailExists(userData.email, id);
      if (emailExists) {
        throw new ValidationError('Email already exists', {
          email: ['Email address is already in use'],
        });
      }
    }

    const updatedUser = await this.userRepository.update(id, userData);
    if (!updatedUser) {
      throw new NotFoundError('User not found');
    }

    return this.toUserResponse(updatedUser);
  }

  async delete(id: number): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    await this.userRepository.delete(id);
  }

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    return this.unitOfWork.executeInTransaction(async () => {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      const isCurrentPasswordValid = await HashUtil.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new ValidationError('Invalid current password', {
          currentPassword: ['Current password is incorrect'],
        });
      }

      const hashedNewPassword = await HashUtil.hash(newPassword);
      await this.userRepository.update(userId, { password: hashedNewPassword });
    });
  }

  async getUserStats(): Promise<{ totalUsers: number; adminCount: number; userCount: number }> {
    const [totalUsers, adminCount, userCount] = await Promise.all([
      this.userRepository.findAll().then(result => result.meta.total),
      this.userRepository.countByRole(Role.ADMIN),
      this.userRepository.countByRole(Role.USER),
    ]);

    return {
      totalUsers,
      adminCount,
      userCount,
    };
  }

  private toUserResponse(user: User): UserResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
