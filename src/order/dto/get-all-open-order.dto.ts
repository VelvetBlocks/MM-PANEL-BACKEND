import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
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

export class GetAllOrderDto {
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

  @ApiProperty({ description: 'Page number (default 1)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ description: 'Items per page (default 10)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}
