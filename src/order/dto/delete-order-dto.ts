import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Exchange } from 'src/coins/entities/coin.entity';

export class CancelBatchOrderDto {
  @ApiProperty({
    description: 'Exchange for coin',
    enum: Exchange,
    example: Exchange.MEXC,
  })
  @IsEnum(Exchange, { message: 'Exchange must be one of MEXC, HTX, BINANCE' })
  exchange: Exchange;

  @ApiProperty({ description: 'Trading pair symbol', example: 'LFUSDT' })
  @IsString()
  @IsNotEmpty()
  symbol: string;

  @ApiProperty({ description: 'Order IDs to cancel', type: [String] })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  orderIds?: string[];
}
