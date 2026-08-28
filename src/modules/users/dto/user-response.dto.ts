import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../common/types/auth';

export class UserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: '+923001234567' })
  phone!: string;

  @ApiProperty({ enum: UserRole })
  role!: UserRole;

  @ApiProperty({
    type: [String],
    description: 'Hub IDs assigned to hub_admin; empty for other roles',
  })
  hubIds!: string[];
}
