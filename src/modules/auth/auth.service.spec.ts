import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UserRole, UserStatus } from '../../common/types/auth';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  const usersService = {
    findActiveByPhone: jest.fn(),
    findById: jest.fn(),
    requireById: jest.fn(),
    getHubIdsForUser: jest.fn(),
  } as unknown as UsersService;

  const jwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  } as unknown as JwtService;

  const config = {
    get: jest.fn((key: string) => {
      const values: Record<string, string> = {
        JWT_ACCESS_SECRET: 'test-access-secret-16',
        JWT_REFRESH_SECRET: 'test-refresh-secret-16',
        JWT_ACCESS_EXPIRES_IN: '15m',
        JWT_REFRESH_EXPIRES_IN: '7d',
      };
      return values[key];
    }),
  } as unknown as ConfigService;

  const service = new AuthService(usersService, jwtService, config as never);

  const activeUser: User = {
    id: 'user-1',
    phone: '+923001234567',
    passwordHash: 'hash',
    role: UserRole.SUPER_ADMIN,
    status: UserStatus.ACTIVE,
    createdAt: new Date(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    (usersService.getHubIdsForUser as jest.Mock).mockResolvedValue([]);
    (jwtService.signAsync as jest.Mock)
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');
  });

  it('login returns user and tokens for valid credentials', async () => {
    (usersService.findActiveByPhone as jest.Mock).mockResolvedValue(activeUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await service.login('+923001234567', 'Admin123!');

    expect(result.user.id).toBe('user-1');
    expect(result.tokens.accessToken).toBe('access-token');
    expect(result.tokens.refreshToken).toBe('refresh-token');
  });

  it('login rejects invalid password', async () => {
    (usersService.findActiveByPhone as jest.Mock).mockResolvedValue(activeUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      service.login('+923001234567', 'wrong-password'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('refresh re-issues tokens for a valid refresh token', async () => {
    (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
      sub: activeUser.id,
      role: activeUser.role,
    });
    (usersService.findById as jest.Mock).mockResolvedValue(activeUser);
    (jwtService.signAsync as jest.Mock)
      .mockReset()
      .mockResolvedValueOnce('new-access')
      .mockResolvedValueOnce('new-refresh');

    const result = await service.refresh('refresh-token');

    expect(result.tokens.accessToken).toBe('new-access');
    expect(result.user.phone).toBe(activeUser.phone);
  });
});
