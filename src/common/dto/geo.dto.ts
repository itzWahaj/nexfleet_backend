import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsIn, IsNumber, Max, Min } from 'class-validator';

export class PointDto {
  @ApiProperty({ example: 67.0011, description: 'Longitude (WGS84)' })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng!: number;

  @ApiProperty({ example: 24.8607, description: 'Latitude (WGS84)' })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;
}

export class GeoJsonPolygonDto {
  @ApiProperty({ enum: ['Polygon'] })
  @IsIn(['Polygon'])
  type!: 'Polygon';

  @ApiProperty({
    description: 'GeoJSON polygon coordinates [ring][point][lng, lat]',
  })
  @IsArray()
  coordinates!: number[][][];
}
