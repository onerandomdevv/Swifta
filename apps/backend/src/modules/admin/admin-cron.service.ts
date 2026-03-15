import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../../prisma/prisma.service";
import { OrderStatus } from "@swifta/shared";

@Injectable()
export class AdminCronService {
  private readonly logger = new Logger(AdminCronService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Run every hour to check for system-level friction points
  @Cron(CronExpression.EVERY_HOUR)
  async monitorSystemHealth() {
    this.logger.log("Running automated system health checks...");

    // Rule 1: Stuck Escrow (Order PAID but not DISPATCHED for > 48h)
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const stuckOrders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.PAID,
        updatedAt: {
          lt: fortyEightHoursAgo,
        },
      },
      select: { id: true, merchantId: true },
    });

    if (stuckOrders.length > 0) {
      this.logger.warn(
        `CRITICAL: Found ${stuckOrders.length} orders stuck in PAID state for > 48h. Action required.`,
      );
      // Mock triggering a Slack webhook / Email to operations team
    }

    // Rule 2: Verification Choke (Merchants waiting > 24h)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const chokeSize = await this.prisma.merchantProfile.count({
      where: {
        verificationRequests: {
          some: {
            status: "PENDING",
            createdAt: { lt: twentyFourHoursAgo },
          },
        },
      },
    });

    if (chokeSize > 10) {
      this.logger.warn(
        `SLA BREACH: ${chokeSize} merchants have been sitting in the UNVERIFIED queue for > 24h. Platform adoption blocked.`,
      );
      // Mock alerting operations
    }
  }
}
