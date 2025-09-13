import { ApiProperty } from '@nestjs/swagger';
import { Exchange } from 'src/coins/entities/coin.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'balances' })
export class Balance {
  @ApiProperty({ description: 'Internal ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'User ID from system' })
  @Column()
  userId: string;

  @ApiProperty({
    description: 'Exchange for balance (MEXC, HTX, BINANCE)',
    enum: Exchange,
  })
  @Column({ type: 'enum', enum: Exchange })
  exchange: Exchange;

  @ApiProperty({ description: 'Asset symbol (USDT, USDC, BTC, ETH, etc.)' })
  @Index()
  @Column({ type: 'varchar', length: 20 })
  asset: string;

  @ApiProperty({ description: 'Free balance (available to trade)' })
  @Column('decimal', { precision: 30, scale: 15, default: 0 })
  free: number;

  @ApiProperty({ description: 'Locked balance (in open orders, staking, etc.)' })
  @Column('decimal', { precision: 30, scale: 15, default: 0 })
  locked: number;

  @ApiProperty({ description: 'Available balance (some APIs duplicate free, but keep separate)' })
  @Column('decimal', { precision: 30, scale: 15, default: 0 })
  available: number;

  @ApiProperty({ description: 'When this snapshot was created' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
