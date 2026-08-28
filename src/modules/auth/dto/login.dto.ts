import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: '+923001234567' })
  @IsString()
  @Matches(/^\+?[0-9]{10,15}$/, {
    message: 'phone must be a valid phone number',
  })
  phone!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}
