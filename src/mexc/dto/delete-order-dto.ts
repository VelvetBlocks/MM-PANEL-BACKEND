import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';

export class DeleteOrderDto {
  @ApiProperty({
    description: 'Trading pair symbol',
    example: 'LFUSDT',
  })
  @IsString()
  @IsNotEmpty()
  readonly symbol: string;

  @ApiPropertyOptional({
    description:
      'System-generated order ID (either this or origClientOrderId is required for single order cancel)',
    example: '123456789',
  })
  @IsOptional()
  @IsString()
  readonly orderId?: string;

  @ApiPropertyOptional({
    description:
      'Custom client order ID (either this or orderId is required for single order cancel)',
    example: 'buy-btc-1',
  })
  @IsOptional()
  @IsString()
  readonly origClientOrderId?: string;
}
