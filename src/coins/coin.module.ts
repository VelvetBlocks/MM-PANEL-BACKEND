import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Coins } from './entities/coin.entity';
import { CoinsController } from './coin.controller';
import { CoinsService } from './coin.service';
import { VolumeBotSettingsModule } from 'src/vol_bot_setting/vol-bot-setting.module';

@Module({
  imports: [TypeOrmModule.forFeature([Coins]), forwardRef(() => VolumeBotSettingsModule)],
  controllers: [CoinsController],
  providers: [CoinsService],
  exports: [CoinsService],
})
export class CoinsModule {}
