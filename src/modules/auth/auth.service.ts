import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AppConfig } from '../../config/env.validation';
import {
  AuthenticatedUser,
  UserRole,
  UserStatus,
} from '../../common/types/auth';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

interface TokenPayload {
  sub: string;
  role: UserRole;
  hub_ids?: string[];
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  async login(
    phone: string,
    password: string,
  ): Promise<{
    user: UserResponseDto;
    tokens: { accessToken: string; refreshToken: string };
  }> {
    const user = await this.usersService.findActiveByPhone(phone);
    if (!user) {
      throw new UnauthorizedException('Invalid phone or password');
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid phone or password');
    }

    const hubIds = await this.resolveHubIds(user);
    const tokens = await this.issueTokens(user, hubIds);
    return {
      user: this.toUserResponse(user, hubIds),
      tokens,
    };
  }

  async refresh(refreshToken: string): Promise<{
    user: UserResponseDto;
    tokens: { accessToken: string; refreshToken: string };
  }> {
    let payload: TokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<TokenPayload>(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET', { infer: true }),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const hubIds = await this.resolveHubIds(user);
    const tokens = await this.issueTokens(user, hubIds);
    return {
      user: this.toUserResponse(user, hubIds),
      tokens,
    };
  }

  async getProfile(userId: string): Promise<UserResponseDto> {
    const user = await this.usersService.requireById(userId);
    const hubIds = await this.resolveHubIds(user);
    return this.toUserResponse(user, hubIds);
  }

  buildAuthenticatedUser(user: User, hubIds: string[]): AuthenticatedUser {
    return {
      userId: user.id,
      role: user.role,
      hubIds,
    };
  }

  private async issueTokens(
    user: User,
    hubIds: string[],
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: TokenPayload = {
      sub: user.id,
      role: user.role,
      hub_ids: hubIds.length > 0 ? hubIds : undefined,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
        expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN', { infer: true }),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.get('JWT_REFRESH_SECRET', { infer: true }),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', { infer: true }),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async resolveHubIds(user: User): Promise<string[]> {
    if (user.role !== UserRole.HUB_ADMIN) {
      return [];
    }
    return this.usersService.getHubIdsForUser(user.id);
  }

  private toUserResponse(user: User, hubIds: string[]): UserResponseDto {
    return {
      id: user.id,
      phone: user.phone,
      role: user.role,
      hubIds,
    };
  }
}
