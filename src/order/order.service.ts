import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Order, ORDER_STATUS } from './entities/order.entity';
import { MexcBatchOrderResponse, MexcService } from 'src/mexc/mexc.service';
import { Exchange } from 'src/coins/entities/coin.entity';
import { CreateOrderDto } from './dto/create-order-dto';
import { CancelBatchOrderDto } from './dto/delete-order-dto';
import { VolumeBotSettingsService } from 'src/vol_bot_setting/vol-bot-setting.service';
import { GetAllOpenOrderDto, GetAllOrderDto } from './dto/get-all-open-order.dto';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly mexcService: MexcService,
    private readonly volumeBotSettingsService: VolumeBotSettingsService,
  ) {}

  // Create single order
  async create(userId: string, orderData: CreateOrderDto): Promise<Order> {
    try {
      const bot = await this.volumeBotSettingsService.getByExchangeCoinName(
        orderData.exchange,
        orderData.symbol,
      );

      switch (orderData.exchange) {
        case Exchange.MEXC:
          const orderRes: any = await this.mexcService.createOrder(bot.creds, {
            symbol: orderData.symbol,
            side: orderData.side,
            type: orderData.type,
            quantity: orderData.quantity,
            price: orderData.price,
            // newClientOrderId: orderData.newClientOrderId,
          });

          const order = this.orderRepository.create({
            ...orderData,
            orderId: orderRes.orderId,
            is_bot_order: 1,
            userId,
          });
          return await this.orderRepository.save(order);
          break;

        default:
          break;
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Create multiple orders (batch)
  async createBatch(
    userId: string,
    exchange: Exchange,
    symbol: string,
    orderList: Partial<Order>[],
  ): Promise<{ savedOrders: Order[]; failedOrders: any[] }> {
    try {
      let mexcResponse: MexcBatchOrderResponse[] = [];
      const bot = await this.volumeBotSettingsService.getByExchangeCoinName(exchange, symbol);
      switch (exchange) {
        case Exchange.MEXC:
          const mexcOrders = orderList.map((o) => ({
            symbol: o.symbol!,
            side: o.side!,
            type: o.type!,
            quantity: o.quantity!.toString(),
            price: o.price?.toString(),
            // newClientOrderId: o.newClientOrderId,
          }));
          // Call MEXC service
          mexcResponse = await this.mexcService.createBatchOrders(bot.creds, {
            batchOrders: mexcOrders,
          });
          break;

        default:
          throw new BadRequestException('Unsupported exchange');
      }

      // Separate successful and failed orders
      const savedOrders: Order[] = [];
      const failedOrders: any[] = [];

      mexcResponse.forEach((res, idx) => {
        if (res.code && res.code !== 0) {
          // Failed order
          failedOrders.push({
            ...orderList[idx],
            clientOrderId: res.clientOrderId,
            errorCode: res.code,
            errorMsg: res.msg,
          });
        } else {
          // Successful order
          const enrichedOrder = this.orderRepository.create({
            ...orderList[idx],
            userId,
            orderId: res.orderId || res.clientOrderId,
            status: ORDER_STATUS.FILLED,
            exchange,
          });
          savedOrders.push(enrichedOrder);
        }
      });

      // Save successful orders to DB
      const orders = await this.orderRepository.save(savedOrders);

      return { savedOrders: orders, failedOrders };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get all orders with pagination
  async findAll(
    dto: GetAllOrderDto,
  ): Promise<{ data: Order[]; total: number; page: number; limit: number }> {
    const { exchange, symbol, page = 1, limit = 10 } = dto;

    const [data, total] = await this.orderRepository.findAndCount({
      where: { exchange, symbol },
      order: { id: 'DESC' }, // latest first
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      total,
      page,
      limit,
      data,
    };
  }

  // Get one order by id
  async findOne(id: number): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }
    return order;
  }

  // Delete single order
  async delete(id: number): Promise<{ deleted: boolean }> {
    const result = await this.orderRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }
    return { deleted: true };
  }
  async cancelBatch(dto: CancelBatchOrderDto): Promise<{ cancelled: number; failed: any[] }> {
    const { symbol, orderIds, exchange } = dto;
    const bot = await this.volumeBotSettingsService.getByExchangeCoinName(exchange, symbol);
    // Cancel on MEXC
    const mexcResponse = await this.mexcService.cancelAllCoinWiseOrders(
      bot.creds,
      symbol,
      orderIds,
    );

    const cancelledOrders: string[] = [];
    const failedOrders: any[] = [];

    if (Array.isArray(mexcResponse)) {
      mexcResponse.forEach((res, idx) => {
        if (res.code && res.code !== 0) {
          failedOrders.push({
            orderId: res.orderId || orderIds[idx],
            errorCode: res.code,
            errorMsg: res.msg,
          });
        } else {
          cancelledOrders.push(res.orderId || res.clientOrderId || orderIds[idx]);
        }
      });
    } else {
      // Handle unexpected response
      console.warn('Unexpected MEXC cancel response:', mexcResponse);
      failedOrders.push(...orderIds.map((id) => ({ orderId: id, errorMsg: 'Unknown response' })));
    }
    // ✅ Delete successfully cancelled orders by orderId (string)
    const result = await this.updateStatusBatch(cancelledOrders, ORDER_STATUS.CANCELED);
    return { cancelled: result.updated, failed: failedOrders };
  }

  async getAllOpenOrders(dto: GetAllOpenOrderDto): Promise<any[]> {
    const bot = await this.volumeBotSettingsService.getByExchangeCoinName(dto.exchange, dto.symbol);

    let exchangeOrders: any = [];

    switch (dto.exchange) {
      case Exchange.MEXC:
        exchangeOrders = await this.mexcService.getAllOpenOrders(bot.creds, dto.symbol);
        break;

      default:
        throw new BadRequestException('Unsupported exchange');
    }

    // Fetch DB orders only for enrichment
    const dbOrders = await this.orderRepository.find({
      where: { symbol: dto.symbol, exchange: dto.exchange },
    });

    // Build map for quick lookup
    const dbMap = new Map(dbOrders.map((o) => [o.orderId, o]));

    // Merge: start from exchange orders (source of truth)
    const mergedOrders = exchangeOrders.map((exOrder) => {
      const dbOrder = dbMap.get(exOrder.orderId);

      return {
        id: dbOrder?.id ?? null,
        orderId: exOrder.orderId,
        symbol: exOrder.symbol,
        side: exOrder.side,
        type: exOrder.type,
        price: exOrder.price,
        quantityToken: exOrder.origQty,
        quantityCurrency: (Number(exOrder.price) * Number(exOrder.origQty)).toString(),
        timestamp: exOrder.time ?? dbOrder?.createdAt?.getTime(),
        status: exOrder.status,

        // Flags from DB
        manual: dbOrder ? !dbOrder.is_bot_order : false,
        noCancel: dbOrder ? dbOrder.no_cancel === 1 : false,
      };
    });

    return mergedOrders;
  }

  /**
   * Bulk update order status
   */
  async updateStatusBatch(orderIds: string[], status: ORDER_STATUS): Promise<{ updated: number }> {
    const result = await this.orderRepository.update(
      { orderId: In(orderIds) }, // condition (same as delete)
      { status }, // update value
    );

    return { updated: result.affected ?? 0 };
  }

  /**
   * Sync a single order status with exchange and update DB.
   */
  async updateOrderStatus(orderId: string, exchange: Exchange, creds: any): Promise<Order> {
    // 1. Find order in DB
    const dbOrder = await this.orderRepository.findOne({ where: { orderId } });
    if (!dbOrder) {
      throw new NotFoundException(`Order ${orderId} not found in DB`);
    }

    let exchangeOrder: any;

    // 2. Fetch order from exchange
    switch (exchange) {
      case Exchange.MEXC:
        exchangeOrder = await this.mexcService.getAllOpenOrders(creds, dbOrder.symbol);
        break;

      default:
        throw new Error(`Exchange ${exchange} not supported`);
    }

    // 3. Map exchange status → DB status
    let newStatus: ORDER_STATUS;
    switch (exchangeOrder.status) {
      case 'NEW':
        newStatus = ORDER_STATUS.NEW;
        break;
      case 'PARTIALLY_FILLED':
        newStatus = ORDER_STATUS.PARTIALLY_FILLED;
        break;
      case 'FILLED':
        newStatus = ORDER_STATUS.FILLED;
        break;
      case 'CANCELED':
        newStatus = ORDER_STATUS.CANCELED;
        break;
      case 'EXPIRED':
        newStatus = ORDER_STATUS.EXPIRED;
        break;
      default:
        newStatus = ORDER_STATUS.NEW;
    }

    // 4. If DB status differs, update it
    if (dbOrder.status !== newStatus) {
      dbOrder.status = newStatus;
      await this.orderRepository.save(dbOrder);
    }

    return dbOrder;
  }

  /**
   * Sync all open (NEW / PARTIALLY_FILLED) orders for a given exchange + symbol
   */
  async syncOpenOrders(exchange: Exchange, creds: any, symbol: string): Promise<Order[]> {
    const openOrders = await this.orderRepository.find({
      where: [
        { exchange, symbol, status: ORDER_STATUS.NEW },
        { exchange, symbol, status: ORDER_STATUS.PARTIALLY_FILLED },
      ],
    });

    const updatedOrders: Order[] = [];
    for (const order of openOrders) {
      const updated = await this.updateOrderStatus(order.orderId, exchange, creds);
      updatedOrders.push(updated);
    }

    return updatedOrders;
  }
}
