import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { MexcBatchOrderResponse, MexcService } from 'src/mexc/mexc.service';
import { Exchange } from 'src/coins/entities/coin.entity';
import { CreateOrderDto } from './dto/create-order-dto';
import { CancelBatchOrderDto } from './dto/delete-order-dto';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly mexcService: MexcService,
  ) {}

  // Create single order
  async create(userId: string, orderData: CreateOrderDto): Promise<Order> {
    try {
      console.log('order ============== : ', orderData);
      switch (orderData.exchange) {
        case Exchange.MEXC:
          const orderRes = await this.mexcService.createOrder({
            symbol: orderData.symbol,
            side: orderData.side,
            type: orderData.type,
            quantity: orderData.quantity,
            price: orderData.price,
            // newClientOrderId: orderData.newClientOrderId,
          });
          console.log('MEXC RES ----------- : ', orderRes);

          const order = this.orderRepository.create({ ...orderData, userId });
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
    exchange: string,
    orderList: Partial<Order>[],
  ): Promise<{ savedOrders: Order[]; failedOrders: any[] }> {
    try {
      let mexcResponse: MexcBatchOrderResponse[] = [];

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

          console.log('MEXC Orders body:', mexcOrders);

          // Call MEXC service
          mexcResponse = await this.mexcService.createBatchOrders({
            batchOrders: mexcOrders,
          });
          console.log('MEXC Response:', mexcResponse);
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

  // Get all orders
  async findAll(userId): Promise<Order[]> {
    return this.orderRepository.find({ where: { userId } });
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
    const { symbol, orderIds } = dto;

    // Cancel on MEXC
    const mexcResponse = await this.mexcService.cancelAllCoinWiseOrders(symbol, orderIds);
    console.log('mexcResponse ---------------> ', mexcResponse);

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
    console.log('cancelledOrders ---------------> ', cancelledOrders);
    // ✅ Delete successfully cancelled orders by orderId (string)
    const result = await this.orderRepository.delete({
      orderId: In(cancelledOrders),
    });
    console.log('result ---------------> ', result);
    return { cancelled: result.affected ?? 0, failed: failedOrders };
  }
}
