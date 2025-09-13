import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coins, Exchange } from './entities/coin.entity';
import { BotStatusUpdateDto, CreateCoinDto } from './dto/create-coin.dto';
import { VolumeBotSettingsService } from 'src/vol_bot_setting/vol-bot-setting.service';
import { VolumeBotSettings } from 'src/vol_bot_setting/entities/vol-bot-setting.entity';
import { MexcService } from 'src/mexc/mexc.service';

@Injectable()
export class CoinsService {
  constructor(
    @InjectRepository(Coins)
    private readonly coinsRepo: Repository<Coins>,
    @Inject(forwardRef(() => VolumeBotSettingsService))
    private readonly volumeBotSettingsService: VolumeBotSettingsService,
    private readonly mexcService: MexcService,
  ) {}

  /** Create a new coin */
  async create(data: CreateCoinDto): Promise<VolumeBotSettings> {
    const exists = await this.coinsRepo.findOne({
      where: { exchange: data.exchange, symbol: data.symbol },
    });

    if (exists) {
      throw new BadRequestException(
        `Coin with symbol "${data.symbol}" already exists for exchange "${data.exchange}"`,
      );
    }

    const coin = this.coinsRepo.create(data);
    const coinDb = await this.coinsRepo.save(coin);
    return await this.volumeBotSettingsService.add({
      coin: coinDb,
      amountDecimal: data.amountDecimal,
      priceDecimal: data.priceDecimal,
      quantityDecimal: data.quantityDecimal,
    });
  }

  /** Get all coins but also fetch balances */
  async findAll(): Promise<any[]> {
    const coins = await this.coinsRepo
      .createQueryBuilder('coin')
      .leftJoinAndSelect('coin.volBotSettings', 'volBotSettings')
      .select([
        'coin.id',
        'coin.userId',
        'coin.exchange',
        'coin.symbol',
        'coin.name',
        'coin.icon',
        'coin.status',
        'coin.createdAt',
        'volBotSettings.id',
        'volBotSettings.priceDecimal',
        'volBotSettings.quantityDecimal',
        'volBotSettings.amountDecimal',
        'volBotSettings.token_balance',
        'volBotSettings.usdt_balance',
        'volBotSettings.status',
        'volBotSettings.tradeFlow',
        'volBotSettings.creds',
      ])
      .getMany();

    for (const coin of coins) {
      const bot = coin.volBotSettings?.[0]; // 👈 take first element

      if (!bot) continue;

      switch (coin.exchange) {
        case 'MEXC': {
          const balance: any = await this.mexcService.getBalances(bot.creds);
          if (balance.code) {
            throw new BadRequestException(balance.msg || 'Failed to fetch MEXC balance');
          }

          const botUsdt = balance.balances.find((b: any) => b.asset.toUpperCase() === 'USDT');
          const botAsset = balance.balances.find(
            (b: any) => b.asset.toUpperCase() === coin.name.toUpperCase(),
          );

          const dbTokenBalance = bot.token_balance || 0;
          const dbUsdtBalance = bot.usdt_balance || 0;

          const liveTokenBalance = botAsset ? parseFloat(botAsset.available) : 0;
          const liveUsdtBalance = botUsdt ? parseFloat(botUsdt.available) : 0;
          const liveTokenBalanceLocked = botAsset ? parseFloat(botAsset.locked) : 0;
          const liveUsdtBalanceLocked = botUsdt ? parseFloat(botUsdt.locked) : 0;

          bot.token_balance_locked = liveTokenBalanceLocked;
          bot.usdt_balance_locked = liveUsdtBalanceLocked;
          bot.token_balance_free = liveTokenBalance;
          bot.usdt_balance_free = liveUsdtBalance;

          bot.change_token_balance = liveTokenBalance - dbTokenBalance;
          bot.change_usdt_balance = liveUsdtBalance - dbUsdtBalance;

          delete bot.creds;
          break;
        }
        default:
          break;
      }
      (coin as any).volBotSettings = bot;
    }

    return coins;
  }

  // async findAll(): Promise<any[]> {
  //   // Step 1: Load coins + botSettings (but not creds directly)
  //   const coins = await this.coinsRepo
  //     .createQueryBuilder('coin')
  //     .leftJoinAndSelect('coin.botSettings', 'botSettings')
  //     .select([
  //       'coin.id',
  //       'coin.userId',
  //       'coin.exchange',
  //       'coin.symbol',
  //       'coin.name',
  //       'coin.icon',
  //       'coin.status',
  //       'coin.createdAt',
  //       'botSettings.id',
  //       'botSettings.token_balance',
  //       'botSettings.usdt_balance',
  //       'botSettings.status',
  //       'botSettings.tradeFlow',
  //       'botSettings.creds', // 👈 only to fetch balance, don’t return in response
  //     ])
  //     .getMany();

  //   // Step 2: For each coin, call exchange API to get balances
  //   for (const coin of coins) {
  //     // console.log('coin ------------- : ', coin);

  //     for (const bot of coin.botSettings) {
  //       switch (coin.exchange) {
  //         case 'MEXC': {
  //           const balance: any = await this.mexcService.getBalances(bot.creds);

  //           if (balance.code) {
  //             throw new BadRequestException(balance.msg || 'Failed to fetch MEXC balance');
  //           }
  //            console.log('balance.balances ------------- : ', balance.balances);
  //           console.log('coin ------------- : ', coin);
  //           console.log('bot ------------- : ', bot);
  //           // ✅ Match balances
  //           const botUsdt = balance.balances.find((b: any) => b.asset.toUpperCase() === 'USDT');
  //           const botAsset = balance.balances.find(
  //             (b: any) => b.asset.toUpperCase() === coin.name.toUpperCase(),
  //           );
  //           console.log('botUsdt ------------- : ', botUsdt);
  //           console.log('botAsset ------------- : ', botAsset);
  //           // Save old DB values before overwrite
  //           const dbTokenBalance = bot.token_balance || 0;
  //           const dbUsdtBalance = bot.usdt_balance || 0;

  //           const liveTokenBalance = botAsset ? parseFloat(botAsset.available) : 0;
  //           const liveUsdtBalance = botUsdt ? parseFloat(botUsdt.available) : 0;
  //           console.log('liveTokenBalance ------------- : ', liveTokenBalance, dbTokenBalance);
  //           console.log('liveUsdtBalance ------------- : ', liveUsdtBalance, dbUsdtBalance);
  //           // ✅ Update DB values
  //           bot.token_balance = liveTokenBalance;
  //           bot.usdt_balance = liveUsdtBalance;

  //           // ✅ Calculate diff
  //           bot.pertiontage_token_balance = liveTokenBalance - dbTokenBalance;
  //           bot.pertiontage_usdt_balance = liveUsdtBalance - dbUsdtBalance;

  //           // Don’t expose creds in final response
  //           delete bot.creds;
  //           break;
  //         }
  //         default:
  //           break;
  //       }
  //     }
  //   }
  //   console.log('coins =================== : ', coins);
  //   return coins;
  // }

  /** Get coin by exchange */
  async findExcCoins(exchange: Exchange): Promise<Coins[]> {
    const coin = await this.coinsRepo.find({ where: { exchange } });
    if (!coin) throw new NotFoundException(`Coin with ${exchange} not found`);
    return coin;
  }

  // Update VolumeBotSetting by ID
  async statusUpdate(data: BotStatusUpdateDto): Promise<Coins> {
    const botSetting = await this.coinsRepo.findOne({ where: { id: data.id } });
    if (!botSetting) throw new NotFoundException('Bot setting not found');
    botSetting.status = data.status;
    return await this.coinsRepo.save(botSetting);
  }

  /** Get coin by ID */
  async findOne(id: number): Promise<Coins> {
    const coin = await this.coinsRepo.findOne({ where: { id } });
    if (!coin) throw new NotFoundException(`Coin with ID ${id} not found`);
    return coin;
  }

  /** Update coin */
  async update(id: number, data: Partial<Coins>): Promise<Coins> {
    const coin = await this.findOne(id);
    if (!coin) {
      throw new NotFoundException(`Coin with id ${id} not found`);
    }

    // If exchange or symbol is being changed, check for duplicates
    const newExchange = data.exchange ?? coin.exchange;
    const newSymbol = data.symbol ?? coin.symbol;

    const exists = await this.coinsRepo.findOne({
      where: { exchange: newExchange, symbol: newSymbol },
    });

    if (exists && exists.id !== id) {
      throw new BadRequestException(
        `Coin with symbol "${newSymbol}" already exists for exchange "${newExchange}"`,
      );
    }

    Object.assign(coin, data);
    return await this.coinsRepo.save(coin);
  }

  /** Delete coin */
  async remove(id: number): Promise<void> {
    const coin = await this.findOne(id);
    await this.coinsRepo.remove(coin);
  }
}
