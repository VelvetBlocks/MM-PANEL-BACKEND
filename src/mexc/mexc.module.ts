import { Module } from '@nestjs/common';
import { MexcService } from './mexc.service';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [],
  providers: [MexcService],
  exports: [MexcService],
})
export class MexcModule {}
