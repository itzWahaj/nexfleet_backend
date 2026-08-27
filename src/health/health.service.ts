import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { RedisService } from '../redis/redis.service';
import {
  DependencyStatus,
  HealthReadyResponseDto,
} from './dto/health-ready.response.dto';

@Injectable()
export class HealthService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly redis: RedisService,
  ) {}

  async ready(): Promise<HealthReadyResponseDto> {
    const [postgres, redis, postgis] = await Promise.all([
      this.checkPostgres(),
      this.checkRedis(),
      this.checkPostgis(),
    ]);
    const ok = postgres === 'up' && redis === 'up' && postgis === 'up';
    return {
      status: ok ? 'ok' : 'degraded',
      postgres,
      redis,
      postgis,
    };
  }

  private async checkPostgres(): Promise<DependencyStatus> {
    try {
      await this.dataSource.query('SELECT 1');
      return 'up';
    } catch {
      return 'down';
    }
  }

  private async checkRedis(): Promise<DependencyStatus> {
    try {
      const pong = await this.redis.ping();
      return pong === 'PONG' ? 'up' : 'down';
    } catch {
      return 'down';
    }
  }

  private async checkPostgis(): Promise<DependencyStatus> {
    try {
      const rows = (await this.dataSource.query(
        'SELECT PostGIS_Version() AS version',
      )) as Array<{ version?: string }>;
      return rows[0]?.version ? 'up' : 'down';
    } catch {
      return 'down';
    }
  }
}
