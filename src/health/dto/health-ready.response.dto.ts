import { ApiProperty } from '@nestjs/swagger';

export class HealthReadyResponseDto {
  @ApiProperty({ enum: ['ok', 'degraded'] })
  status!: 'ok' | 'degraded';

  @ApiProperty({ enum: ['up', 'down'] })
  postgres!: 'up' | 'down';

  @ApiProperty({ enum: ['up', 'down'] })
  redis!: 'up' | 'down';

  @ApiProperty({ enum: ['up', 'down'] })
  postgis!: 'up' | 'down';
}

export type DependencyStatus = 'up' | 'down';
