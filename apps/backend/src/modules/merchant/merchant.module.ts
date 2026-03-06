import { Module } from "@nestjs/common";
import { MerchantService } from "./merchant.service";
import { MerchantController } from "./merchant.controller";
import { PrismaModule } from "../../prisma/prisma.module";
import { PaymentModule } from "../payment/payment.module";

@Module({
  imports: [PrismaModule, PaymentModule],
  controllers: [MerchantController],
  providers: [MerchantService],
  exports: [MerchantService],
})
export class MerchantModule {}
