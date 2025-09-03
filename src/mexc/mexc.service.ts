import { BadRequestException, Injectable } from "@nestjs/common";
import axios from "axios";
import * as crypto from "crypto";
import { UsersService } from "src/users/users.service";
import { CreateOrderDto } from "./dto/create-order-dto";
import https from "https";
import qs from "qs";
import Bottleneck from "bottleneck";
import { CreateBatchOrderDto } from "./dto/create-batch-order-dto";

@Injectable()
export class MexcService {
  private readonly baseUrl = "https://api.mexc.com";
  private readonly API_KEY = process.env.MEXC_API_KEY!;
  private readonly API_SECRET = process.env.MEXC_API_SECRET!;

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
    method: "GET" | "POST" | "DELETE",
    url: string,
    body?: any,
    retries = 3
  ): Promise<T> {
    const headers: Record<string, string> = {
      "X-MEXC-APIKEY": this.API_KEY,
    };

    if (method === "POST") {
      // The MEXC API for order creation requires a POST request, but the
      // parameters and signature are still in the URL, not the body.
      // We will add an empty body to satisfy Axios's POST requirements.
      if (!body) {
        body = {};
      }
    }

    const agent = new https.Agent({
      family: 4,
      minVersion: "TLSv1.2",
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
            validateStatus: (status) => status < 500,
          });
          console.log("res ------------> ", res.data);

          return res.data;
        });
      } catch (err: any) {
        lastError = err;
        if (
          ["ETIMEDOUT", "ECONNRESET", "EPIPE"].includes(err.code) ||
          err.message.includes("TLS")
        ) {
          console.warn(`Request failed, retrying ${i + 1}/${retries}...`);
          await new Promise((r) => setTimeout(r, 500));
        } else break;
      }
    }
    console.error(url, lastError.response?.data || lastError.message);
    throw new BadRequestException(
      lastError.response?.data?.msg ||
        lastError.message ||
        "MEXC request failed"
    );
  }

  /** -------------------------
   * Create order
   * ------------------------- */
  async createOrder(userId: string, orderDto: CreateOrderDto, test = true) {
    await this.usersService.getMe(userId);

    const endpoint = test ? "/api/v3/order/test" : "/api/v3/order";

    const params: Record<string, any> = {
      symbol: orderDto.symbol,
      side: orderDto.side,
      type: orderDto.type,
      // FIX: Ensure quantity is a valid number before using
      quantity:
        typeof orderDto.quantity === "string"
          ? parseFloat(orderDto.quantity)
          : orderDto.quantity,
      timestamp: Date.now(),
      // Adding recvWindow as it's a common cause of signature failures
      recvWindow: 5000,
    };

    if (orderDto.type === "LIMIT") {
      // FIX: Ensure price is a valid number before using
      params.price =
        typeof orderDto.price === "string"
          ? parseFloat(orderDto.price)
          : orderDto.price;
      params.timeInForce = "GTC";
    }

    // Log the parameters before stringifying for debugging
    console.log("Pre-stringified params:", params);

    // Use qs.stringify to ensure consistent parameter sorting for the signature
    const queryString = qs.stringify(params);
    const signature = crypto
      .createHmac("sha256", this.API_SECRET)
      .update(queryString)
      .digest("hex");

    const url = `${this.baseUrl}${endpoint}?${queryString}&signature=${signature}`;

    console.log("Generated URL:", url); // Log the full URL for debugging

    // The POST request is made with the parameters in the URL, and an empty body.
    return this.request("POST", url);
  }

  /** -------------------------
   * Create batch orders
   * ------------------------- */
  async createBatchOrders(
    userId: string,
    batchDto: CreateBatchOrderDto,
    test = true
  ) {
    await this.usersService.getMe(userId);

    const endpoint = test ? "/api/v3/batchOrders/test" : "/api/v3/batchOrders";

    // Map orders into MEXC format
    const batchOrders = batchDto.batchOrders.map((o) => {
      const order: any = {
        symbol: o.symbol,
        side: o.side,
        type: o.type,
        quantity: o.quantity,
      };

      if (o.type === "LIMIT") {
        order.price = o.price;
        order.timeInForce = "GTC";
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

    const queryString = qs.stringify(params, { encode: false }); // keep JSON intact
    const signature = crypto
      .createHmac("sha256", this.API_SECRET)
      .update(queryString)
      .digest("hex");

    const url = `${this.baseUrl}${endpoint}?${queryString}&signature=${signature}`;
    console.log("Batch Orders URL:", url);

    return this.request("POST", url);
  }

  /** -------------------------
   * Get account balances
   * ------------------------- */
  async getBalances(userId: string) {
    await this.usersService.getMe(userId);

    const params: Record<string, any> = { timestamp: Date.now() };
    const queryString = new URLSearchParams(params).toString();
    const signature = crypto
      .createHmac("sha256", this.API_SECRET)
      .update(queryString)
      .digest("hex");

    const url = `${this.baseUrl}/api/v3/account?${queryString}&signature=${signature}`;

    return this.request("GET", url);
  }

  /** -------------------------
   * Cancel single order
   * ------------------------- */
  async cancelOrder(
    userId: string,
    symbol: string,
    opts: { orderId?: string; origClientOrderId?: string }
  ) {
    await this.usersService.getMe(userId);

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
      throw new BadRequestException(
        "Either orderId or origClientOrderId must be provided"
      );
    }

    const queryString = qs.stringify(params);
    const signature = crypto
      .createHmac("sha256", this.API_SECRET)
      .update(queryString)
      .digest("hex");

    const url = `${this.baseUrl}/api/v3/order?${queryString}&signature=${signature}`;

    console.log("Cancel Order URL:", url);

    return this.request("DELETE", url);
  }

  /** -------------------------
   * Cancel all open orders for a symbol
   * ------------------------- */
  async cancelAllOrders(userId: string, symbol: string) {
    await this.usersService.getMe(userId);

    const params: Record<string, any> = {
      symbol,
      timestamp: Date.now(),
      recvWindow: 5000,
    };

    const queryString = qs.stringify(params);
    const signature = crypto
      .createHmac("sha256", this.API_SECRET)
      .update(queryString)
      .digest("hex");

    const url = `${this.baseUrl}/api/v3/openOrders?${queryString}&signature=${signature}`;

    console.log("Cancel All Orders URL:", url);

    return this.request("DELETE", url);
  }
}
