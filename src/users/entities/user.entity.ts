import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserPermission {
  ADMIN = 'admin',
  CLIENT_USERS = 'client_users',
  BOT_CREATE = 'bot_create',
  BOT_DELETE = 'bot_delete',
  BOT_CREDENTIALS = 'bot_credentials',
  BOT_SETTINGS_WRITE = 'bot_settings_write',
  BOT_SETTINGS_READ = 'bot_settings_read',
  MANUAL_TRADE = 'manual_trade',
  BALANCES = 'balances',
  DASHBOARD = 'dashboard',
  BOT_DETAIL = 'bot_detail',
  SYSTEM_SETTINGS_WRITE = 'system_settings_write',
  SYSTEM_SETTINGS_READ = 'system_settings_read',
  BOT_START_STOP_RESET = 'bot_start_stop_reset',
}

@Entity({
  name: 'users',
})
export class User {
  @ApiProperty({
    description: 'ID of user',
    example: 'admin123',
  })
  @PrimaryColumn({ type: 'varchar', unique: true })
  id: string;

  // @ApiProperty({ description: 'Username of user', example: 'admin123' })
  // @Column({ unique: true })
  // username: string;

  @ApiProperty({ description: 'IP addresses of user' })
  @Column('json', { nullable: false })
  ips: string[] = [];

  @ApiHideProperty()
  @Column()
  @Exclude({ toPlainOnly: true })
  pw: string;

  @ApiProperty({
    description: 'Permissions of user',
    enum: UserPermission,
    isArray: true,
    example: [UserPermission.ADMIN, UserPermission.BOT_CREATE],
  })
  @Column('simple-array', { nullable: true })
  perms: UserPermission[];

  @ApiProperty({ description: 'Created date of user' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated date of user' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
