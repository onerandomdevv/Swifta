import { Module } from "@nestjs/common";
import { BnplController } from "./bnpl.controller";
import { BnplService } from "./bnpl.service";
import { PrismaModule } from "../../prisma/prisma.module";
import { MockBnplClient } from "./mock-bnpl.client";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [BnplController],
  providers: [
    BnplService,
    {
      provide: "BNPL_PARTNER_CLIENT",
      useFactory: (config: ConfigService) => {
        // Here we could switch based on config.get("BNPL_PARTNER")
        // For now, we use the Mock client as required locally.
        return new MockBnplClient();
      },
      inject: [ConfigService],
    },
  ],
  exports: [BnplService],
})
export class BnplModule {}
