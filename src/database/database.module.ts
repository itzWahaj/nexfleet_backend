import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfig } from '../config/env.validation';
import { typeormNestOptions } from './typeorm.options';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) =>
        typeormNestOptions(
          config.get('DATABASE_URL', { infer: true }),
          config.get('NODE_ENV', { infer: true }),
        ),
    }),
  ],
})
export class DatabaseModule {}
