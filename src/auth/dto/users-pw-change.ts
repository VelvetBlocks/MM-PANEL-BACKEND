import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Current password', example: 'oldPassword123' })
  @IsNotEmpty()
  readonly pw: string;

  @ApiProperty({ description: 'New password', example: 'newPassword456' })
  @IsNotEmpty()
  @MinLength(6)
  readonly pwNew: string;
}
