import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { MexcService } from './mexc.service';
import { CreateOrderMexcDto } from './dto/create-order-dto';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import { CreateBatchOrderMexcDto } from './dto/create-batch-order-dto';
import { DeleteOrderDto } from './dto/delete-order-dto';

@ApiTags('mexc')
@Controller('mexc')
export class MexcController {
  constructor(private readonly mexcService: MexcService) {}

  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkResponse({ description: 'Order created successfully' })
  @ApiBearerAuth()
  @Post('order_create')
  async createOrder(
    @ActiveUser('id') userId: string,
    @Body() createOrder: CreateOrderMexcDto,
  ): Promise<any> {
    // const res = await this.mexcService.createOrder(createOrder);
    // console.log('res -------------> ', res);
    // return res;
  }

  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkResponse({ description: 'Batch order created successfully' })
  @ApiBearerAuth()
  @Post('batch_order_create')
  async createBatchOrder(
    @ActiveUser('id') userId: string,
    @Body() createBatchOrder: CreateBatchOrderMexcDto,
  ): Promise<any> {
    // const res = await this.mexcService.createBatchOrders(
    //   // userId,
    //   createBatchOrder,
    // );
    // console.log('res -------------> ', res);
    // return res;
  }

  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkResponse({ description: 'Balance get successfully' })
  @ApiBearerAuth()
  @Post('get_balance')
  async getBalance(@ActiveUser('id') userId: string): Promise<any> {
    // return await this.mexcService.getBalances();
  }

  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkResponse({ description: 'Order Delete successfully' })
  @ApiBearerAuth()
  @Post('order_cancel_batch')
  async deleteOrder(
    @ActiveUser('id') userId: string,
    @Body() deleteOrderDto: DeleteOrderDto,
  ): Promise<any> {
    // if (deleteOrderDto.orderId || deleteOrderDto.origClientOrderId) {
    //   return this.mexcService.cancelOrder(userId, deleteOrderDto.symbol, {
    //     orderId: deleteOrderDto.orderId,
    //     origClientOrderId: deleteOrderDto.origClientOrderId,
    //   });
    // } else {
    //   // Cancel all orders for the symbol
    //   return this.mexcService.cancelAllCoinWiseOrders(deleteOrderDto.symbol, [
    //     deleteOrderDto.orderId,
    //   ]);
    // }
  }
}
