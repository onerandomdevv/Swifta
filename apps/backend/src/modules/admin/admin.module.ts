import { Module, forwardRef } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { BullModule } from "@nestjs/bullmq";
import { PAYOUT_QUEUE } from "../../queue/queue.constants";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { AdminCronService } from "./admin-cron.service";
import { AuditLogService } from "./audit-log.service";
import { AuditLogController } from "./audit-log.controller";
import { AuthModule } from "../auth/auth.module";
import { VerificationModule } from "../verification/verification.module";

import { OrderModule } from "../order/order.module";

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => AuthModule),
    VerificationModule,
    OrderModule,
    BullModule.registerQueue({ name: PAYOUT_QUEUE }),
  ],
  controllers: [AdminController, AuditLogController],
  providers: [AdminService, AdminCronService, AuditLogService],
  exports: [AdminService, AuditLogService],
})
export class AdminModule {}
