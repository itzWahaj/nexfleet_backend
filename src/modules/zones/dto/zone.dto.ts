import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { GeoJsonPolygonDto } from '../../../common/dto/geo.dto';

export class CreateRegionDto {
  @ApiProperty({ example: 'Karachi' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  city!: string;

  @ApiProperty({ example: 'Central Karachi' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ type: GeoJsonPolygonDto })
  @ValidateNested()
  @Type(() => GeoJsonPolygonDto)
  boundary!: GeoJsonPolygonDto;
}

export class UpdateRegionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ type: GeoJsonPolygonDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => GeoJsonPolygonDto)
  boundary?: GeoJsonPolygonDto;
}

export class CreateAreaDto {
  @ApiProperty({ example: 'Gulshan Block 1' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ type: GeoJsonPolygonDto })
  @ValidateNested()
  @Type(() => GeoJsonPolygonDto)
  boundary!: GeoJsonPolygonDto;
}

export class UpdateAreaDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ type: GeoJsonPolygonDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => GeoJsonPolygonDto)
  boundary?: GeoJsonPolygonDto;
}
