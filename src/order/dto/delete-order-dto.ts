import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CancelBatchOrderDto {
  @ApiProperty({ description: 'Trading pair symbol', example: 'LFUSDT' })
  @IsString()
  @IsNotEmpty()
  symbol: string;

  @ApiProperty({ description: 'Order IDs to cancel', type: [String] })
  @IsArray()
  @IsString({ each: true })
  orderIds: string[];
}
