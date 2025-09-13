import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Coins } from './entities/coin.entity';
import { CoinsController } from './coin.controller';
import { CoinsService } from './coin.service';
import { VolumeBotSettingsModule } from 'src/vol_bot_setting/vol-bot-setting.module';
import { VolumeBotSettings } from 'src/vol_bot_setting/entities/vol-bot-setting.entity';
import { MexcModule } from 'src/mexc/mexc.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Coins, VolumeBotSettings]),
    forwardRef(() => VolumeBotSettingsModule),
    MexcModule,
  ],
  controllers: [CoinsController],
  providers: [CoinsService],
  exports: [CoinsService],
})
export class CoinsModule {}
