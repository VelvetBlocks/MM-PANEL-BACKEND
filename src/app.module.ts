import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import appConfig from './common/config/app.config';
import databaseConfig from './common/config/database.config';
import jwtConfig from './common/config/jwt.config';
import { validate } from './common/validation/env.validation';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import redisConfig from './common/config/redis.config';
import { RedisModule } from './redis/redis.module';
import swaggerConfig from './common/config/swagger.config';
import { MexcModule } from './mexc/mexc.module';
import { IpGuard } from './common/guards/ip.guard';
import { OrderModule } from './order/order.module';
import { CoinsModule } from './coins/coin.module';
import { VolumeBotSettingsModule } from './vol_bot_setting/vol-bot-setting.module';
import { ScheduleModule } from '@nestjs/schedule';
import { BalanceModule } from './balance/balances.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig, databaseConfig, redisConfig, swaggerConfig],
      validate,
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    RedisModule,
    AuthModule,
    UsersModule,
    MexcModule,
    CoinsModule,
    VolumeBotSettingsModule,
    OrderModule,
    BalanceModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // {
    //   provide: APP_GUARD,
    //   useClass: IpGuard,
    // },
  ],
})
export class AppModule {}
