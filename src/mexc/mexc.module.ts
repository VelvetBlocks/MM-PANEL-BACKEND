import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MexcController } from "./mexc.controller";
import { MexcService } from "./mexc.service";
import { UsersModule } from "src/users/users.module";

@Module({
  imports: [
    // TypeOrmModule.forFeature([User]),
    UsersModule,
  ],
  controllers: [MexcController],
  providers: [MexcService],
})
export class MexcModule {}
