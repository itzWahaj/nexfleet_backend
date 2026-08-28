import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { PointDto } from '../../../common/dto/geo.dto';
import { HubOwnerType, HubStatus } from '../entities/hub.enums';

export class CreateHubDto {
  @ApiProperty({ example: 'Karachi Central Hub' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'Karachi' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  city!: string;

  @ApiProperty({ type: PointDto })
  @ValidateNested()
  @Type(() => PointDto)
  location!: PointDto;

  @ApiProperty({ enum: HubOwnerType })
  @IsEnum(HubOwnerType)
  ownerType!: HubOwnerType;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  ownerUserId?: string;

  @ApiPropertyOptional({ enum: HubStatus, default: HubStatus.ACTIVE })
  @IsOptional()
  @IsEnum(HubStatus)
  status?: HubStatus;
}

export class UpdateHubDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  city?: string;

  @ApiPropertyOptional({ type: PointDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PointDto)
  location?: PointDto;

  @ApiPropertyOptional({ enum: HubStatus })
  @IsOptional()
  @IsEnum(HubStatus)
  status?: HubStatus;
}
