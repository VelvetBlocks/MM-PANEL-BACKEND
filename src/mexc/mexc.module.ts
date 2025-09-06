import { Module } from '@nestjs/common';
import { MexcController } from './mexc.controller';
import { MexcService } from './mexc.service';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [MexcController],
  providers: [MexcService],
  exports: [MexcService],
})
export class MexcModule {}
