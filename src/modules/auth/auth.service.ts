import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { UserService } from '@/user/user.service';
import { HashUtil } from '@/shared/utils/hash';
import { config } from '@/shared/config/environment';
import { JwtPayload } from '@/shared/types/common';
import { UnauthorizedError } from '@/shared/middleware/error-handler';
import { Service } from '@/shared/core/container';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
  };
  tokens: AuthTokens;
}

@Service('AuthService')
export class AuthService {
  constructor(private readonly userService: UserService) {}

  async login(email: string, password: string): Promise<LoginResponse> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isPasswordValid = await HashUtil.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      tokens,
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = jwt.verify(refreshToken, config.jwt.refreshSecret) as JwtPayload;

      // Verify user still exists
      const user = await this.userService.findById(payload.userId);
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      return this.generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role,
      });
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid refresh token');
      }
      throw error;
    }
  }

  private generateTokens(payload: Omit<JwtPayload, 'iat' | 'exp'>): AuthTokens {
    const now = Date.now();

    const signOptions: any = {
      expiresIn: config.jwt.expiresIn,
    };

    const refreshOptions: any = {
      expiresIn: config.jwt.refreshExpiresIn,
    };

    const accessToken = jwt.sign({ ...payload, timestamp: now }, config.jwt.secret, signOptions);

    const refreshToken = jwt.sign(
      { ...payload, timestamp: now },
      config.jwt.refreshSecret,
      refreshOptions
    );

    return { accessToken, refreshToken };
  }

  setTokenCookies(res: Response, tokens: AuthTokens): void {
    const isProduction = config.nodeEnv === 'production';

    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
  }

  clearTokenCookies(res: Response): void {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
  }
}
