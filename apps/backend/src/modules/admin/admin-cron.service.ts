import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../../prisma/prisma.service";
import { OrderStatus } from "@twizrr/shared";
import { OrderService } from "../order/order.service";
import { NotificationTriggerService } from "../notification/notification-trigger.service";
import { RedisService } from "../../redis/redis.service";
import { PlatformConfig } from "../../config/platform.config";

@Injectable()
export class AdminCronService {
  private readonly logger = new Logger(AdminCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly orderService: OrderService,
    private readonly notifications: NotificationTriggerService,
    private readonly redis: RedisService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleUnconfirmedDeliveries() {
    const lockKey = "lock:admin-cron:unconfirmed-deliveries";
    const lockAcquired = await this.redis.set(lockKey, "locked", 3600, true);

    if (!lockAcquired) {
      this.logger.log(
        "Cron job handleUnconfirmedDeliveries is already running on another instance. Skipping.",
      );
      return;
    }

    try {
      this.logger.log(
        "Scanning for unconfirmed deliveries requiring action...",
      );

      const seventyTwoHoursAgo = new Date(
        Date.now() -
          PlatformConfig.timers.autoConfirmationHours * 60 * 60 * 1000,
      );
      const twentyFourHoursAgo = new Date(
        Date.now() - PlatformConfig.timers.escrowWindowHours * 60 * 60 * 1000,
      );

      const overdueOrders = await this.prisma.order.findMany({
        where: {
          status: { in: [OrderStatus.DISPATCHED, OrderStatus.IN_TRANSIT] },
          dispatchedAt: {
            lt: seventyTwoHoursAgo,
            not: null,
          },
        },
      });

      for (const order of overdueOrders) {
        try {
          await this.orderService.autoConfirmDelivery(order.id);
          this.logger.log(
            `Auto-confirmed order ${order.id} (over ${PlatformConfig.timers.autoConfirmationHours}h since update)`,
          );
        } catch (err: unknown) {
          this.logger.error(
            `Failed to auto-confirm order ${order.id}: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }

      // 2. 48h & 24h Warnings
      const warningCandidates = await this.prisma.order.findMany({
        where: {
          status: { in: [OrderStatus.DISPATCHED, OrderStatus.IN_TRANSIT] },
          dispatchedAt: {
            lt: twentyFourHoursAgo,
            gt: seventyTwoHoursAgo,
            not: null,
          },
        },
        select: { id: true, buyerId: true, dispatchedAt: true, metadata: true },
      });

      for (const order of warningCandidates) {
        try {
          if (!order.dispatchedAt) continue;
          const hoursSinceUpdate =
            (Date.now() - order.dispatchedAt.getTime()) / (1000 * 60 * 60);

          const metadata = (order.metadata as any) || {};

          // Decision logic based on hours since last update
          const cutoff = PlatformConfig.timers.autoConfirmationHours;
          const warningThreshold1 = cutoff / 3; // e.g. 24h if 72h total
          const warningThreshold2 = (cutoff * 2) / 3; // e.g. 48h if 72h total

          // Decision logic based on hours since last update
          if (hoursSinceUpdate >= warningThreshold2) {
            // Already past 2/3 of cutoff mark, check if this specific warning was sent
            if (!metadata.autoConfirmationWarningSent48) {
              const remaining = Math.max(
                0,
                cutoff - Math.floor(hoursSinceUpdate),
              );
              await this.notifications.triggerAutoConfirmationWarning(
                order.buyerId,
                order.id.slice(0, 8).toUpperCase(),
                remaining,
              );

              await this.prisma.order.update({
                where: { id: order.id },
                data: {
                  metadata: {
                    ...metadata,
                    autoConfirmationWarningSent48: true,
                  },
                },
              });
              this.logger.log(
                `Sent warning (${remaining}h remaining) for order ${order.id}`,
              );
            }
          } else if (hoursSinceUpdate >= warningThreshold1) {
            // Past 1/3 but less than 2/3 mark
            if (!metadata.autoConfirmationWarningSent24) {
              const remaining = Math.max(
                0,
                cutoff - Math.floor(hoursSinceUpdate),
              );
              await this.notifications.triggerAutoConfirmationWarning(
                order.buyerId,
                order.id.slice(0, 8).toUpperCase(),
                remaining,
              );

              await this.prisma.order.update({
                where: { id: order.id },
                data: {
                  metadata: {
                    ...metadata,
                    autoConfirmationWarningSent24: true,
                  },
                },
              });
              this.logger.log(
                `Sent warning (${remaining}h remaining) for order ${order.id}`,
              );
            }
          }
        } catch (error) {
          this.logger.error(
            `Failed to process warning for order ${order.id}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    } finally {
      // Release lock after work or failure
      await this.redis.del(lockKey);
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
