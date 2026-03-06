import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { AuditLogService } from "./audit-log.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "@hardware-os/shared";

const MAX_LIMIT = 100;

function parseAndCapLimit(raw: string | undefined, defaultVal: number): number {
  if (!raw) return defaultVal;
  const parsed = parseInt(raw, 10);
  if (isNaN(parsed) || parsed <= 0) {
    throw new BadRequestException("limit must be a positive integer.");
  }
  return Math.min(parsed, MAX_LIMIT);
}

@Controller("admin/audit-logs")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  getRecentLogs(@Query("limit") limit?: string) {
    return this.auditLogService.getRecent(parseAndCapLimit(limit, 30));
  }

  @Get("user/:userId")
  getLogsByUser(
    @Param("userId") userId: string,
    @Query("limit") limit?: string,
  ) {
    return this.auditLogService.getByUser(userId, parseAndCapLimit(limit, 50));
  }

  @Get("target/:targetType/:targetId")
  getLogsByTarget(
    @Param("targetType") targetType: string,
    @Param("targetId") targetId: string,
    @Query("limit") limit?: string,
  ) {
    return this.auditLogService.getByTarget(
      targetType,
      targetId,
      parseAndCapLimit(limit, 50),
    );
  }
}
