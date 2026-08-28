export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  HUB_ADMIN = 'hub_admin',
  RIDER = 'rider',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';

export interface AuthenticatedUser {
  userId: string;
  role: UserRole;
  hubIds: string[];
}

/** null = unrestricted (super_admin); otherwise hub_id must be IN hubIds */
export interface HubScope {
  hubIds: string[];
}
