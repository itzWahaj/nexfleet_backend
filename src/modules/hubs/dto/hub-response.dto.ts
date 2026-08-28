import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HubOwnerType, HubStatus } from '../entities/hub.enums';

export class HubResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  city!: string;

  @ApiProperty({ description: 'Longitude (WGS84)' })
  lng!: number;

  @ApiProperty({ description: 'Latitude (WGS84)' })
  lat!: number;

  @ApiProperty({ enum: HubOwnerType })
  ownerType!: HubOwnerType;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  ownerUserId!: string | null;

  @ApiProperty({ enum: HubStatus })
  status!: HubStatus;
}

export class PaginatedHubsResponseDto {
  @ApiProperty({ type: [HubResponseDto] })
  items!: HubResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;
}
