import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Exchange, Status } from '../entities/coin.entity';

export class CreateCoinDto {
  @ApiProperty({ description: 'User ID from system', example: 'user_123' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Exchange for coin',
    enum: Exchange,
    example: Exchange.MEXC,
  })
  @IsEnum(Exchange, { message: 'Exchange must be one of MEXC, HTX, BINANCE' })
  exchange: Exchange;

  @ApiProperty({ description: 'Trading pair symbol', example: 'LFUSDT' })
  @IsString()
  @MaxLength(20)
  @IsNotEmpty()
  symbol: string;

  @ApiProperty({ description: 'Name for coin', example: 'LF LABS' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Icon for coin',
    example: 'https://cdn.com/lf.png',
  })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiProperty({ description: 'Price decimal for coin', example: 8 })
  @IsInt()
  @Min(0)
  @Max(20)
  priceDecimal: number;

  @ApiProperty({ description: 'Quantity decimal for coin', example: 2 })
  @IsInt()
  @Min(0)
  @Max(20)
  quantityDecimal: number;

  @ApiProperty({ description: 'Amount decimal for coin', example: 4 })
  @IsInt()
  @Min(0)
  @Max(20)
  amountDecimal: number;

  @ApiProperty({
    description: 'Status of coin',
    enum: Status,
    example: Status.ON,
  })
  @IsEnum(Status)
  @IsOptional()
  status?: Status;
}

export class UpdateCoinDto {
  @ApiProperty({ description: 'ID from system', example: 1 })
  @IsInt()
  @IsNotEmpty()
  id: number;

  @ApiProperty({
    description: 'Exchange for coin',
    enum: Exchange,
    example: Exchange.MEXC,
  })
  @IsEnum(Exchange, { message: 'Exchange must be one of MEXC, HTX, BINANCE' })
  exchange: Exchange;

  @ApiProperty({ description: 'Trading pair symbol', example: 'LFUSDT' })
  @IsString()
  @MaxLength(20)
  @IsNotEmpty()
  symbol: string;

  @ApiProperty({ description: 'Name for coin', example: 'LF LABS' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Icon for coin',
    example: 'https://cdn.com/lf.png',
  })
  @IsString()
  @IsOptional()
  icon?: string;
}

export class FindExcCoinsDto {
  @ApiProperty({ enum: Exchange })
  @IsEnum(Exchange, { message: 'Exchange must be one of MEXC, HTX, BINANCE' })
  exchange: Exchange;

  @ApiProperty({ description: 'Trading pair symbol', example: 'LFUSDT' })
  @IsString()
  @MaxLength(20)
  @IsNotEmpty()
  symbol: string;
}

export class BotStatusUpdateDto {
  @ApiProperty({ description: 'VolumeBotSetting ID', example: 1 })
  @IsInt()
  @IsNotEmpty()
  id: number;

  @ApiProperty({
    description: 'Status of coin',
    enum: Status,
    example: Status.ON,
  })
  @IsEnum(Status)
  @IsNotEmpty()
  status?: Status;
}
