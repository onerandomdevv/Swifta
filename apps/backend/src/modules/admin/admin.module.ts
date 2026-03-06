import { Module, forwardRef } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { AdminCronService } from "./admin-cron.service";
import { AuditLogService } from "./audit-log.service";
import { AuditLogController } from "./audit-log.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [PrismaModule, forwardRef(() => AuthModule)],
  controllers: [AdminController, AuditLogController],
  providers: [AdminService, AdminCronService, AuditLogService],
  exports: [AdminService, AuditLogService],
})
export class AdminModule {}
