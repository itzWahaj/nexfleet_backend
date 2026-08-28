import { SetMetadata } from '@nestjs/common';

export const HUB_SCOPED_KEY = 'hubScoped';

/** Route participates in hub-scoping; HubScopeGuard attaches scope from JWT */
export const HubScoped = () => SetMetadata(HUB_SCOPED_KEY, true);
