import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsNumberString, IsInt } from 'class-validator';
import { Exchange } from 'src/coins/entities/coin.entity';

export class CreateBalanceDto {
  @ApiProperty({ description: 'User ID from system', example: 'user_123' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Exchange for balance',
    enum: Exchange,
    example: Exchange.MEXC,
  })
  @IsEnum(Exchange, { message: 'Exchange must be one of MEXC, HTX, BINANCE' })
  exchange: Exchange;

  @ApiProperty({ description: 'Asset symbol', example: 'USDT' })
  @IsString()
  @IsNotEmpty()
  asset: string;

  @ApiProperty({ description: 'Free balance (available to trade)', example: '51.454227088832' })
  @IsNumberString()
  free: number;

  @ApiProperty({ description: 'Locked balance (in open orders, staking, etc.)', example: '6.0012' })
  @IsNumberString()
  locked: number;

  @ApiProperty({
    description: 'Available balance (some APIs duplicate free)',
    example: '51.454227088832',
  })
  @IsNumberString()
  available: number;
}

export class UpdateBalanceDto {
  @ApiProperty({ description: 'Internal Balance ID', example: 1 })
  @IsInt()
  @IsNotEmpty()
  id: number;

  @ApiProperty({ description: 'User ID from system', example: 'user_123' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty({
    description: 'Exchange for balance',
    enum: Exchange,
    example: Exchange.MEXC,
  })
  @IsEnum(Exchange, { message: 'Exchange must be one of MEXC, HTX, BINANCE' })
  @IsOptional()
  exchange?: Exchange;

  @ApiProperty({ description: 'Asset symbol', example: 'USDT' })
  @IsString()
  @IsOptional()
  asset?: string;

  @ApiProperty({ description: 'Free balance', example: '60.1234' })
  @IsNumberString()
  @IsOptional()
  free?: string;

  @ApiProperty({ description: 'Locked balance', example: '0.5000' })
  @IsNumberString()
  @IsOptional()
  locked?: string;

  @ApiProperty({ description: 'Available balance', example: '59.6234' })
  @IsNumberString()
  @IsOptional()
  available?: string;
}

export class FindUserBalancesDto {
  @ApiProperty({ description: 'User ID', example: 'user_123' })
  @IsString()
  @IsNotEmpty()
  userId: string;
}

export class FindExcBalancesDto {
  @ApiProperty({ description: 'User ID', example: 'user_123' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ enum: Exchange })
  @IsEnum(Exchange, { message: 'Exchange must be one of MEXC, HTX, BINANCE' })
  exchange: Exchange;
}
