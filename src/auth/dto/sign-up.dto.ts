import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsEnum,
  IsIP,
  IsNotEmpty,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserPermission } from 'src/users/entities/user.entity';

// import { Match } from '../../common/decorators/match.decorator';

export class SignUpDto {
  @ApiProperty({
    description: 'Custom user ID',
    example: 'admin123',
  })
  @IsNotEmpty({ message: 'id is required' })
  @MaxLength(50)
  readonly id: string;

  @ApiProperty({
    example: ['123.23.23.1', '192.168.1.1'],
    description: 'List of user IP addresses',
    isArray: true,
    type: String,
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsIP(undefined, { each: true })
  readonly ips: string[];

  @ApiProperty({
    description: 'Password of user',
    example: 'Pass#123',
  })
  @MinLength(8, {
    message: 'password too short',
  })
  @MaxLength(20, {
    message: 'password too long',
  })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'password too weak',
  })
  @IsNotEmpty()
  readonly pw: string;

  @ApiProperty({
    description: 'Permissions assigned to the user',
    enum: UserPermission,
    isArray: true,
    example: [UserPermission.ADMIN, UserPermission.BALANCES],
  })
  @IsEnum(UserPermission, { each: true })
  readonly perms: UserPermission[];
}

export class CreateUserDto {
  @ApiProperty({
    description: 'Custom user ID',
    example: 'admin123',
  })
  @IsNotEmpty({ message: 'id is required' })
  @MaxLength(50)
  readonly id: string;

  @ApiProperty({
    example: ['123.23.23.1', '192.168.1.1'],
    description: 'List of user IP addresses',
    isArray: true,
    type: String,
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsIP(undefined, { each: true })
  readonly ips: string[];

  @ApiProperty({
    description: 'Permissions assigned to the user',
    enum: UserPermission,
    isArray: true,
    example: [UserPermission.ADMIN, UserPermission.BALANCES],
  })
  @IsEnum(UserPermission, { each: true })
  readonly perms: UserPermission[];
}

export class UpdateUserDto {
  @ApiProperty({
    description: 'Custom user ID',
    example: 'admin123',
  })
  @IsNotEmpty({ message: 'id is required' })
  @MaxLength(50)
  readonly id: string;

  @ApiProperty({
    example: ['123.23.23.1', '192.168.1.1'],
    description: 'List of user IP addresses',
    isArray: true,
    type: String,
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsIP(undefined, { each: true })
  readonly ips: string[];

  @ApiProperty({
    description: 'Permissions assigned to the user',
    enum: UserPermission,
    isArray: true,
    example: [UserPermission.ADMIN, UserPermission.BALANCES],
  })
  @IsEnum(UserPermission, { each: true })
  readonly perms: UserPermission[];
}