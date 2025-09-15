import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { Exchange } from 'src/coins/entities/coin.entity';
import { ORDER_LOG_TYPE } from '../entities/order-log.entity';

export class CreateOrderLogDto {
  @IsEnum(Exchange, { message: 'Exchange must be one of MEXC, HTX, BINANCE' })
  readonly exchange: Exchange;

  @IsString()
  @IsNotEmpty()
  readonly symbol: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(ORDER_LOG_TYPE)
  readonly type: ORDER_LOG_TYPE;

  @IsString()
  @IsOptional()
  readonly date?: string;

  @IsString()
  @IsNotEmpty()
  readonly text: string;
}

export class GetOrderLogDto {
  @IsEnum(Exchange, { message: 'Exchange must be one of MEXC, HTX, BINANCE' })
  readonly exchange: Exchange;

  @IsString()
  @IsNotEmpty()
  readonly symbol: string;
}
