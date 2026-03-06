import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { AuditLogService } from "./audit-log.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "@hardware-os/shared";

@Controller("admin/audit-logs")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  getRecentLogs(@Query("limit") limit?: string) {
    return this.auditLogService.getRecent(limit ? parseInt(limit, 10) : 30);
  }

  @Get("user/:userId")
  getLogsByUser(
    @Param("userId") userId: string,
    @Query("limit") limit?: string,
  ) {
    return this.auditLogService.getByUser(
      userId,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Get("target/:targetType/:targetId")
  getLogsByTarget(
    @Param("targetType") targetType: string,
    @Param("targetId") targetId: string,
  ) {
    return this.auditLogService.getByTarget(targetType, targetId);
  }
}
