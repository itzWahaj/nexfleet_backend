import { ApiProperty } from '@nestjs/swagger';
import { UserStatus } from '../../../common/types/auth';
import { RiderHubAssignmentStatus } from '../entities/rider.enums';

export class RiderHubAssignmentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  hubId!: string;

  @ApiProperty()
  isHomeHub!: boolean;

  @ApiProperty({ enum: RiderHubAssignmentStatus })
  status!: RiderHubAssignmentStatus;
}

export class RiderAreaAssignmentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  areaId!: string;

  @ApiProperty()
  assignedAt!: string;
}

export class RiderResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  phone!: string;

  @ApiProperty({ enum: UserStatus })
  status!: UserStatus;

  @ApiProperty({ type: [RiderHubAssignmentResponseDto] })
  hubAssignments!: RiderHubAssignmentResponseDto[];

  @ApiProperty({ type: [RiderAreaAssignmentResponseDto] })
  areaAssignments!: RiderAreaAssignmentResponseDto[];
}

export class PaginatedRidersResponseDto {
  @ApiProperty({ type: [RiderResponseDto] })
  items!: RiderResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;
}
