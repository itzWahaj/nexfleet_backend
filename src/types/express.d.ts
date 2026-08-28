import { AuthenticatedUser, HubScope } from '../common/types/auth';

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthenticatedUser;
    hubScope?: HubScope | null;
  }
}
