import { INestApplication } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { ResponseInterceptor } from '../../src/common/interceptors/response.interceptor';
import { HealthController } from '../../src/health/health.controller';
import { HealthService } from '../../src/health/health.service';
import { RedisService } from '../../src/redis/redis.service';

describe('Health (e2e)', () => {
  let app: INestApplication;
  const query = jest.fn();
  const ping = jest.fn();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        HealthService,
        { provide: DataSource, useValue: { query } },
        { provide: RedisService, useValue: { ping } },
        { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
        { provide: APP_FILTER, useClass: HttpExceptionFilter },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    query.mockReset();
    ping.mockReset();
  });

  it('GET /api/v1/health returns the live envelope', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('ok');
    expect(typeof response.body.data.uptimeSeconds).toBe('number');
  });

  it('GET /api/v1/health/ready returns 200 when dependencies are up', async () => {
    query.mockImplementation(async (sql: string) => {
      if (sql.includes('PostGIS_Version')) {
        return [{ version: '3.4 USE_GEOS=1' }];
      }
      return [{ '?column?': 1 }];
    });
    ping.mockResolvedValue('PONG');

    const response = await request(app.getHttpServer())
      .get('/api/v1/health/ready')
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      data: {
        status: 'ok',
        postgres: 'up',
        redis: 'up',
        postgis: 'up',
      },
    });
  });

  it('GET /api/v1/health/ready returns 503 when dependencies are down', async () => {
    query.mockRejectedValue(new Error('ECONNREFUSED'));
    ping.mockRejectedValue(new Error('ECONNREFUSED'));

    const response = await request(app.getHttpServer())
      .get('/api/v1/health/ready')
      .expect(503);

    expect(response.body.success).toBe(false);
    expect(response.body.data.status).toBe('degraded');
  });
});
