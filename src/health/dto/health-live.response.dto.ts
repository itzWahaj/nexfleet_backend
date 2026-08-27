import { ApiProperty } from '@nestjs/swagger';

export class HealthLiveResponseDto {
  @ApiProperty({ example: 'ok' })
  status!: 'ok';

  @ApiProperty({ example: 12 })
  uptimeSeconds!: number;
}
