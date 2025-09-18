import { BadRequestException, Injectable } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';
import { UsersService } from 'src/users/users.service';
import { CreateOrderMexcDto } from './dto/create-order-dto';
import https from 'https';
import qs from 'qs';
import Bottleneck from 'bottleneck';
import { CreateBatchOrderMexcDto } from './dto/create-batch-order-dto';
import { CredsDto } from 'src/vol_bot_setting/dto/vol-bot-setting.dto';

export type MexcBatchOrderResponse = {
  code?: number;
  orderId?: string;
  clientOrderId?: string;
  msg?: string;
};
export const MEXC_REQUIRED_MIN_BALANCE = 1;

@Injectable()
export class MexcService {
  private readonly baseUrl = 'https://api.mexc.com';
  // private readonly API_KEY = process.env.MEXC_API_KEY!;
  // private readonly API_SECRET = process.env.MEXC_API_SECRET!;

  // Rate limiter: 20 requests per second max
  private readonly limiter = new Bottleneck({
    maxConcurrent: 1,
    minTime: 50,
  });

  constructor(private readonly usersService: UsersService) {}

  /** -------------------------
   * Rate-limited request helper
   * ------------------------- */
  private async request<T>(
    method: 'GET' | 'POST' | 'DELETE',
    url: string,
    apiKey: string,
    body?: any,
    retries = 3,
  ): Promise<T> {
    const headers: Record<string, string> = {
      'X-MEXC-APIKEY': apiKey,
    };

    if (method === 'POST') {
      // The MEXC API for order creation requires a POST request, but the
      // parameters and signature are still in the URL, not the body.
      // We will add an empty body to satisfy Axios's POST requirements.
      if (!body) {
        body = {};
      }
    }

    const agent = new https.Agent({
      family: 4,
      minVersion: 'TLSv1.2',
      keepAlive: false,
    });

    let lastError: any;

    for (let i = 0; i < retries; i++) {
      try {
        return await this.limiter.schedule(async () => {
          const res = await axios.request<T>({
            method,
            url,
            headers,
            data: body,
            httpsAgent: agent,
            timeout: 15000,
            proxy: false,
            maxRedirects: 0,
            validateStatus: (status) => true,
          });
          // console.log('Full Axios response:', {
          //   status: res.status,
          //   headers: res.headers,
          //   data: res.data,
          // });

          return res.data;
        });
      } catch (err: any) {
        lastError = err;
        if (
          ['ETIMEDOUT', 'ECONNRESET', 'EPIPE'].includes(err.code) ||
          err.message.includes('TLS')
        ) {
          console.warn(`Request failed, retrying ${i + 1}/${retries}...`);
          await new Promise((r) => setTimeout(r, 500));
        } else break;
      }
    }
    console.error(url, lastError.response?.data || lastError.message);
    throw new BadRequestException(
      lastError.response?.data?.msg || lastError.message || 'MEXC request failed',
    );
  }

  /** -------------------------
   * Create order
   * ------------------------- */
  async createOrder(botCred: CredsDto, orderDto: CreateOrderMexcDto, test = false) {
    const endpoint = test ? '/api/v3/order/test' : '/api/v3/order';
    const params: Record<string, any> = {
      symbol: orderDto.symbol,
      side: orderDto.side,
      type: orderDto.type,
      // FIX: Ensure quantity is a valid number before using
      quantity:
        typeof orderDto.quantity === 'string' ? parseFloat(orderDto.quantity) : orderDto.quantity,
      timestamp: Date.now(),
      // Adding recvWindow as it's a common cause of signature failures
      recvWindow: 5000,
    };

    if (orderDto.type === 'LIMIT') {
      // FIX: Ensure price is a valid number before using
      params.price =
        typeof orderDto.price === 'string' ? parseFloat(orderDto.price) : orderDto.price;
      params.timeInForce = 'GTC';
    }

    // Use qs.stringify to ensure consistent parameter sorting for the signature
    const queryString = qs.stringify(params);
    const signature = crypto
      .createHmac('sha256', botCred.secretKey)
      .update(queryString)
      .digest('hex');

    const url = `${this.baseUrl}${endpoint}?${queryString}&signature=${signature}`;

    // The POST request is made with the parameters in the URL, and an empty body.
    return this.request('POST', url, botCred.apiKey);
  }

  /** -------------------------
   * Create batch orders
   * ------------------------- */
  async createBatchOrders(
    botCred: CredsDto,
    batchDto: CreateBatchOrderMexcDto,
  ): Promise<MexcBatchOrderResponse[]> {
    const batchOrders = batchDto.batchOrders.map((o) => {
      const order: any = {
        symbol: o.symbol,
        side: o.side,
        type: o.type,
        quantity: o.quantity,
      };

      if (o.type === 'LIMIT') {
        order.price = o.price;
        order.timeInForce = 'GTC';
      }

      if (o.newClientOrderId) {
        order.newClientOrderId = o.newClientOrderId;
      }

      return order;
    });

    const params: Record<string, any> = {
      batchOrders: JSON.stringify(batchOrders),
      timestamp: Date.now(),
      recvWindow: 5000,
    };

    const queryString = Object.entries(params)
      .map(([key, val]) => `${key}=${encodeURIComponent(val)}`)
      .join('&');

    const signature = crypto
      .createHmac('sha256', botCred.secretKey)
      .update(queryString)
      .digest('hex');

    const url = `${this.baseUrl}/api/v3/batchOrders?${queryString}&signature=${signature}`;

    // ✅ Correctly typed response
    return this.request<MexcBatchOrderResponse[]>('POST', url, botCred.apiKey);
  }

  /** -------------------------
   * Get account balances
   * ------------------------- */
  async getBalances(botCred: CredsDto) {
    // await this.usersService.getMe(userId);

    const params: Record<string, any> = { timestamp: Date.now() };
    const queryString = new URLSearchParams(params).toString();
    const signature = crypto
      .createHmac('sha256', botCred.secretKey)
      .update(queryString)
      .digest('hex');

    const url = `${this.baseUrl}/api/v3/account?${queryString}&signature=${signature}`;

    return await this.request('GET', url, botCred.apiKey);
  }

  /** -------------------------
   * Cancel single order
   * ------------------------- */
  async cancelOrder(
    botCred: CredsDto,
    symbol: string,
    opts: { orderId?: string; origClientOrderId?: string },
  ) {
    // await this.usersService.getMe(userId);

    const params: Record<string, any> = {
      symbol,
      timestamp: Date.now(),
      recvWindow: 5000,
    };

    if (opts.orderId) {
      params.orderId = opts.orderId;
    }
    if (opts.origClientOrderId) {
      params.origClientOrderId = opts.origClientOrderId;
    }

    if (!opts.orderId && !opts.origClientOrderId) {
      throw new BadRequestException('Either orderId or origClientOrderId must be provided');
    }

    const queryString = qs.stringify(params);
    const signature = crypto
      .createHmac('sha256', botCred.secretKey)
      .update(queryString)
      .digest('hex');

    const url = `${this.baseUrl}/api/v3/order?${queryString}&signature=${signature}`;
    return this.request('DELETE', url, botCred.apiKey);
  }

  /** -------------------------
   * Cancel all open orders for a symbol
   * ------------------------- */
  async cancelAllCoinWiseOrders(botCred: CredsDto, symbol: string, orderIds?: string[]) {
    if (orderIds && orderIds.length > 0) {
      // If many orderIds, faster to just cancel all for that symbol
      // if (orderIds.length > 3) {
      //   const params = { symbol, timestamp: Date.now(), recvWindow: 5000 };
      //   const queryString = qs.stringify(params);
      //   const signature = crypto
      //     .createHmac('sha256', botCred.secretKey)
      //     .update(queryString)
      //     .digest('hex');

      //   const url = `${this.baseUrl}/api/v3/openOrders?${queryString}&signature=${signature}`;
      //   return this.request('DELETE', url, botCred.apiKey);
      // }

      // If few orderIds, cancel them in parallel
      return Promise.all(
        orderIds.map(async (orderId) => {
          const params = { symbol, orderId, timestamp: Date.now(), recvWindow: 5000 };
          const queryString = qs.stringify(params);
          const signature = crypto
            .createHmac('sha256', botCred.secretKey)
            .update(queryString)
            .digest('hex');

          const url = `${this.baseUrl}/api/v3/order?${queryString}&signature=${signature}`;
          return this.request('DELETE', url, botCred.apiKey);
        }),
      );
    } else {
      // Cancel ALL for symbol
      const params = { symbol, timestamp: Date.now(), recvWindow: 5000 };
      const queryString = qs.stringify(params);
      const signature = crypto
        .createHmac('sha256', botCred.secretKey)
        .update(queryString)
        .digest('hex');

      const url = `${this.baseUrl}/api/v3/openOrders?${queryString}&signature=${signature}`;
      return this.request('DELETE', url, botCred.apiKey);
    }
  }

  /** -------------------------
   * Get Order Book level wise
   * ------------------------- */
  async fetchOrderBookSymbolWise(botCred: CredsDto, symbol: string, limit: number) {
    try {
      const url = `https://api.mexc.com/api/v3/depth?symbol=${symbol}&limit=${limit}`;
      // Fetch raw response
      const orderBook = await this.request<any>('GET', url, botCred.apiKey);
      // Extract bids (highest buy orders) and asks (lowest sell orders)
      const bids =
        orderBook.bids?.map(([price, qty]) => ({
          price: parseFloat(price),
          quantity: parseFloat(qty),
        })) ?? [];

      const asks =
        orderBook.asks?.map(([price, qty]) => ({
          price: parseFloat(price),
          quantity: parseFloat(qty),
        })) ?? [];

      // Pick top of book
      const buy = bids[0] || null; // last buy
      const sell = asks[0] || null; // last sell
      return {
        lastUpdateId: orderBook.lastUpdateId,
        buy,
        sell,
      };
    } catch (err: any) {
      console.error(`Failed to fetch order book for ${symbol}: ${err.message}`);
      throw err;
    }
  }

  /** -------------------------
   * Get Volume 24 HR (symbol-wise)
   * ------------------------- */
  async fetch24hrVolumesSymbolWise(botCred: CredsDto, symbol: string) {
    try {
      const url = `https://api.mexc.com/api/v3/ticker/24hr?symbol=${symbol}`;
      const volumeData = await this.request<any>('GET', url, botCred.apiKey);
      return {
        symbol: volumeData.symbol,
        volume: volumeData.volume,
        quoteVolume: volumeData.quoteVolume,
      };
    } catch (err: any) {
      console.error(`Failed to fetch 24h volume for ${symbol}: ${err.message}`);
      throw err;
    }
  }

  /** -------------------------
   * Get all open orders for a symbol
   * ------------------------- */
  async getAllOpenOrders(botCred: CredsDto, symbol: string) {
    const params: Record<string, any> = {
      symbol,
      timestamp: Date.now(),
    };

    const queryString = qs.stringify(params);
    const signature = crypto
      .createHmac('sha256', botCred.secretKey)
      .update(queryString)
      .digest('hex');

    const url = `${this.baseUrl}/api/v3/openOrders?${queryString}&signature=${signature}`;
    return this.request('GET', url, botCred.apiKey);
  }
}
