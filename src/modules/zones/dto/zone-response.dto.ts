import { ApiProperty } from '@nestjs/swagger';
import { GeoJsonPolygonDto } from '../../../common/dto/geo.dto';

export class RegionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  city!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ type: GeoJsonPolygonDto })
  boundary!: GeoJsonPolygonDto;
}

export class AreaResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  regionId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ type: GeoJsonPolygonDto })
  boundary!: GeoJsonPolygonDto;
}

export class PaginatedRegionsResponseDto {
  @ApiProperty({ type: [RegionResponseDto] })
  items!: RegionResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;
}

export class PaginatedAreasResponseDto {
  @ApiProperty({ type: [AreaResponseDto] })
  items!: AreaResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;
}
