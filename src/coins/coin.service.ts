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
import { CreateCoinDto } from './dto/create-coin.dto';
import { VolumeBotSettingsService } from 'src/vol_bot_setting/vol-bot-setting.service';
import { VolumeBotSettings } from 'src/vol_bot_setting/entities/vol-bot-setting.entity';

@Injectable()
export class CoinsService {
  constructor(
    @InjectRepository(Coins)
    private readonly coinsRepo: Repository<Coins>,
    @Inject(forwardRef(() => VolumeBotSettingsService))
    private readonly volumeBotSettingsService: VolumeBotSettingsService,
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
    });
  }

  /** Get all coins */
  async findAll(): Promise<Coins[]> {
    return await this.coinsRepo.find();
  }

  /** Get coin by exchange */
  async findExcCoins(exchange: Exchange): Promise<Coins[]> {
    const coin = await this.coinsRepo.find({ where: { exchange } });
    if (!coin) throw new NotFoundException(`Coin with ${exchange} not found`);
    return coin;
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
