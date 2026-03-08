import { Module, forwardRef } from "@nestjs/common";
import { LogisticsController } from "./logistics.controller";
import { LogisticsService } from "./logistics.service";
import { MockLogisticsClient } from "./clients/logistics.client";
import { PrismaModule } from "../../prisma/prisma.module";
import { WhatsAppModule } from "../whatsapp/whatsapp.module";

@Module({
  imports: [PrismaModule, forwardRef(() => WhatsAppModule)],
  controllers: [LogisticsController],
  providers: [
    LogisticsService,
    {
      provide: "LogisticsClient",
      useClass: MockLogisticsClient, // Can swap out with real logic based on ConfigService later
    },
  ],
  exports: [LogisticsService],
})
export class LogisticsModule {}
