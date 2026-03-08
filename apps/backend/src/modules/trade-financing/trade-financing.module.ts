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
        const partner = config.get("FINANCING_PARTNER") || "mock";
        if (partner === "mock") {
          return new MockTradeFinancingClient();
        }
        throw new Error(
          `Trade Financing partner '${partner}' is not supported yet.`,
        );
      },
      inject: [ConfigService],
    },
  ],
  exports: [TradeFinancingService],
})
export class TradeFinancingModule {}
