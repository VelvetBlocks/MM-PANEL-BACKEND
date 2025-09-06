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
} from 'class-validator';
import { Type } from 'class-transformer';

class CredsDto {
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

  @ApiProperty({ description: 'Currency throttle', example: 'USDT' })
  @IsString()
  @MaxLength(20)
  currencyThrottle: string;

  @ApiProperty({ description: 'Token throttle', example: 'BTC' })
  @IsString()
  @MaxLength(20)
  tokenThrottle: string;

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
    description: 'Trade flow type (buy/sell/mixed)',
    example: 'mixed',
  })
  @IsString()
  @MaxLength(50)
  tradeFlow: string;

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

  @ApiProperty({
    description: 'Manual reference price',
    example: 100.25,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  refPriceManual?: number;

  @ApiProperty({
    description: 'Currency throttle',
    example: 'USDT',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  currencyThrottle?: string;

  @ApiProperty({
    description: 'Token throttle',
    example: 'BTC',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  tokenThrottle?: string;

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
    description: 'Trade flow type (buy/sell/mixed)',
    example: 'mixed',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  tradeFlow?: string;

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
    description: 'Bot version',
    example: 'v1.0.0',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  version?: string;

  @ApiProperty({ description: 'Status for vol bot', example: 1 })
  @IsInt()
  @Min(0)
  @Max(2)
  status: number;

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

export class BotStatusUpdateDto {
  @ApiProperty({ description: 'VolumeBotSetting ID', example: 1 })
  @IsInt()
  @IsNotEmpty()
  id: number;

  @ApiProperty({ description: 'Status for vol bot', example: 1 })
  @IsNotEmpty()
  @IsInt()
  @Min(0)
  @Max(2)
  status: number;
}
