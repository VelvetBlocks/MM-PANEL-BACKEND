import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsDefined,
  ValidateIf,
  IsOptional,
  MaxLength,
  IsEnum,
  IsInt,
  IsIn,
} from 'class-validator';
import { Exchange } from 'src/coins/entities/coin.entity';
import { ORDER_SIDE, ORDER_TYPE } from 'src/order/entities/order.entity';

export class CreateOrderDto {
  @ApiProperty({
    description: 'Exchange for coin',
    enum: Exchange,
    example: Exchange.MEXC,
  })
  @IsEnum(Exchange, { message: 'Exchange must be one of MEXC, HTX, BINANCE' })
  exchange: Exchange;

  @ApiProperty({
    description: 'Trading pair symbol',
    example: 'LFUSDT',
  })
  @IsString()
  @IsNotEmpty()
  readonly symbol: string;

  @ApiProperty({
    description: 'Order side',
    example: 'BUY',
    enum: ORDER_SIDE,
  })
  @IsString()
  @IsNotEmpty()
  @IsEnum(ORDER_SIDE)
  readonly side: ORDER_SIDE;

  @ApiProperty({
    description: 'Exchange for coin',
    enum: ORDER_TYPE,
    example: ORDER_TYPE.Limit,
  })
  @IsNotEmpty()
  @IsNotEmpty()
  @IsEnum(ORDER_TYPE, {
    message: `Type must be one of ${ORDER_TYPE.Limit}, ${ORDER_TYPE.Market}`,
  })
  type: ORDER_TYPE;

  @ApiProperty({
    description: 'Order quantity (string to maintain precision)',
    example: '1000',
  })
  @IsString()
  @IsNotEmpty()
  readonly quantity: string;

  @ApiProperty({
    description: 'Order price (required for LIMIT orders, string to maintain precision)',
    example: '0.00023',
    required: false,
  })
  @ValidateIf((o) => o.type === 'LIMIT')
  @IsDefined({ message: 'Price is mandatory for a LIMIT order.' })
  @IsString()
  @IsNotEmpty()
  readonly price?: string;

  @ApiProperty({ description: 'No cancel order', example: 0, enum: [0, 1] })
  @IsInt({ message: 'no_cancel must be an integer' })
  @IsIn([0, 1], { message: 'no_cancel must be 0 or 1' })
  no_cancel: number;

  @ApiProperty({
    description: 'Optional client order ID (max 64 chars)',
    required: false,
    example: 'custom-order-id-123',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  readonly newClientOrderId?: string;
}
