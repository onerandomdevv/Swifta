import { Module } from "@nestjs/common";
import { BuyerDashboardService } from "./buyer-dashboard.service";
import { BuyerController } from "./buyer.controller";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [BuyerController],
  providers: [BuyerDashboardService],
  exports: [BuyerDashboardService],
})
export class BuyerModule {}
