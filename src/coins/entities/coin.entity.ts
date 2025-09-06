import { ApiProperty } from '@nestjs/swagger';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

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

  @ApiProperty({ description: 'User ID from system' })
  @Column()
  userId: string; // or use ManyToOne if linking with Users entity

  @ApiProperty({
    description: 'Exchange for coins (MEXC, HTX, BINANCE)',
    enum: Exchange,
  })
  @Column({ type: 'enum', enum: Exchange })
  exchange: Exchange;
  // priceDecimal / quentityDecimal / name / icon
  @ApiProperty({ description: 'Trading pair symbol', example: 'LFUSDT' })
  @Column({ type: 'varchar', length: 20 })
  symbol: string;

  @ApiProperty({ description: 'Name for coin', example: 'LF LABS' })
  @Column({ type: 'text', default: null })
  name: string;

  @ApiProperty({ description: 'Icon for coin', example: '' })
  @Column({ type: 'text', default: null })
  icon: string;

  @ApiProperty({ description: 'Price decimal for coin', example: 8 })
  @Column({ type: 'smallint', default: 12 })
  priceDecimal: number;

  @ApiProperty({ description: 'Quantity decimal for coin', example: 8 })
  @Column({ type: 'smallint', default: 12 })
  quantityDecimal: number;

  @ApiProperty({ description: 'Coins status', enum: Status })
  @Column({ type: 'enum', enum: Status, default: Status.ON })
  status: Status;

  @ApiProperty({ description: 'Created date in DB' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
