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
import { BotStatusUpdateDto, CreateCoinDto, FindExcCoinsDto } from './dto/create-coin.dto';
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
      const bot = coin.volBotSettings?.[0]; // take first setting
      if (!bot) continue;

      switch (coin.exchange) {
        case 'MEXC': {
          // Parse credentials (they are JSON from DB)
          let credentials: any;
          try {
            credentials = typeof bot.creds === 'string' ? JSON.parse(bot.creds) : bot.creds;
          } catch (err) {
            continue; // skip if credentials are not valid JSON
          }

          // Validate credentials: must have apiKey & secretKey
          if (!credentials?.apiKey || !credentials?.secretKey) {
            continue; // skip this coin if missing keys
          }

          // Call exchange API safely
          const balance: any = await this.mexcService.getBalances(credentials);
          if (balance?.code) {
            // if API error, skip but don’t break the loop
            continue;
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

  /** Get coin by exchange */
  async findExcCoins(data: FindExcCoinsDto): Promise<any> {
    const coin = await this.coinsRepo
      .createQueryBuilder('coin')
      .where('coin.exchange = :exchange', { exchange: data.exchange })
      .andWhere('coin.symbol = :symbol', { symbol: data.symbol })
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
      .getOne();

    if (!coin) throw new NotFoundException(`Coin with ${data.exchange} not found`);

    // --- Normalize volBotSettings to an object (if it's an array take first item) ---
    let vol = coin.volBotSettings;
    if (Array.isArray(vol)) {
      vol = vol.length ? vol[0] : null;
    }
    // attach normalized object back
    coin.volBotSettings = vol;

    // If we have vol settings and this is MEXC, fetch live balances and merge
    if (coin.exchange === 'MEXC' && vol) {
      let credentials: any = null;
      try {
        credentials = typeof vol.creds === 'string' ? JSON.parse(vol.creds) : vol.creds;
      } catch (err) {
        credentials = null;
      }

      if (credentials?.apiKey && credentials?.secretKey) {
        try {
          const balance: any = await this.mexcService.getBalances(credentials);

          if (!balance?.code && Array.isArray(balance.balances)) {
            const botUsdt = balance.balances.find((b: any) => b.asset.toUpperCase() === 'USDT');
            const botAsset = balance.balances.find(
              (b: any) => b.asset.toUpperCase() === coin.name.toUpperCase(),
            );

            const dbTokenBalance = vol.token_balance || 0;
            const dbUsdtBalance = vol.usdt_balance || 0;

            const liveTokenBalance = botAsset ? parseFloat(botAsset.available) : 0;
            const liveUsdtBalance = botUsdt ? parseFloat(botUsdt.available) : 0;
            const liveTokenBalanceLocked = botAsset ? parseFloat(botAsset.locked) : 0;
            const liveUsdtBalanceLocked = botUsdt ? parseFloat(botUsdt.locked) : 0;

            vol.token_balance_locked = liveTokenBalanceLocked;
            vol.usdt_balance_locked = liveUsdtBalanceLocked;
            vol.token_balance_free = liveTokenBalance;
            vol.usdt_balance_free = liveUsdtBalance;

            vol.change_token_balance = liveTokenBalance - dbTokenBalance;
            vol.change_usdt_balance = liveUsdtBalance - dbUsdtBalance;
          }
        } catch (err) {
          // don't throw — just log and return DB values
          if ((this as any).logger) (this as any).logger.warn('MEXC balance fetch failed', err);
        }
      }

      // remove creds before returning
      if (vol.creds) delete vol.creds;
    }

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
