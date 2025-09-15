import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { Order } from './entities/order.entity';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import { CreateOrderDto } from './dto/create-order-dto';
import { CreateBatchOrderDto } from './dto/create-batch-order-dto';
import { CancelBatchOrderDto } from './dto/delete-order-dto';
import { GetAllOpenOrderDto, GetAllOrderDto } from './dto/get-all-open-order.dto';
import { OrderLogService } from './services/order-log.service';
import { CreateOrderLogDto } from './dto/order-log.dot';

@ApiTags('order')
@Controller('order')
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly orderLogService: OrderLogService,
  ) {}

  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkResponse({ description: 'Order created successfully', type: Order })
  @ApiBearerAuth()
  @Post('create')
  async createOrder(
    @ActiveUser('id') userId: string,
    @Body() createOrderDto: CreateOrderDto,
  ): Promise<Order> {
    return this.orderService.create(userId, createOrderDto);
  }

  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkResponse({ description: 'Order created successfully', type: Order })
  @ApiBearerAuth()
  @Post('create_batch')
  async createBatchOrder(
    @ActiveUser('id') userId: string,
    @Body() dto: CreateBatchOrderDto,
  ): Promise<any> {
    return this.orderService.createBatch(userId, dto.exchange, dto.symbol, dto.batchOrders);
  }

  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkResponse({ description: 'Order deleted successfully' })
  @ApiBearerAuth()
  @Post('cancel_batch')
  async cancelBatch(@Body() dto: CancelBatchOrderDto): Promise<{ message: string }> {
    await this.orderService.cancelBatch(dto);
    return { message: 'Order deleted successfully' };
  }

  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkResponse({ description: 'List of order', type: [Order] })
  @ApiBearerAuth()
  @Post('get_orders')
  async findAll(@Body() dto: GetAllOrderDto): Promise<any> {
    return this.orderService.findAll(dto);
  }

  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkResponse({ description: 'List of open order' })
  @ApiBearerAuth()
  @Post('all_open_orders')
  async getAllOpenOrders(@Body() dto: GetAllOpenOrderDto): Promise<any> {
    return await this.orderService.getAllOpenOrders(dto);
  }

  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkResponse({ description: 'List of order logs' })
  @ApiBearerAuth()
  @Post('all_orders_logs')
  async getAllBotLogs(@Body() dto: GetAllOpenOrderDto): Promise<any> {
    return await this.orderLogService.getAllLogs(dto.exchange, dto.symbol);
  }
}
