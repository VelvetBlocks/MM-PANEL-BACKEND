import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VolumeBotSettings } from './entities/vol-bot-setting.entity';
import { UpdateVolumeBotSettingsDto } from './dto/vol-bot-setting.dto';
import { CoinsService } from 'src/coins/coin.service';

@Injectable()
export class VolumeBotSettingsService {
  constructor(
    @InjectRepository(VolumeBotSettings)
    private readonly botRepo: Repository<VolumeBotSettings>,
    // @Inject(forwardRef(() => CoinsService))
    // private readonly coinsService: CoinsService
  ) {}

  // Add new VolumeBotSetting
  async add(data: Partial<VolumeBotSettings>): Promise<VolumeBotSettings> {
    console.log('data ----------> ', data);

    const botSetting = this.botRepo.create(data);
    console.log('botSetting ----------> ', botSetting);
    return await this.botRepo.save(botSetting);
  }

  // Update VolumeBotSetting by ID
  async update(id: number, data: UpdateVolumeBotSettingsDto): Promise<VolumeBotSettings> {
    const botSetting = await this.botRepo.findOne({ where: { id } });
    if (!botSetting) throw new NotFoundException('Bot setting not found');

    Object.assign(botSetting, data);
    return await this.botRepo.save(botSetting);
  }

  // Update VolumeBotSetting by ID
  async statusUpdate(id: number, data: UpdateVolumeBotSettingsDto): Promise<VolumeBotSettings> {
    const botSetting = await this.botRepo.findOne({ where: { id } });
    if (!botSetting) throw new NotFoundException('Bot setting not found');

    Object.assign(botSetting, data);
    return await this.botRepo.save(botSetting);
  }

  // Get all bot settings for a specific coin
  async getByCoin(coinId: number): Promise<VolumeBotSettings> {
    // const coin = await this.coinsService.findOne(coinId);
    // if (!coin) throw new NotFoundException("Coin not found");

    return this.botRepo.findOne({
      where: { coin: { id: coinId } },
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
