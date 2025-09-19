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

@Entity({ name: 'users' })
export class User {
  @ApiProperty({
    description: 'Unique user ID',
    example: 'admin123',
  })
  @PrimaryColumn({ type: 'varchar', length: 100, nullable: false }) // manual, no auto-generation
  id: string;

  @ApiProperty({ description: 'IP addresses of user' })
  @Column('jsonb', { nullable: false })
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
  @Column({
    type: 'text',
    array: true, // PostgreSQL array type
    nullable: true,
  })
  perms: UserPermission[];

  @ApiProperty({ description: 'Created date of user' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated date of user' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
