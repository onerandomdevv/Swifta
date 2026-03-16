import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../../prisma/prisma.service";
import { OrderStatus } from "@swifta/shared";
import { OrderService } from "../order/order.service";
import { NotificationTriggerService } from "../notification/notification-trigger.service";

@Injectable()
export class AdminCronService {
  private readonly logger = new Logger(AdminCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly orderService: OrderService,
    private readonly notifications: NotificationTriggerService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleUnconfirmedDeliveries() {
    this.logger.log("Scanning for unconfirmed deliveries requiring action...");

    const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // 1. Auto-confirm orders older than 72h
    const overdueOrders = await this.prisma.order.findMany({
      where: {
        status: { in: [OrderStatus.DISPATCHED, OrderStatus.IN_TRANSIT] },
        updatedAt: { lt: seventyTwoHoursAgo },
      },
    });

    for (const order of overdueOrders) {
      try {
        await this.orderService.autoConfirmDelivery(order.id);
        this.logger.log(`Auto-confirmed order ${order.id} (over 72h since update)`);
      } catch (err: unknown) {
        this.logger.error(`Failed to auto-confirm order ${order.id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // 2. 48h & 24h Warnings
    // For simplicity, we scan orders in the warning windows and trigger if not already warned (mocking warning status via logs for now, or could use metadata)
    const warningCandidates = await this.prisma.order.findMany({
      where: {
        status: { in: [OrderStatus.DISPATCHED, OrderStatus.IN_TRANSIT] },
        updatedAt: {
          lt: twentyFourHoursAgo,
          gt: seventyTwoHoursAgo,
        },
      },
      select: { id: true, buyerId: true, updatedAt: true },
    });

    for (const order of warningCandidates) {
      const hoursSinceUpdate = (Date.now() - order.updatedAt.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceUpdate >= 48 && hoursSinceUpdate < 49) {
        // 48h Warning
        await this.notifications.triggerAutoConfirmationWarning(order.buyerId, order.id.slice(0, 8).toUpperCase(), 24);
      } else if (hoursSinceUpdate >= 24 && hoursSinceUpdate < 25) {
        // 24h Warning
        await this.notifications.triggerAutoConfirmationWarning(order.buyerId, order.id.slice(0, 8).toUpperCase(), 48);
      }
    }
  }

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
