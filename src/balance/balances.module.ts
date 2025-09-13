import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VolumeBotSettingsModule } from 'src/vol_bot_setting/vol-bot-setting.module';
import { Balance } from './entities/balances.entity';
import { BalanceService } from './balances.service';

@Module({
  imports: [TypeOrmModule.forFeature([Balance])],
  controllers: [],
  providers: [BalanceService],
  exports: [BalanceService],
})
export class BalanceModule {}
