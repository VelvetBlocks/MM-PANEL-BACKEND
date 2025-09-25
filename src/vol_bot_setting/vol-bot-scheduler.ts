import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TRADE_FLOW, VolumeBotSettings } from './entities/vol-bot-setting.entity';
import { OrderService } from 'src/order/order.service';
import { ORDER_SIDE, ORDER_STATUS, ORDER_TYPE } from 'src/order/entities/order.entity';
import { BotType, Exchange, Status } from 'src/coins/entities/coin.entity';
import { MEXC_REQUIRED_MIN_BALANCE, MexcService } from 'src/mexc/mexc.service';
import { CoinsService } from 'src/coins/coin.service';
import { OrderLogService } from 'src/order/services/order-log.service';
import { ORDER_LOG_TYPE } from 'src/order/entities/order-log.entity';

@Injectable()
export class VolumeBotScheduler {
  private readonly logger = new Logger(VolumeBotScheduler.name);

  constructor(
    @InjectRepository(VolumeBotSettings)
    private botRepo: Repository<VolumeBotSettings>,
    private readonly orderService: OrderService,
    private readonly mexcService: MexcService,
    private readonly coinService: CoinsService,
    private readonly orderLogService: OrderLogService,
  ) {}
  // Track next execution time per bot in memory
  private nextExecutionMap: Map<number, number> = new Map();

  @Cron('*/1 * * * * *')
  async checkBots() {
    const allBots = await this.botRepo.find({ relations: ['coin'] });
    const activeBots = allBots.filter((bot) => bot.status === Status.ON);

    for (const bot of activeBots) {
      if ((bot.creds && !bot.creds?.apiKey) || !bot.creds?.secretKey) {
        return;
      }
      const now = Date.now();
      let nextExecution = this.nextExecutionMap.get(bot.id);

      // --- FIRST RUN ---
      if (!nextExecution) {
        // run immediately
        const balance: any = await this.mexcService.getBalances(bot.creds);
        const balances = balance?.balances ?? [];
        await this.executeBot(bot, balances);

        // schedule next execution in [min,max]
        const delay = this.getRandomInt(bot.executionTimingMin, bot.executionTimingMax) * 1000;
        this.nextExecutionMap.set(bot.id, now + delay);

        this.logger.log(
          `Bot ${bot.coin.exchange} ${bot.coin.name} executed immediately (first run). Next in ${delay / 1000}s`,
        );
        continue; // go to next bot
      }

      // --- SUBSEQUENT RUNS ---
      if (now >= nextExecution) {
        // 1) --- balances + drift checks (unchanged)...
        // fetch live balances
        const balance: any = await this.mexcService.getBalances(bot.creds);
        const balances = balance?.balances ?? [];

        const liveUsdtRaw = balances.find((b: any) => b.asset === 'USDT')?.available ?? 0;
        const liveCoinRaw = balances.find((b: any) => b.asset === bot.coin.name)?.available ?? 0;

        // Normalize to numbers
        const liveUsdt = parseFloat(liveUsdtRaw as any) || 0;
        const liveCoin = parseFloat(liveCoinRaw as any) || 0;

        // DB snapshot values (make sure these fields exist and are numeric)
        const dbUsdt = parseFloat(String(bot.usdt_balance ?? 0)) || 0;
        const dbCoin = parseFloat(String(bot.token_balance ?? 0)) || 0;

        // Throttle values (fallback to 0)
        const tokenMinus = parseFloat(String(bot.tokenThrottleMinus ?? 0)) || 0;
        const tokenPlus = parseFloat(String(bot.tokenThrottlePlus ?? 0)) || 0;
        const currencyMinus = parseFloat(String(bot.currencyThrottleMinus ?? 0)) || 0;
        const currencyPlus = parseFloat(String(bot.currencyThrottlePlus ?? 0)) || 0;

        // Compute bounds
        const usdtLower = dbUsdt - currencyMinus;
        const usdtUpper = dbUsdt + currencyPlus;
        const coinLower = dbCoin - tokenMinus;
        const coinUpper = dbCoin + tokenPlus;

        // Debug logging (fixed labels)
        this.logger.debug(`BOT[${bot.id}] BALANCE CHECK:
          DB USDT = ${dbUsdt}, live USDT = ${liveUsdt}
          currencyThrottleMinus = ${currencyMinus}, currencyThrottlePlus = ${currencyPlus}
          USDT bounds = [${usdtLower}, ${usdtUpper}]
          inRange = ${liveUsdt >= usdtLower && liveUsdt <= usdtUpper}

          DB COIN = ${dbCoin}, live COIN = ${liveCoin}
          tokenThrottleMinus = ${tokenMinus}, tokenThrottlePlus = ${tokenPlus}
          COIN bounds = [${coinLower}, ${coinUpper}]
          inRange = ${liveCoin >= coinLower && liveCoin <= coinUpper}
        `);

        // out-of-range handling
        if (liveUsdt < usdtLower || liveUsdt > usdtUpper) {
          this.logger.warn(`Bot ${bot.id} stopped: USDT balance drift.`);
          await this.orderLogService.createLog({
            exchange: bot.coin.exchange,
            symbol: bot.coin.symbol,
            text: `Currency ${liveUsdt < usdtLower ? 'Lower' : 'Upper'} Throttle Bot stopped. Before: ${dbUsdt}, Current: ${liveUsdt}`,
            type: ORDER_LOG_TYPE.Warning,
          });
          await this.stopBot(bot.id, bot.coin.id);
          return;
        }

        if (liveCoin < coinLower || liveCoin > coinUpper) {
          this.logger.warn(`Bot ${bot.id} stopped: Token balance drift.`);
          await this.orderLogService.createLog({
            exchange: bot.coin.exchange,
            symbol: bot.coin.symbol,
            text: `Token ${liveCoin < coinLower ? 'Lower' : 'Upper'} Throttle Bot stopped. Before: ${dbCoin}, Current: ${liveCoin}`,
            type: ORDER_LOG_TYPE.Warning,
          });
          await this.stopBot(bot.id, bot.coin.id);
          return;
        }
        await this.executeBot(bot, balances);

        const delay = this.getRandomInt(bot.executionTimingMin, bot.executionTimingMax) * 1000;
        this.nextExecutionMap.set(bot.id, now + delay);

        this.logger.log(
          `Bot ${bot.coin.exchange} ${bot.coin.name} executed. Next in ${delay / 1000}s`,
        );
      }
    }
  }

  // async checkBots() {
  //   const allBots = await this.botRepo.find({
  //     relations: ['coin'],
  //   });

  //   // only active bots
  //   const activeBots = allBots.filter((bot) => bot.status === Status.ON);

  //   for (const bot of activeBots) {
  //     // fetch live balances
  //     const balance: any = await this.mexcService.getBalances(bot.creds);
  //     const balances = balance?.balances ?? [];

  //     const liveUsdtRaw = balances.find((b: any) => b.asset === 'USDT')?.available ?? 0;
  //     const liveCoinRaw = balances.find((b: any) => b.asset === bot.coin.name)?.available ?? 0;

  //     // Normalize to numbers
  //     const liveUsdt = parseFloat(liveUsdtRaw as any) || 0;
  //     const liveCoin = parseFloat(liveCoinRaw as any) || 0;

  //     // DB snapshot values (make sure these fields exist and are numeric)
  //     const dbUsdt = parseFloat(String(bot.usdt_balance ?? 0)) || 0;
  //     const dbCoin = parseFloat(String(bot.token_balance ?? 0)) || 0;

  //     // Throttle values (fallback to 0)
  //     const tokenMinus = parseFloat(String(bot.tokenThrottleMinus ?? 0)) || 0;
  //     const tokenPlus = parseFloat(String(bot.tokenThrottlePlus ?? 0)) || 0;
  //     const currencyMinus = parseFloat(String(bot.currencyThrottleMinus ?? 0)) || 0;
  //     const currencyPlus = parseFloat(String(bot.currencyThrottlePlus ?? 0)) || 0;

  //     // Compute bounds
  //     const usdtLower = dbUsdt - currencyMinus;
  //     const usdtUpper = dbUsdt + currencyPlus;
  //     const coinLower = dbCoin - tokenMinus;
  //     const coinUpper = dbCoin + tokenPlus;

  //     // Debug logging (fixed labels)
  //     this.logger.debug(`BOT[${bot.id}] BALANCE CHECK:
  //     DB USDT = ${dbUsdt}, live USDT = ${liveUsdt}
  //     currencyThrottleMinus = ${currencyMinus}, currencyThrottlePlus = ${currencyPlus}
  //     USDT bounds = [${usdtLower}, ${usdtUpper}]
  //     inRange = ${liveUsdt >= usdtLower && liveUsdt <= usdtUpper}

  //     DB COIN = ${dbCoin}, live COIN = ${liveCoin}
  //     tokenThrottleMinus = ${tokenMinus}, tokenThrottlePlus = ${tokenPlus}
  //     COIN bounds = [${coinLower}, ${coinUpper}]
  //     inRange = ${liveCoin >= coinLower && liveCoin <= coinUpper}
  //   `);

  //     // out-of-range handling
  //     if (liveUsdt < usdtLower || liveUsdt > usdtUpper) {
  //       this.logger.warn(`Bot ${bot.id} stopped: USDT balance drift.`);
  //       await this.orderLogService.createLog({
  //         exchange: bot.coin.exchange,
  //         symbol: bot.coin.symbol,
  //         text: `Currency ${liveUsdt < usdtLower ? 'Lower' : 'Upper'} Throttle Bot stopped. Before: ${dbUsdt}, Current: ${liveUsdt}`,
  //         type: ORDER_LOG_TYPE.Warning,
  //       });
  //       await this.stopBot(bot.id, bot.coin.id);
  //       return;
  //     }

  //     if (liveCoin < coinLower || liveCoin > coinUpper) {
  //       this.logger.warn(`Bot ${bot.id} stopped: Token balance drift.`);
  //       await this.orderLogService.createLog({
  //         exchange: bot.coin.exchange,
  //         symbol: bot.coin.symbol,
  //         text: `Token ${liveCoin < coinLower ? 'Lower' : 'Upper'} Throttle Bot stopped. Before: ${dbCoin}, Current: ${liveCoin}`,
  //         type: ORDER_LOG_TYPE.Warning,
  //       });
  //       await this.stopBot(bot.id, bot.coin.id);
  //       return;
  //     }

  //     // execution timing
  //     const now = Date.now();
  //     const nextExecution = this.nextExecutionMap.get(bot.id) || 0;
  //     if (now >= nextExecution) {
  //       await this.executeBot(bot);

  //       // schedule next run
  //       const delay = this.getRandomInt(bot.executionTimingMin, bot.executionTimingMax) * 1000;
  //       this.nextExecutionMap.set(bot.id, now + delay);

  //       this.logger.log(
  //         `Bot of ${bot.coin.exchange} ${bot.coin.name} scheduled next execution in ${delay / 1000}s`,
  //       );
  //     }
  //   }
  // }

  private async executeBot(bot: VolumeBotSettings, balances: any[]) {
    try {
      // this.logger.warn(
      //   `// ============================================================= BOT ${bot.id} EXECUTE =============================================================//`,
      // );
      // return;
      switch (bot.coin.exchange) {
        case Exchange.MEXC:
          const volume = await this.mexcService.fetch24hrVolumesSymbolWise(bot.creds, 'LFUSDT');
          if (parseFloat(volume.quoteVolume) >= parseFloat(bot.volumeLimit24H)) {
            this.logger.warn(`BOT ${bot.id} STOPPED: VOLUME TRIGGERED!`);
            await this.orderLogService.createLog({
              exchange: bot.coin.exchange,
              symbol: bot.coin.symbol,
              text: `Bot Stopped: 24Hours Volume Triggered!`,
              type: ORDER_LOG_TYPE.Warning,
            });
            await this.stopBot(bot.id, bot.coin.id);
            return;
          }
          // Fetch balances
          // const balance: any = await this.mexcService.getBalances(bot.creds);
          // const balances = balance?.balances ?? [];

          // Find balances
          const usdtBalance = balances.find((b: any) => b.asset === 'USDT');
          const coinBalance = balances.find((b: any) => b.asset === bot.coin.name)?.available ?? 0;
          if (
            !usdtBalance ||
            usdtBalance.available <= MEXC_REQUIRED_MIN_BALANCE ||
            bot.tradeAmountMin > usdtBalance.available
          ) {
            console.log('No sufficient USDT balance found.');
            await this.orderLogService.createLog({
              exchange: bot.coin.exchange,
              symbol: bot.coin.symbol,
              text: `Bot has No Sufficient Currency Balance Found! Current balance is ${usdtBalance.available}`,
              type: ORDER_LOG_TYPE.Warning,
            });
            return;
          }
          console.log('USDT Balance (available):', usdtBalance.available);
          console.log('Coin Balance:', coinBalance);

          // Fetch order book
          const orderBook = await this.mexcService.fetchOrderBookSymbolWise(
            bot.creds,
            bot.coin.symbol,
            1,
          );
          const buy = Number(orderBook.buy.price.toFixed(bot.priceDecimal));
          const sell = Number(orderBook.sell.price.toFixed(bot.priceDecimal));
          console.log(buy, '<---B S--->', sell);

          // Tick size
          const tickSize = 1 / Math.pow(10, bot.priceDecimal);
          const diff = Number(Math.abs(sell - buy).toFixed(bot.priceDecimal));
          const isOneTickDiff = diff === tickSize;

          if (isOneTickDiff) {
            console.log('NOT ORDER PLACE DUE TO PRICE HAS JUST 1 POINT DIFFERENCE');
            await this.orderLogService.createLog({
              exchange: bot.coin.exchange,
              symbol: bot.coin.symbol,
              text: `Trade Skipped - No room for trade`,
              type: ORDER_LOG_TYPE.Warning,
            });
            return;
          }

          // Spread & price calculations
          const spread = +(sell - buy).toFixed(bot.priceDecimal);
          console.log('spread ------> ', spread);
          const multiplyPrice = +(spread * bot.tradeParam); // DON'T APPLY HERE TO FIX WE NEED HERE ALL POINTS
          console.log('multiplyPrice ------> ', multiplyPrice);

          // Random trade amount
          const amount = this.getRandomFloat(
            parseFloat(bot.tradeAmountMin),
            parseFloat(bot.tradeAmountMax),
          );

          // Build order flow
          let order: any[] = [];
          const createOrderPair = (
            side1: ORDER_SIDE,
            side2: ORDER_SIDE,
            tokenQuantity: number,
            price: number,
          ) => [
            {
              symbol: bot.coin.symbol!,
              side: side1,
              type: ORDER_TYPE.Limit!,
              quantity: tokenQuantity,
              price: price.toFixed(bot.priceDecimal),
            },
            {
              symbol: bot.coin.symbol!,
              side: side2,
              type: ORDER_TYPE.Limit!,
              quantity: tokenQuantity,
              price: price.toFixed(bot.priceDecimal),
            },
          ];

          switch (bot.tradeFlow) {
            case TRADE_FLOW.Buy_Sell:
              console.log('buy ------> ', buy);
              let priceBuySell = +(buy + multiplyPrice).toFixed(bot.priceDecimal);
              console.log('priceBuySell ------> ', priceBuySell);

              if (priceBuySell === buy) {
                priceBuySell = priceBuySell + 0.000001;
              }
              console.log('SAME Buy_Sell PRICE ------> ', priceBuySell.toFixed(bot.priceDecimal));

              // Token quantity
              const tokenQuantityBuySell = (
                Number(amount.toFixed(bot.amountDecimal)) / Number(priceBuySell)
              ).toFixed(bot.quantityDecimal);

              if (Number(tokenQuantityBuySell) > Number(coinBalance)) {
                console.log('NOT ENOUGH COIN BALANCE TO PLACE ORDER');
                await this.orderLogService.createLog({
                  exchange: bot.coin.exchange,
                  symbol: bot.coin.symbol,
                  text: `Bot has No Sufficient Token Balance Found! Current balance is ${coinBalance}`,
                  type: ORDER_LOG_TYPE.Warning,
                });
                return;
              }

              order = createOrderPair(
                ORDER_SIDE.Buy,
                ORDER_SIDE.Sell,
                Number(tokenQuantityBuySell),
                priceBuySell,
              );
              break;
            case TRADE_FLOW.Sell_Buy:
              console.log('sell ------> ', sell);
              let priceSellBuy = +(sell - multiplyPrice).toFixed(bot.priceDecimal);
              console.log('priceSellBuy ------> ', priceSellBuy);

              if (priceSellBuy === sell) {
                console.log('SAME Sell_Buy PRICE ------> ', priceSellBuy.toFixed(bot.priceDecimal));
                priceSellBuy = priceSellBuy - 0.000001;
              }

              // Token quantity
              const tokenQuantitySellBuy = (
                Number(amount.toFixed(bot.amountDecimal)) / Number(priceSellBuy)
              ).toFixed(bot.quantityDecimal);
              if (Number(tokenQuantitySellBuy) > Number(coinBalance)) {
                console.log('NOT ENOUGH COIN BALANCE TO PLACE ORDER');
                await this.orderLogService.createLog({
                  exchange: bot.coin.exchange,
                  symbol: bot.coin.symbol,
                  text: `Bot has No Sufficient Token Balance Found! Current balance is ${coinBalance}`,
                  type: ORDER_LOG_TYPE.Warning,
                });
                return;
              }

              order = createOrderPair(
                ORDER_SIDE.Sell,
                ORDER_SIDE.Buy,
                Number(tokenQuantitySellBuy),
                priceSellBuy,
              );
              break;
            case TRADE_FLOW.Mixed:
              const firstSide = Math.random() < 0.5 ? ORDER_SIDE.Buy : ORDER_SIDE.Sell;
              const secondSide = firstSide === ORDER_SIDE.Buy ? ORDER_SIDE.Sell : ORDER_SIDE.Buy;
              let price;
              if (firstSide === ORDER_SIDE.Buy) {
                price = +(buy + multiplyPrice).toFixed(bot.priceDecimal);
                if (price === buy) {
                  console.log('SAME Buy_Sell PRICE ------> ', price.toFixed(bot.priceDecimal));
                  price = price + 0.000001;
                }
              } else if (firstSide === ORDER_SIDE.Sell) {
                price = +(sell - multiplyPrice).toFixed(bot.priceDecimal);
                if (price === sell) {
                  console.log('SAME Sell_Buy PRICE ------> ', price.toFixed(bot.priceDecimal));
                  price = price - 0.000001;
                }
              }
              console.log('price ------> ', price.toFixed(bot.priceDecimal));
              const tokenQuantity = (
                Number(amount.toFixed(bot.amountDecimal)) / Number(price.toFixed(bot.priceDecimal))
              ).toFixed(bot.quantityDecimal);

              if (Number(tokenQuantity) > Number(coinBalance)) {
                console.log('NOT ENOUGH COIN BALANCE TO PLACE ORDER');
                await this.orderLogService.createLog({
                  exchange: bot.coin.exchange,
                  symbol: bot.coin.symbol,
                  text: `Bot has No Sufficient Token Balance Found! Current balance is ${coinBalance}`,
                  type: ORDER_LOG_TYPE.Warning,
                });
                return;
              }
              order = createOrderPair(firstSide, secondSide, Number(tokenQuantity), price);
              break;
          }

          console.log('ORDERS ---------------- :', order);

          // Execute batch order
          const orders = await this.orderService.createBatch(
            null,
            bot.coin.exchange,
            bot.coin.symbol,
            order,
          );
          // console.log('orders ---------------- :', orders);

          // Extract orderIds
          const orderIds = orders.savedOrders.map((o) => o.orderId);
          // console.log('cancel order id ------------ : ', orderIds);

          // Cancel all those orders
          await this.mexcService.cancelAllCoinWiseOrders(bot.creds, bot.coin.symbol, orderIds);
          await this.orderService.updateStatusBatch(orderIds, ORDER_STATUS.CANCELED);
          this.logger.log(
            `Bot ${bot.id} executed ${bot.tradeFlow} order of ${amount} ${bot.coin.symbol}`,
          );

          break;

        default:
          break;
      }
    } catch (err) {
      await this.orderLogService.createLog({
        exchange: bot.coin.exchange,
        symbol: bot.coin.symbol,
        text: `BOT ERROR EXECUTION FAILED = ${err.message}`,
        type: ORDER_LOG_TYPE.Error,
      });
      this.logger.error(`Bot ${bot.id} execution failed: ${err.message}`);
    }
  }

  private async stopBot(botId: number, coinId: number) {
    await this.coinService.statusUpdate({ coinId, botType: BotType.Volume, status: Status.OFF });
    this.nextExecutionMap.delete(botId); // stop scheduling further
  }

  private getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private getRandomFloat(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }
}
