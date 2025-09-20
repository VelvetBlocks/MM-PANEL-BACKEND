import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsNumber,
  IsObject,
  ValidateNested,
  IsPositive,
  Min,
  Max,
  IsEnum,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TRADE_FLOW } from '../entities/vol-bot-setting.entity';

export class CredsDto {
  @ApiProperty({ description: 'API Key', example: 'your-api-key' })
  @IsString()
  @IsNotEmpty()
  apiKey: string;

  @ApiProperty({ description: 'Secret Key', example: 'your-secret-key' })
  @IsString()
  @IsNotEmpty()
  secretKey: string;

  @ApiProperty({ description: 'Optional API Key ID', required: false })
  @IsString()
  @IsOptional()
  apiKeyId?: string;
}

export class CreateVolumeBotSettingsDto {
  @ApiProperty({ description: 'Coin ID from coins table', example: 1 })
  @IsInt()
  @IsNotEmpty()
  coinId: number;

  @ApiProperty({
    description: 'Manual reference price',
    example: 100.25,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  refPriceManual?: number;

  @ApiProperty({ description: 'Currency minus throttle (e.g., USDT)', example: '0.5' })
  @IsString()
  @IsOptional()
  @Matches(/^\d+(\.\d+)?$/, { message: 'currencyThrottleMinus must be a valid decimal number' })
  currencyThrottleMinus: string;

  @ApiProperty({ description: 'Currency plus throttle (e.g., USDT)', example: '1.25' })
  @IsString()
  @IsOptional()
  @Matches(/^\d+(\.\d+)?$/, { message: 'currencyThrottlePlus must be a valid decimal number' })
  currencyThrottlePlus: string;

  @ApiProperty({ description: 'Token minus throttle (e.g., LF)', example: '10.0' })
  @IsString()
  @IsOptional()
  @Matches(/^\d+(\.\d+)?$/, { message: 'tokenThrottleMinus must be a valid decimal number' })
  tokenThrottleMinus: string;

  @ApiProperty({ description: 'Token plus throttle (e.g., LF)', example: '20.0' })
  @IsString()
  @IsOptional()
  @Matches(/^\d+(\.\d+)?$/, { message: 'tokenThrottlePlus must be a valid decimal number' })
  tokenThrottlePlus: string;

  @ApiProperty({
    description: 'Minimum execution timing (in seconds)',
    example: 10,
  })
  @IsInt()
  @IsPositive()
  executionTimingMin: number;

  @ApiProperty({
    description: 'Maximum execution timing (in seconds)',
    example: 60,
  })
  @IsInt()
  @IsPositive()
  executionTimingMax: number;

  @ApiProperty({ description: 'Minimum trade amount', example: 0.001 })
  @IsNumber()
  tradeAmountMin: number;

  @ApiProperty({ description: 'Maximum trade amount', example: 1 })
  @IsNumber()
  tradeAmountMax: number;

  @ApiProperty({
    description: 'Tread Flow for coin',
    enum: TRADE_FLOW,
    example: TRADE_FLOW.Buy_Sell,
  })
  @IsNotEmpty()
  @IsEnum(TRADE_FLOW, {
    message: `Type must be one of ${TRADE_FLOW.Sell_Buy}, ${TRADE_FLOW.Buy_Sell}`,
  })
  tradeFlow: TRADE_FLOW;

  @ApiProperty({ description: '24H volume limit', example: 1000 })
  @IsNumber()
  volumeLimit24H: number;

  @ApiProperty({ description: 'Max allowed lag (in ms)', example: 500 })
  @IsInt()
  maxLag: number;

  @ApiProperty({
    description: 'Max reference price difference percent',
    example: 2.5,
  })
  @IsNumber()
  refPriceDiffPercentMax: number;

  @ApiProperty({ description: 'Bot version', example: 'v1.0.0' })
  @IsString()
  @MaxLength(20)
  version: string;

  @ApiProperty({ description: 'API credentials', type: CredsDto })
  @IsObject()
  @ValidateNested()
  @Type(() => CredsDto)
  creds: CredsDto;
}

export class UpdateVolumeBotSettingsDto {
  @ApiProperty({ description: 'VolumeBotSetting ID', example: 1 })
  @IsInt()
  @IsNotEmpty()
  id: number;

  @ApiProperty({ description: 'Price decimal for coin', example: 6 })
  @IsInt()
  @Min(0)
  @Max(20)
  @IsNotEmpty()
  priceDecimal: number;

  @ApiProperty({ description: 'Quantity decimal for coin', example: 2 })
  @IsInt()
  @Min(0)
  @Max(20)
  @IsNotEmpty()
  quantityDecimal: number;

  @ApiProperty({ description: 'Amount decimal for coin', example: 4 })
  @IsInt()
  @Min(0)
  @Max(20)
  @IsNotEmpty()
  amountDecimal: number;

  @ApiProperty({
    description: 'Manual reference price',
    example: 100.25,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  refPriceManual?: number;

  @ApiProperty({ description: 'Currency minus throttle (e.g., USDT)', example: '0.5' })
  @IsString()
  @IsOptional()
  @Matches(/^\d+(\.\d+)?$/, { message: 'currencyThrottleMinus must be a valid decimal number' })
  currencyThrottleMinus: string;

  @ApiProperty({ description: 'Currency plus throttle (e.g., USDT)', example: '1.25' })
  @IsString()
  @IsOptional()
  @Matches(/^\d+(\.\d+)?$/, { message: 'currencyThrottlePlus must be a valid decimal number' })
  currencyThrottlePlus: string;

  @ApiProperty({ description: 'Token minus throttle (e.g., LF)', example: '10.0' })
  @IsString()
  @IsOptional()
  @Matches(/^\d+(\.\d+)?$/, { message: 'tokenThrottleMinus must be a valid decimal number' })
  tokenThrottleMinus: string;

  @ApiProperty({ description: 'Token plus throttle (e.g., LF)', example: '20.0' })
  @IsString()
  @IsOptional()
  @Matches(/^\d+(\.\d+)?$/, { message: 'tokenThrottlePlus must be a valid decimal number' })
  tokenThrottlePlus: string;

  @ApiProperty({
    description: 'Minimum execution timing (in seconds)',
    example: 10,
    required: false,
  })
  @IsOptional()
  @IsInt()
  executionTimingMin?: number;

  @ApiProperty({
    description: 'Maximum execution timing (in seconds)',
    example: 60,
    required: false,
  })
  @IsOptional()
  @IsInt()
  executionTimingMax?: number;

  @ApiProperty({
    description: 'Minimum trade amount',
    example: 0.001,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  tradeAmountMin?: number;

  @ApiProperty({
    description: 'Maximum trade amount',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  tradeAmountMax?: number;

  @ApiProperty({
    description: 'Tread Flow for coin',
    enum: TRADE_FLOW,
    example: TRADE_FLOW.Buy_Sell,
  })
  @IsOptional()
  @IsEnum(TRADE_FLOW, {
    message: `Type must be one of ${TRADE_FLOW.Sell_Buy}, ${TRADE_FLOW.Buy_Sell}`,
  })
  tradeFlow: TRADE_FLOW;

  @ApiProperty({ description: 'Trade parameter for vol bot', example: 0.4 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'tradeParam must be a number' })
  @Min(0)
  @Max(1)
  tradeParam: number;

  @ApiProperty({
    description: '24H volume limit',
    example: 1000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  volumeLimit24H?: number;

  @ApiProperty({
    description: 'Max allowed lag (in ms)',
    example: 500,
    required: false,
  })
  @IsOptional()
  @IsInt()
  maxLag?: number;

  @ApiProperty({
    description: 'Max reference price difference percent',
    example: 2.5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  refPriceDiffPercentMax?: number;

  @ApiProperty({
    description: 'API credentials',
    type: CredsDto,
    required: false,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CredsDto)
  creds?: CredsDto;
}

