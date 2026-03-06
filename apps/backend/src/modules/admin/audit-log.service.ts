import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create an audit log entry.
   */
  async log(
    userId: string,
    action: string,
    targetType: string,
    targetId: string,
    metadata?: Record<string, any>,
  ) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action,
          targetType,
          targetId,
          metadata: metadata ?? undefined,
        },
      });
      this.logger.log(
        `AUDIT: ${action} on ${targetType}/${targetId} by user ${userId}`,
      );
    } catch (error) {
      // Never let audit logging break the main flow
      this.logger.error(`Failed to create audit log: ${error}`);
    }
  }

  /**
   * Get all audit entries for a specific entity.
   */
  async getByTarget(targetType: string, targetId: string) {
    return this.prisma.auditLog.findMany({
      where: { targetType, targetId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get all actions performed by a specific user.
   */
  async getByUser(userId: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  /**
   * Get recent audit entries across all users.
   */
  async getRecent(limit = 30) {
    return this.prisma.auditLog.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}
