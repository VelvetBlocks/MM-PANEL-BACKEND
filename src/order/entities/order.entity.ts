import { ApiProperty } from '@nestjs/swagger';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Index } from 'typeorm';

export enum ORDER_SIDE {
  Buy = 'BUY',
  Sell = 'SELL',
}

export enum ORDER_TYPE {
  Limit = 'LIMIT',
  Market = 'MARKET',
}

@Entity({ name: 'orders' })
export class Order {
  @ApiProperty({ description: 'Internal ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'User ID from system' })
  @Column({ nullable: true })
  userId: string;

  @ApiProperty({ description: 'Exchange for order(MEXC, HTX)', required: true })
  @Column({ type: 'text', nullable: false })
  exchange?: string;

  @ApiProperty({
    description: 'Exchange-assigned order ID',
    example: '123456789',
  })
  @Index({ unique: true })
  @Column({ nullable: true })
  orderId: string;

  @ApiProperty({ description: 'Custom client order ID', example: 'buy-btc-1' })
  @Column({ nullable: true })
  newClientOrderId?: string;

  @ApiProperty({ description: 'Trading pair symbol', example: 'LFUSDT' })
  @Column()
  symbol: string;

  @ApiProperty({
    description: 'BUY or SELL',
    enum: ORDER_SIDE,
  })
  @Column({ type: 'enum', enum: ORDER_SIDE })
  side: ORDER_SIDE;

  @ApiProperty({
    description: 'Order type (LIMIT or MARKET)',
    enum: ORDER_TYPE,
  })
  @Column({ type: 'enum', enum: ORDER_TYPE })
  type: ORDER_TYPE;

  @ApiProperty({ description: 'Quantity of base asset' })
  @Column('decimal', { precision: 30, scale: 15 })
  quantity: string;

  @ApiProperty({ description: 'Price (for LIMIT orders)', required: false })
  @Column('decimal', { precision: 30, scale: 15, nullable: true })
  price?: string;

  @ApiProperty({
    description: 'Time in force (LIMIT orders)',
    example: 'GTC',
    required: false,
  })
  @Column({ nullable: true })
  timeInForce?: string;

  @ApiProperty({ description: 'Order status', example: 'NEW' })
  @Column({ default: 'NEW' })
  status: string;

  @ApiProperty({ description: 'Bot version' })
  @Column({ type: 'smallint', default: 0 })
  no_cancel: number;

  @ApiProperty({ description: 'Is bot order?' })
  @Column({ type: 'smallint', default: 0 })
  is_bot_order: number;

  @ApiProperty({
    description: 'Creation timestamp from exchange',
    required: false,
  })
  @Column({ type: 'bigint', nullable: true })
  exchangeCreatedAt?: number;

  @ApiProperty({ description: 'Created date in DB' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
