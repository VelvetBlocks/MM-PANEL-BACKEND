import { ApiProperty } from '@nestjs/swagger';
import { Exchange } from 'src/coins/entities/coin.entity';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Index } from 'typeorm';

export enum ORDER_LOG_TYPE {
  Error = 'ERROR',
  Warning = 'WARNING',
  Info = 'INFO',
}

@Entity({ name: 'order_logs' })
export class OrderLog {
  @ApiProperty({ description: 'Internal ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Exchange for coins (MEXC, HTX, BINANCE)',
    enum: Exchange,
  })
  @Column({ type: 'enum', enum: Exchange })
  exchange: Exchange;

  @ApiProperty({ description: 'Trading pair symbol', example: 'LFUSDT' })
  @Column({ type: 'varchar', length: 20 })
  symbol: string;

  @ApiProperty({
    description: 'Order log type (ERROR or WARNING or INFO)',
    enum: ORDER_LOG_TYPE,
  })
  @Column({ type: 'enum', enum: ORDER_LOG_TYPE })
  type: ORDER_LOG_TYPE;

  @ApiProperty({ description: 'Text for log' })
  @Column({ type: 'text' })
  text: string;

  @ApiProperty({ description: 'Order date (YYYY-MM-DD)' })
  @Column({ type: 'date', name: 'order_date', nullable: true })
  orderDate: Date;

  @ApiProperty({ description: 'Created date in DB' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
