import { ApiProperty } from '@nestjs/swagger';
import { VolumeBotSettings } from 'src/vol_bot_setting/entities/vol-bot-setting.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

export enum Exchange {
  MEXC = 'MEXC',
  HTX = 'HTX',
  BINANCE = 'BINANCE',
}

export enum Status {
  ON = 'ON',
  OFF = 'OFF',
}

@Entity({ name: 'coins' })
@Unique(['exchange', 'symbol'])
export class Coins {
  @ApiProperty({ description: 'Internal ID' })
  @PrimaryGeneratedColumn()
  id: number;

  // 🔹 Option A: keep userId as raw string
  @ApiProperty({ description: 'User ID from system' })
  @Column({ type: 'varchar', length: 100 })
  userId: string;

  // 🔹 Option B: proper relation (recommended)
  // @ManyToOne(() => User, (user) => user.coins, { onDelete: 'CASCADE' })
  // user: User;

  @ApiProperty({
    description: 'Exchange for coins (MEXC, HTX, BINANCE)',
    enum: Exchange,
  })
  @Column({ type: 'enum', enum: Exchange })
  exchange: Exchange;

  @ApiProperty({ description: 'Trading pair symbol', example: 'LFUSDT' })
  @Column({ type: 'varchar', length: 20 })
  symbol: string;

  @ApiProperty({ description: 'Name for coin', example: 'LF LABS' })
  @Column({ type: 'text', nullable: true })
  name: string;

  @ApiProperty({ description: 'Icon for coin', example: '' })
  @Column({ type: 'text', nullable: true })
  icon: string;

  @ApiProperty({ description: 'Coins status', enum: Status })
  @Column({ type: 'enum', enum: Status, default: Status.OFF })
  status: Status;

  @ApiProperty({ description: 'Created date in DB' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /** ✅ Use a lazy function, no direct import */
  @OneToMany(
    () => require('../../vol_bot_setting/entities/vol-bot-setting.entity').VolumeBotSettings,
    (setting: VolumeBotSettings) => setting.coin,
  )
  volBotSettings: any;
}
