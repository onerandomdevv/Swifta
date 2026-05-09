import { Module, forwardRef } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { LogisticsController } from "./logistics.controller";
import { LogisticsService } from "./logistics.service";
import { MockLogisticsClient } from "./clients/logistics.client";
import { PrismaModule } from "../../prisma/prisma.module";
import { WhatsAppModule } from "../../channels/whatsapp/whatsapp.module";
import { LogisticsProcessor } from "../../queue/logistics.processor";
import { LOGISTICS_QUEUE } from "../../queue/queue.constants";

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => WhatsAppModule),
    BullModule.registerQueue({ name: LOGISTICS_QUEUE }),
  ],
  controllers: [LogisticsController],
  providers: [
    LogisticsService,
    LogisticsProcessor,
    {
      provide: "LogisticsClient",
      useClass: MockLogisticsClient, // Can swap out with real logic based on ConfigService later
    },
  ],
  exports: [LogisticsService],
})
export class LogisticsModule {}
