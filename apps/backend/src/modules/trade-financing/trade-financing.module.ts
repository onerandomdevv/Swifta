import { Module } from "@nestjs/common";
import { TradeFinancingController } from "./trade-financing.controller";
import { TradeFinancingService } from "./trade-financing.service";
import { PrismaModule } from "../../prisma/prisma.module";
import { MockTradeFinancingClient } from "./mock-trade-financing.client";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [TradeFinancingController],
  providers: [
    TradeFinancingService,
    {
      provide: "TRADE_FINANCING_PARTNER_CLIENT",
      useFactory: (config: ConfigService) => {
        // Here we could switch based on config.get("FINANCING_PARTNER")
        // For now, we use the Mock client as required locally.
        return new MockTradeFinancingClient();
      },
      inject: [ConfigService],
    },
  ],
  exports: [TradeFinancingService],
})
export class TradeFinancingModule {}
