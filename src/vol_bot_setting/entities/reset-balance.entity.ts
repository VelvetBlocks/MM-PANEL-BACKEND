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

@Entity({ name: 'reset_balance_history' })
export class ResetBalanceHistory {
  @ApiProperty({ description: 'Internal ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Coins, (coin) => coin, { onDelete: 'CASCADE' })
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

  @ApiProperty({ description: 'Created date in DB' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
