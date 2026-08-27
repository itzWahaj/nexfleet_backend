import { join } from 'path';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';

/**
 * INVARIANT: `synchronize` must remain false.
 * Schema changes are TypeORM migrations, never auto-sync.
 */
const SYNCHRONIZE = false as const;

function assertNoSynchronize(synchronize: boolean): void {
  if (synchronize) {
    throw new Error(
      'INVARIANT VIOLATION: TypeORM synchronize must never be true',
    );
  }
}

export function typeormCliOptions(
  databaseUrl: string,
  nodeEnv: string,
): DataSourceOptions {
  assertNoSynchronize(SYNCHRONIZE);
  return {
    type: 'postgres',
    url: databaseUrl,
    synchronize: SYNCHRONIZE,
    migrationsRun: false,
    logging:
      nodeEnv === 'development' ? ['error', 'warn', 'migration'] : ['error'],
    entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
    migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  };
}

export function typeormNestOptions(
  databaseUrl: string,
  nodeEnv: string,
): TypeOrmModuleOptions {
  assertNoSynchronize(SYNCHRONIZE);
  return {
    type: 'postgres',
    url: databaseUrl,
    synchronize: SYNCHRONIZE,
    migrationsRun: false,
    autoLoadEntities: true,
    logging:
      nodeEnv === 'development' ? ['error', 'warn', 'migration'] : ['error'],
    retryAttempts: nodeEnv === 'production' ? 5 : 10,
    retryDelay: 3000,
    extra: {
      max: 10,
    },
  };
}
