import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { AppConfig } from '../../config/env.validation';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from '../../common/types/auth';

@Injectable()
export class AuthCookieService {
  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  setAuthCookies(
    response: Response,
    tokens: { accessToken: string; refreshToken: string },
  ): void {
    const isProduction =
      this.config.get('NODE_ENV', { infer: true }) === 'production';
    const accessMaxAge = this.parseDurationMs(
      this.config.get('JWT_ACCESS_EXPIRES_IN', { infer: true }),
    );
    const refreshMaxAge = this.parseDurationMs(
      this.config.get('JWT_REFRESH_EXPIRES_IN', { infer: true }),
    );

    const baseOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      path: '/',
    };

    response.cookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
      ...baseOptions,
      maxAge: accessMaxAge,
    });
    response.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
      ...baseOptions,
      maxAge: refreshMaxAge,
    });
  }

  clearAuthCookies(response: Response): void {
    const isProduction =
      this.config.get('NODE_ENV', { infer: true }) === 'production';
    const baseOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      path: '/',
    };
    response.clearCookie(ACCESS_TOKEN_COOKIE, baseOptions);
    response.clearCookie(REFRESH_TOKEN_COOKIE, baseOptions);
  }

  private parseDurationMs(value: string): number {
    const match = /^(\d+)([smhd])$/.exec(value.trim());
    if (!match) {
      return 15 * 60 * 1000;
    }
    const amount = Number(match[1]);
    switch (match[2]) {
      case 's':
        return amount * 1000;
      case 'm':
        return amount * 60 * 1000;
      case 'h':
        return amount * 60 * 60 * 1000;
      case 'd':
        return amount * 24 * 60 * 60 * 1000;
      default:
        return 15 * 60 * 1000;
    }
  }
}
