import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ErrorCode } from '../errors/error-codes';
import { HUB_SCOPED_KEY } from '../decorators/hub-scoped.decorator';
import { AuthenticatedUser, HubScope, UserRole } from '../types/auth';

@Injectable()
export class HubScopeGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const hubScoped = this.reflector.getAllAndOverride<boolean>(
      HUB_SCOPED_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!hubScoped) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: AuthenticatedUser;
      hubScope?: HubScope | null;
      query?: Record<string, unknown>;
      body?: Record<string, unknown>;
    }>();

    const user = request.user;
    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    if (user.role === UserRole.SUPER_ADMIN) {
      request.hubScope = null;
      return true;
    }

    if (user.role !== UserRole.HUB_ADMIN) {
      throw new ForbiddenException({
        code: ErrorCode.FORBIDDEN_HUB_SCOPE,
        message: 'Hub scope not available for this role',
      });
    }

    request.hubScope = { hubIds: user.hubIds };
    this.rejectClientHubIdOutsideScope(request, user.hubIds);
    return true;
  }

  private rejectClientHubIdOutsideScope(
    request: {
      query?: Record<string, unknown>;
      body?: Record<string, unknown>;
    },
    allowedHubIds: string[],
  ): void {
    const clientHubId = this.extractClientHubId(request);
    if (!clientHubId) {
      return;
    }
    if (!allowedHubIds.includes(clientHubId)) {
      throw new ForbiddenException({
        code: ErrorCode.FORBIDDEN_HUB_SCOPE,
        message: 'Hub is outside your assigned scope',
      });
    }
  }

  private extractClientHubId(request: {
    query?: Record<string, unknown>;
    body?: Record<string, unknown>;
  }): string | null {
    const fromQuery = request.query?.hub_id ?? request.query?.hubId;
    if (typeof fromQuery === 'string' && fromQuery.length > 0) {
      return fromQuery;
    }
    const fromBody = request.body?.hub_id ?? request.body?.hubId;
    if (typeof fromBody === 'string' && fromBody.length > 0) {
      return fromBody;
    }
    return null;
  }
}
