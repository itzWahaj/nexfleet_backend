process.env.NODE_ENV ??= 'test';
process.env.PORT ??= '3000';
process.env.DATABASE_URL ??=
  'postgres://nexfleet:nexfleet@localhost:5433/nexfleet';
process.env.REDIS_URL ??= 'redis://localhost:6379';
process.env.JWT_ACCESS_SECRET ??= 'test-access-secret-16';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret-16';
process.env.JWT_ACCESS_EXPIRES_IN ??= '15m';
process.env.JWT_REFRESH_EXPIRES_IN ??= '7d';
process.env.FLASHIP_WEBHOOK_SECRET ??= 'test-webhook-secret';
process.env.FRONTEND_URL ??= 'http://localhost:3001';
