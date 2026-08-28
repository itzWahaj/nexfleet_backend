import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../../config/env.validation';
import {
  ACCESS_TOKEN_COOKIE,
  AuthenticatedUser,
  UserRole,
} from '../../../common/types/auth';

interface JwtPayload {
  sub: string;
  role: UserRole;
  hub_ids?: string[];
}

function extractAccessToken(request: Request): string | null {
  const cookieToken = request.cookies?.[ACCESS_TOKEN_COOKIE] as
    string | undefined;
  if (cookieToken) {
    return cookieToken;
  }
  return ExtractJwt.fromAuthHeaderAsBearerToken()(request);
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService<AppConfig, true>) {
    super({
      jwtFromRequest: extractAccessToken,
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_ACCESS_SECRET', { infer: true }),
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    if (
      !payload.sub ||
      !payload.role ||
      !Object.values(UserRole).includes(payload.role)
    ) {
      throw new UnauthorizedException('Invalid access token');
    }

    return {
      userId: payload.sub,
      role: payload.role,
      hubIds: payload.hub_ids ?? [],
    };
  }
}
