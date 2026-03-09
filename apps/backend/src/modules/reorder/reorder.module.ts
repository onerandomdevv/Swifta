import { Module } from "@nestjs/common";
import { ReorderService } from "./reorder.service";
import { ReorderController } from "./reorder.controller";
import { ReorderReminderProcessor } from "./reorder-reminder.processor";
import { PrismaModule } from "../../prisma/prisma.module";
import { NotificationModule } from "../notification/notification.module";
import { QueueModule } from "../../queue/queue.module";

@Module({
  imports: [PrismaModule, NotificationModule, QueueModule],
  controllers: [ReorderController],
  providers: [ReorderService, ReorderReminderProcessor],
  exports: [ReorderService],
})
export class ReorderModule {}
