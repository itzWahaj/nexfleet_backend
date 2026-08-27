import { DataSource } from 'typeorm';
import { RedisService } from '../redis/redis.service';
import { HealthService } from './health.service';

describe('HealthService', () => {
  const query = jest.fn();
  const ping = jest.fn();
  let service: HealthService;

  beforeEach(() => {
    query.mockReset();
    ping.mockReset();
    service = new HealthService(
      { query } as unknown as DataSource,
      { ping } as unknown as RedisService,
    );
  });

  it('reports ok when postgres, redis, and postgis all respond', async () => {
    query.mockImplementation(async (sql: string) => {
      if (sql.includes('PostGIS_Version')) {
        return [{ version: '3.4 USE_GEOS=1' }];
      }
      return [{ '?column?': 1 }];
    });
    ping.mockResolvedValue('PONG');

    await expect(service.ready()).resolves.toEqual({
      status: 'ok',
      postgres: 'up',
      redis: 'up',
      postgis: 'up',
    });
  });

  it('reports degraded when a dependency is down', async () => {
    query.mockRejectedValue(new Error('ECONNREFUSED'));
    ping.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(service.ready()).resolves.toEqual({
      status: 'degraded',
      postgres: 'down',
      redis: 'down',
      postgis: 'down',
    });
  });
});
