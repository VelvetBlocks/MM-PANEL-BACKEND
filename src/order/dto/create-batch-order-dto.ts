import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsNotEmpty, ValidateNested, ArrayMinSize, ArrayMaxSize, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrderDto } from './create-order-dto';
import { Exchange } from 'src/coins/entities/coin.entity';

export class BatchOrderItemDto extends OmitType(CreateOrderDto, ['exchange'] as const) {}

export class CreateBatchOrderDto {
  @ApiProperty({
    description: 'Exchange for coin',
    enum: Exchange,
    example: Exchange.MEXC,
  })
  @IsEnum(Exchange, { message: 'Exchange must be one of MEXC, HTX, BINANCE' })
  exchange: Exchange;

  @ApiProperty({
    type: [BatchOrderItemDto],
    description: 'An array of up to 20 orders (without exchange field)',
    example: [
      {
        symbol: 'LFUSDT',
        side: 'BUY',
        type: 'LIMIT',
        quantity: '100',
        price: '0.000175',
        newClientOrderId: 'order-1',
      },
      {
        symbol: 'LFUSDT',
        side: 'SELL',
        type: 'LIMIT',
        quantity: '100',
        price: '0.000200',
        newClientOrderId: 'order-2',
      },
    ],
  })
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => BatchOrderItemDto)
  @IsNotEmpty()
  readonly batchOrders: BatchOrderItemDto[];
}
