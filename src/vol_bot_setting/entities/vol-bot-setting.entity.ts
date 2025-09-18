import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { Coins } from 'src/coins/entities/coin.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum TRADE_FLOW {
  Buy_Sell = 'BUY_SELL',
  Sell_Buy = 'SELL_BUY',
  Mixed = 'MIXED',
}

@Entity({ name: 'volume_bot_settings' })
export class VolumeBotSettings {
  @ApiProperty({ description: 'Internal ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Coins, (coin) => coin.volBotSettings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'coin_id' })
  coin: Coins;

  @ApiProperty({
    description: 'Available Token balance (some APIs duplicate free, but keep separate)',
  })
  @Column('decimal', { precision: 30, scale: 15, default: 0 })
  token_balance: number;

  @ApiProperty({
    description: 'Available USDT balance (some APIs duplicate free, but keep separate)',
  })
  @Column('decimal', { precision: 30, scale: 15, default: 0 })
  usdt_balance: number;

  @ApiProperty({ description: 'Price decimal for coin', example: 8 })
  @Column({ type: 'smallint' })
  priceDecimal: number;

  @ApiProperty({ description: 'Quantity decimal for coin', example: 8 })
  @Column({ type: 'smallint' })
  quantityDecimal: number;

  @ApiProperty({ description: 'Amount decimal for coin', example: 8 })
  @Column({ type: 'smallint' })
  amountDecimal: number;

  @ApiProperty({ description: 'Currency minus throttle (e.g., USDT)', example: '0.5' })
  @Column({ type: 'decimal', precision: 30, scale: 8, default: 0 })
  currencyThrottleMinus: string;

  @ApiProperty({ description: 'Currency plus throttle (e.g., USDT)', example: '1.25' })
  @Column({ type: 'decimal', precision: 30, scale: 8, default: 0 })
  currencyThrottlePlus: string;

  @ApiProperty({ description: 'Token minus throttle (e.g., LF)', example: '10.0' })
  @Column({ type: 'decimal', precision: 30, scale: 8, default: 0 })
  tokenThrottleMinus: string;

  @ApiProperty({ description: 'Token plus throttle (e.g., LF)', example: '20.0' })
  @Column({ type: 'decimal', precision: 30, scale: 8, default: 0 })
  tokenThrottlePlus: string;

  @ApiProperty({ description: 'Manual reference price', example: 100.25 })
  @Column({ type: 'decimal', precision: 18, scale: 8, nullable: true })
  refPriceManual: string | null;

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

  @ApiProperty({
    description: 'Tread flow type (BUY_SELL, SELL_BUY or MIXED)',
    enum: TRADE_FLOW,
  })
  @Column({ type: 'enum', enum: TRADE_FLOW, default: TRADE_FLOW.Mixed })
  tradeFlow: TRADE_FLOW;

  @ApiProperty({ description: 'Trade param for buy sell calculation' })
  @Column({ type: 'float', default: 0.0 })
  tradeParam: number;

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
 @Expose({ groups: ['withCreds'] }) // ONLY shown when we ask for this group
  creds: { apiKey: string; secretKey: string; apiKeyId?: string };

  @ApiProperty({ description: 'Created date in DB' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  token_balance_locked?: number;
  usdt_balance_locked?: number;
  token_balance_free?: number;
  usdt_balance_free?: number;
  change_token_balance?: number;
  change_usdt_balance?: number;
}
