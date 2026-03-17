import { Module, Global } from "@nestjs/common";
import { NotificationService } from "./notification.service";
import { NotificationController } from "./notification.controller";
import { NotificationTriggerService } from "./notification-trigger.service";
import { NotificationProcessor } from "./notification.processor";
import { SmsService } from "./sms.service";
import { PrismaModule } from "../../prisma/prisma.module";
import { QueueModule } from "../../queue/queue.module";
import { ConfigModule } from "@nestjs/config";

@Global()
@Module({
  imports: [PrismaModule, QueueModule, ConfigModule],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationTriggerService,
    NotificationProcessor,
    SmsService,
  ],
  exports: [NotificationService, NotificationTriggerService, SmsService],
})
export class NotificationModule {}
