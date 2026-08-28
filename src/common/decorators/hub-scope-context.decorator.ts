import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { HubScope } from '../types/auth';

export const HubScopeContext = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): HubScope | null => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ hubScope?: HubScope | null }>();
    return request.hubScope ?? null;
  },
);
