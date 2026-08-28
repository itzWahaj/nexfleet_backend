import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MinLength,
} from 'class-validator';
import { UserStatus } from '../../../common/types/auth';
import { RiderHubAssignmentStatus } from '../entities/rider.enums';

export class CreateRiderDto {
  @ApiProperty({ example: '+923001112233' })
  @IsString()
  @Matches(/^\+?[0-9]{10,15}$/)
  phone!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  hubId!: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isHomeHub?: boolean;
}

export class AssignRiderHubDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  hubId!: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isHomeHub?: boolean;

  @ApiPropertyOptional({ enum: RiderHubAssignmentStatus })
  @IsOptional()
  status?: RiderHubAssignmentStatus;
}

export class AssignRiderAreaDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  areaId!: string;
}

export class UpdateRiderDto {
  @ApiPropertyOptional({ enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
