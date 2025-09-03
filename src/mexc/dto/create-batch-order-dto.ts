import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
} from "class-validator";
import { Type } from "class-transformer";
import { CreateOrderDto } from "./create-order-dto";

export class CreateBatchOrderDto {
  @ApiProperty({
    type: [CreateOrderDto],
    description: "An array of up to 20 orders",
    example: [
      {
        symbol: "LFUSDT",
        side: "BUY",
        type: "LIMIT",
        quantity: "100",
        price: "0.000175",
        newClientOrderId: "order-1",
      },
      {
        symbol: "LFUSDT",
        side: "SELL",
        type: "LIMIT",
        quantity: "100",
        price: "0.000200",
        newClientOrderId: "order-2",
      },
    ],
  })
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderDto)
  @IsNotEmpty()
  readonly batchOrders: CreateOrderDto[];
}
