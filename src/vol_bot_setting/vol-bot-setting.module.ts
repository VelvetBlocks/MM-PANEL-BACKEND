import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VolumeBotSettings } from './entities/vol-bot-setting.entity';
import { VolBotSettingsController } from './vol-bot-setting.controller';
import { VolumeBotSettingsService } from './vol-bot-setting.service';
import { CoinsModule } from 'src/coins/coin.module';
import { OrderModule } from 'src/order/order.module';
import { VolumeBotScheduler } from './vol-bot-scheduler';
import { MexcModule } from 'src/mexc/mexc.module';
import { BalanceModule } from 'src/balance/balances.module';
import { Coins } from 'src/coins/entities/coin.entity';
import { ResetBalanceHistory } from './entities/reset-balance.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Coins, VolumeBotSettings, ResetBalanceHistory]),
    forwardRef(() => OrderModule),
    forwardRef(() => CoinsModule),
    MexcModule,
    BalanceModule,
  ],
  controllers: [VolBotSettingsController],
  providers: [VolumeBotSettingsService, VolumeBotScheduler],
  exports: [VolumeBotSettingsService],
})
export class VolumeBotSettingsModule {}
