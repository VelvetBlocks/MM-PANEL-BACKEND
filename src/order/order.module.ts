import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { UsersModule } from 'src/users/users.module';
import { MexcModule } from 'src/mexc/mexc.module';
import { VolumeBotSettingsModule } from 'src/vol_bot_setting/vol-bot-setting.module';
import { OrderLog } from './entities/order-log.entity';
import { OrderLogService } from './services/order-log.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderLog]),
    UsersModule,
    MexcModule,
    forwardRef(() => VolumeBotSettingsModule),
  ],
  controllers: [OrderController],
  providers: [OrderService, OrderLogService],
  exports: [OrderService, OrderLogService],
})
export class OrderModule {}
