import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VolumeBotSettings } from './entities/vol-bot-setting.entity';
import { VolBotSettingsController } from './vol-bot-setting.controller';
import { VolumeBotSettingsService } from './vol-bot-setting.service';
import { CoinsModule } from 'src/coins/coin.module';

@Module({
  imports: [TypeOrmModule.forFeature([VolumeBotSettings]), forwardRef(() => CoinsModule)],
  controllers: [VolBotSettingsController],
  providers: [VolumeBotSettingsService],
  exports: [VolumeBotSettingsService],
})
export class VolumeBotSettingsModule {}
