import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ErrorCode } from '../errors/error-codes';
import { HUB_SCOPED_KEY } from '../decorators/hub-scoped.decorator';
import { HubScopeGuard } from './hub-scope.guard';
import { UserRole } from '../types/auth';

function mockContext(
  user: { userId: string; role: UserRole; hubIds: string[] } | undefined,
  options?: {
    hubScoped?: boolean;
    query?: Record<string, unknown>;
    body?: Record<string, unknown>;
  },
) {
  const request: {
    user?: typeof user;
    hubScope?: { hubIds: string[] } | null;
    query?: Record<string, unknown>;
    body?: Record<string, unknown>;
  } = {
    user,
    query: options?.query,
    body: options?.body,
  };

  const reflector = {
    getAllAndOverride: jest.fn((key: string) => {
      if (key === HUB_SCOPED_KEY) {
        return options?.hubScoped ?? false;
      }
      return undefined;
    }),
  } as unknown as Reflector;

  const guard = new HubScopeGuard(reflector);
  const context = {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  };

  return { guard, context, request };
}

describe('HubScopeGuard', () => {
  it('passes through when route is not hub-scoped', () => {
    const { guard, context } = mockContext(
      { userId: '1', role: UserRole.HUB_ADMIN, hubIds: ['hub-1'] },
      { hubScoped: false },
    );
    expect(guard.canActivate(context as never)).toBe(true);
  });

  it('sets unrestricted scope for super_admin', () => {
    const { guard, context, request } = mockContext(
      { userId: '1', role: UserRole.SUPER_ADMIN, hubIds: [] },
      { hubScoped: true },
    );
    expect(guard.canActivate(context as never)).toBe(true);
    expect(request.hubScope).toBeNull();
  });

  it('attaches hubIds for hub_admin', () => {
    const { guard, context, request } = mockContext(
      { userId: '1', role: UserRole.HUB_ADMIN, hubIds: ['hub-1', 'hub-2'] },
      { hubScoped: true },
    );
    expect(guard.canActivate(context as never)).toBe(true);
    expect(request.hubScope).toEqual({ hubIds: ['hub-1', 'hub-2'] });
  });

  it('rejects client hub_id outside assigned scope', () => {
    const { guard, context } = mockContext(
      { userId: '1', role: UserRole.HUB_ADMIN, hubIds: ['hub-1'] },
      { hubScoped: true, query: { hub_id: 'hub-999' } },
    );
    expect(() => guard.canActivate(context as never)).toThrow(
      ForbiddenException,
    );
    try {
      guard.canActivate(context as never);
    } catch (error) {
      const response = (error as ForbiddenException).getResponse() as {
        code: string;
      };
      expect(response.code).toBe(ErrorCode.FORBIDDEN_HUB_SCOPE);
    }
  });
});
