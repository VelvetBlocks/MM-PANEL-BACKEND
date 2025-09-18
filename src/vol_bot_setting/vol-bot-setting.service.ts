import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VolumeBotSettings } from './entities/vol-bot-setting.entity';
import { UpdateVolumeBotSettingsDto } from './dto/vol-bot-setting.dto';
import { Exchange } from 'src/coins/entities/coin.entity';
import { MexcService } from 'src/mexc/mexc.service';
import { BalanceService } from 'src/balance/balances.service';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class VolumeBotSettingsService {
  private readonly logger = new Logger(VolumeBotSettingsService.name);

  constructor(
    @InjectRepository(VolumeBotSettings)
    private readonly botRepo: Repository<VolumeBotSettings>,
    private readonly mexcService: MexcService,
    private readonly balanceService: BalanceService,
    // @Inject(forwardRef(() => CoinsService))
    // private readonly coinsService: CoinsService
  ) {}

  // Add new VolumeBotSetting
  async add(data: Partial<VolumeBotSettings>): Promise<VolumeBotSettings> {
    const botSetting = this.botRepo.create(data);
    return await this.botRepo.save(botSetting);
  }

  // Update VolumeBotSetting by ID
  async update(
    userId: string,
    id: number,
    data: UpdateVolumeBotSettingsDto,
  ): Promise<VolumeBotSettings> {
    // Get the current stored botSetting
    const existingBotSetting = await this.botRepo.findOne({ where: { id }, relations: ['coin'] });
    if (!existingBotSetting) throw new NotFoundException('Bot setting not found!');

    // Keep old creds before update
    const oldApiKey = existingBotSetting.creds?.apiKey;
    const oldSecretKey = existingBotSetting.creds?.secretKey;

    // Apply updates
    Object.assign(existingBotSetting, data);
    const savedBot = await this.botRepo.save(existingBotSetting);
    const bot = { ...savedBot, coin: existingBotSetting.coin };

    // ✅ Check if creds were added or changed
    const newApiKey = bot.creds?.apiKey;
    const newSecretKey = bot.creds?.secretKey;

    const credsAddedOrChanged =
      newApiKey && newSecretKey && (newApiKey !== oldApiKey || newSecretKey !== oldSecretKey);

    if (credsAddedOrChanged) {
      switch (bot?.coin?.exchange) {
        case Exchange.MEXC:
          const balance: any = await this.mexcService.getBalances(bot.creds);
          if (balance.code) {
            throw new BadRequestException(balance.msg || 'Failed to fetch MEXC balance');
          }

          // ✅ Find the matching coin balance by asset name
          const botUsdt = balance.balances.find((b: any) => b.asset.toUpperCase() === 'USDT');
          const botAsset = balance.balances.find(
            (b: any) => b.asset.toUpperCase() === bot.coin.name.toUpperCase(),
          );
          if (botAsset) {
            bot.token_balance = parseFloat(botAsset.available);
            await this.botRepo.save(bot);
          } else {
            bot.token_balance = 0; // default to 0 if not found
            await this.botRepo.save(bot);
          }
          if (botUsdt) {
            bot.usdt_balance = parseFloat(botUsdt.available);
            await this.botRepo.save(bot);
          } else {
            bot.usdt_balance = 0; // default to 0 if not found
            await this.botRepo.save(bot);
          }
          break;

        default:
          break;
      }
    }
    return bot;
  }

  async resetBalances(botId: number): Promise<VolumeBotSettings> {
    // 1. Find bot with relation
    const bot = await this.botRepo.findOne({
      where: { id: botId },
      relations: ['coin'],
    });
    if (!bot) throw new NotFoundException('Bot setting not found!');

    if (!bot.creds?.apiKey || !bot.creds?.secretKey) {
      throw new BadRequestException('Missing API credentials for this bot');
    }

    switch (bot.coin.exchange) {
      case Exchange.MEXC:
        try {
          const balance: any = await this.mexcService.getBalances(bot.creds);

          if (balance.code) {
            throw new BadRequestException(balance.msg || 'Failed to fetch MEXC balance');
          }

          const botUsdt = balance.balances.find((b: any) => b.asset.toUpperCase() === 'USDT');
          const botAsset = balance.balances.find(
            (b: any) => b.asset.toUpperCase() === bot.coin.name.toUpperCase(),
          );

          bot.usdt_balance = botUsdt ? parseFloat(botUsdt.available) : 0;
          bot.token_balance = botAsset ? parseFloat(botAsset.available) : 0;

          await this.botRepo.save(bot);

          this.logger.log(
            `Bot ${bot.id} balances reset → USDT: ${bot.usdt_balance}, ${bot.coin.name}: ${bot.token_balance}`,
          );
        } catch (err) {
          this.logger.error(`Failed to reset balances for bot ${bot.id}: ${err.message}`);
          throw err;
        }
        break;

      default:
        throw new BadRequestException(
          `Reset balances not implemented for exchange: ${bot.coin.exchange}`,
        );
    }

    return bot;
  }

  async getByCoin(coinId: number): Promise<VolumeBotSettings | null> {
    const setting = await this.botRepo.findOne({
      where: { coin: { id: coinId } },
      relations: ['coin'],
    });
    if (!setting) return null;
    // Convert to class instance and include group 'withCreds'
    return plainToInstance(VolumeBotSettings, setting, { groups: ['withCreds'] });
  }

  // Get all bot settings for a specific coin
  async getByExchangeCoinName(exchange: Exchange, symbol: string): Promise<VolumeBotSettings> {
    return this.botRepo.findOne({
      where: { coin: { symbol: symbol, exchange: exchange } },
      relations: ['coin'],
    });
  }

  // Get single bot setting by ID
  async getById(id: number): Promise<VolumeBotSettings> {
    const botSetting = await this.botRepo.findOne({
      where: { id },
      relations: ['coin'],
    });
    if (!botSetting) throw new NotFoundException('Bot setting not found');
    return botSetting;
  }

  // Get all bot settings
  async getAll(): Promise<VolumeBotSettings[]> {
    return this.botRepo.find({
      relations: ['coin'],
    });
  }
}
