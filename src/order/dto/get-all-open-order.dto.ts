import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsInt, IsNotEmpty, IsString } from 'class-validator';
import { Exchange } from 'src/coins/entities/coin.entity';

export class GetAllOpenOrderDto {
  @ApiProperty({
    description: 'Exchange for coin',
    enum: Exchange,
    example: Exchange.MEXC,
  })
  @IsNotEmpty()
  @IsEnum(Exchange, { message: 'Exchange must be one of MEXC, HTX, BINANCE' })
  exchange: Exchange;

  @ApiProperty({ description: 'Trading pair symbol', example: 'LFUSDT' })
  @IsString()
  @IsNotEmpty()
  symbol: string;
}
