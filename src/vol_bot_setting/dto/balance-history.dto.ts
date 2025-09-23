import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, Min } from 'class-validator';
import { Exchange } from 'src/coins/entities/coin.entity';

export class GetBalanceHistoryDto {
  @IsEnum(Exchange, { message: 'Exchange must be one of MEXC, HTX, BINANCE' })
  readonly exchange: Exchange;

  @IsString()
  @IsNotEmpty()
  readonly symbol: string;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  pageSize?: number = 10;
}
