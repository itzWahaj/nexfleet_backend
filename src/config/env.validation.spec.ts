import { validateEnv } from './env.validation';

const validEnv = {
  NODE_ENV: 'test',
  PORT: '3000',
  DATABASE_URL: 'postgres://nexfleet:nexfleet@localhost:5432/nexfleet',
  REDIS_URL: 'redis://localhost:6379',
  JWT_ACCESS_SECRET: 'test-access-secret-16',
  JWT_REFRESH_SECRET: 'test-refresh-secret-16',
  JWT_ACCESS_EXPIRES_IN: '15m',
  JWT_REFRESH_EXPIRES_IN: '7d',
  FLASHIP_WEBHOOK_SECRET: 'test-webhook-secret',
};

describe('validateEnv', () => {
  it('accepts a complete env and coerces PORT', () => {
    const parsed = validateEnv(validEnv);
    expect(parsed.PORT).toBe(3000);
    expect(parsed.NODE_ENV).toBe('test');
  });

  it('treats empty optional keys as unset', () => {
    const parsed = validateEnv({
      ...validEnv,
      GOOGLE_MAPS_API_KEY: '',
      SENTRY_DSN: '',
    });
    expect(parsed.GOOGLE_MAPS_API_KEY).toBeUndefined();
    expect(parsed.SENTRY_DSN).toBeUndefined();
  });

  it('rejects a missing DATABASE_URL', () => {
    expect(() => validateEnv({ ...validEnv, DATABASE_URL: '' })).toThrow(
      /DATABASE_URL/,
    );
  });

  it('rejects a short JWT secret', () => {
    expect(() =>
      validateEnv({ ...validEnv, JWT_ACCESS_SECRET: 'short' }),
    ).toThrow(/JWT_ACCESS_SECRET/);
  });
});
