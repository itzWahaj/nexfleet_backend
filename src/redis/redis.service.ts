import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { AppConfig } from '../config/env.validation';

@Injectable()
export class RedisService implements OnModuleDestroy {
  public readonly client: Redis;

  constructor(config: ConfigService<AppConfig, true>) {
    this.client = new Redis(config.get('REDIS_URL', { infer: true }), {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
    });
  }

  ping(): Promise<string> {
    return this.client.ping();
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }
}
