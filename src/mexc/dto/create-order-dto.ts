import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsString,
  IsIn,
  IsDefined,
  ValidateIf,
  IsOptional,
  MaxLength,
} from "class-validator";

export class CreateOrderDto {
  @ApiProperty({
    description: "Trading pair symbol",
    example: "LFUSDT",
  })
  @IsString()
  @IsNotEmpty()
  readonly symbol: string;

  @ApiProperty({
    description: "Order side",
    example: "BUY",
    enum: ["BUY", "SELL"],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(["BUY", "SELL"])
  readonly side: "BUY" | "SELL";

  @ApiProperty({
    description: "Order type",
    example: "LIMIT",
    enum: ["LIMIT", "MARKET"],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(["LIMIT", "MARKET"])
  readonly type: "LIMIT" | "MARKET";

  @ApiProperty({
    description: "Order quantity (string to maintain precision)",
    example: "1000",
  })
  @IsString()
  @IsNotEmpty()
  readonly quantity: string;

  @ApiProperty({
    description:
      "Order price (required for LIMIT orders, string to maintain precision)",
    example: "0.00023",
    required: false,
  })
  @ValidateIf((o) => o.type === "LIMIT")
  @IsDefined({ message: "Price is mandatory for a LIMIT order." })
  @IsString()
  @IsNotEmpty()
  readonly price?: string;

  @ApiProperty({
    description: "Optional client order ID (max 64 chars)",
    required: false,
    example: "custom-order-id-123",
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  readonly newClientOrderId?: string;
}
