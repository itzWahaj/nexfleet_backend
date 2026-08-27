import { z } from 'zod';

const emptyToUndefined = (value: unknown) =>
  value === '' || value === undefined ? undefined : value;

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z
    .string()
    .min(1)
    .refine(
      (value) =>
        value.startsWith('postgres://') || value.startsWith('postgresql://'),
      'DATABASE_URL must be a postgres connection string',
    ),
  REDIS_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  FLASHIP_WEBHOOK_SECRET: z.string().min(1),
  GOOGLE_MAPS_API_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
  FIREBASE_SERVICE_ACCOUNT_JSON: z.preprocess(
    emptyToUndefined,
    z.string().optional(),
  ),
  SENTRY_DSN: z.preprocess(emptyToUndefined, z.string().optional()),
});

export type AppConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): AppConfig {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const details = result.error.flatten().fieldErrors;
    throw new Error(
      `Invalid environment variables:\n${JSON.stringify(details, null, 2)}`,
    );
  }
  return result.data;
}
