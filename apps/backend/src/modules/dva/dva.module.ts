import { Module } from "@nestjs/common";
import { DvaController } from "./dva.controller";
import { DvaService } from "./dva.service";
import { PrismaModule } from "../../prisma/prisma.module";
import { PaystackModule } from "../../integrations/paystack/paystack.module";

@Module({
  imports: [PrismaModule, PaystackModule],
  controllers: [DvaController],
  providers: [DvaService],
  exports: [DvaService],
})
export class DvaModule {}
