import { ApiProperty } from '@nestjs/swagger';
import { Coins } from 'src/coins/entities/coin.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'volume_bot_settings' })
export class VolumeBotSettings {
  @ApiProperty({ description: 'Internal ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Coin for this bot' })
  @ManyToOne(() => Coins, { eager: true })
  @JoinColumn({ name: 'coin_id' })
  coin: Coins;

  @ApiProperty({ description: 'Manual reference price', example: 100.25 })
  @Column({ type: 'decimal', precision: 18, scale: 8, nullable: true })
  refPriceManual: string | null;

  @ApiProperty({ description: 'Currency throttle (e.g., USDT)' })
  @Column({ type: 'varchar', length: 20, default: '' })
  currencyThrottle: string;

  @ApiProperty({ description: 'Token throttle (e.g., BTC)' })
  @Column({ type: 'varchar', length: 20, default: '' })
  tokenThrottle: string;

  @ApiProperty({ description: 'Minimum execution timing (in seconds)' })
  @Column({ type: 'int', default: 0 })
  executionTimingMin: number;

  @ApiProperty({ description: 'Maximum execution timing (in seconds)' })
  @Column({ type: 'int', default: 0 })
  executionTimingMax: number;

  @ApiProperty({ description: 'Minimum trade amount' })
  @Column({ type: 'decimal', precision: 18, scale: 8, default: '0' })
  tradeAmountMin: string;

  @ApiProperty({ description: 'Maximum trade amount' })
  @Column({ type: 'decimal', precision: 18, scale: 8, default: '0' })
  tradeAmountMax: string;

  @ApiProperty({ description: 'Trade flow type (buy/sell/mixed)' })
  @Column({ type: 'varchar', length: 50, default: '' })
  tradeFlow: string;

  @ApiProperty({ description: '24H volume limit' })
  @Column({ type: 'decimal', precision: 18, scale: 8, default: '0' })
  volumeLimit24H: string;

  @ApiProperty({ description: 'Max allowed lag (in ms)' })
  @Column({ type: 'int', default: 0 })
  maxLag: number;

  @ApiProperty({ description: 'Max ref price diff percent' })
  @Column({ type: 'decimal', precision: 5, scale: 2, default: '0.00' })
  refPriceDiffPercentMax: string;

  @ApiProperty({ description: 'Bot version' })
  @Column({ type: 'varchar', length: 20, default: '' })
  version: string;

  @ApiProperty({ description: 'Bot version' })
  @Column({ type: 'smallint', default: 0 })
  status: number;

  @ApiProperty({
    description: 'API credentials (stored as JSON)',
    example: { apiKey: 'xxx', secretKey: 'yyy', apiKeyId: 'zzz' },
  })
  @Column({
    type: 'json',
    nullable: true,
  })
  creds: {
    apiKey: string;
    secretKey: string;
    apiKeyId?: string;
  } = { apiKey: '', secretKey: '', apiKeyId: '' };

  @ApiProperty({ description: 'Created date in DB' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
