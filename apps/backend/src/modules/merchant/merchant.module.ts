import { Module } from "@nestjs/common";
import { MerchantService } from "./merchant.service";
import { MerchantController } from "./merchant.controller";
import { PrismaModule } from "../../prisma/prisma.module";
import { PaymentModule } from "../payment/payment.module";

import { MerchantAnalyticsService } from "./merchant-analytics.service";

@Module({
  imports: [PrismaModule, PaymentModule],
  controllers: [MerchantController],
  providers: [MerchantService, MerchantAnalyticsService],
  exports: [MerchantService, MerchantAnalyticsService],
})
export class MerchantModule {}
