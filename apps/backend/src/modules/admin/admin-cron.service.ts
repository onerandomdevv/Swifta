import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../../prisma/prisma.service";
import { OrderStatus } from "@swifta/shared";
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

      // 1. Auto-confirm orders older than 72h
      const overdueOrders = await this.prisma.order.findMany({
        where: {
          status: { in: [OrderStatus.DISPATCHED, OrderStatus.IN_TRANSIT] },
          updatedAt: {
            lt: seventyTwoHoursAgo,
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
          updatedAt: {
            lt: twentyFourHoursAgo,
            gt: seventyTwoHoursAgo,
          },
        },
        select: { id: true, buyerId: true, updatedAt: true, meta: true },
      });

      for (const order of warningCandidates) {
        try {
          const hoursSinceUpdate =
            (Date.now() - order.updatedAt.getTime()) / (1000 * 60 * 60);

          const meta = (order.meta as any) || {};

          // Decision logic based on hours since last update
          if (hoursSinceUpdate >= 48) {
            // Already past 48h (24h remaining), check if this specific warning was sent
            if (!meta.autoConfirmationWarningSent48) {
              await this.notifications.triggerAutoConfirmationWarning(
                order.buyerId,
                order.id.slice(0, 8).toUpperCase(),
                24, // 24h remaining until 72h mark
              );

              await this.prisma.order.update({
                where: { id: order.id },
                data: {
                  meta: {
                    ...meta,
                    autoConfirmationWarningSent48: true,
                  },
                },
              });
              this.logger.log(
                `Sent 24h remaining warning (at 48h mark) for order ${order.id}`,
              );
            }
          } else if (hoursSinceUpdate >= 24) {
            // Past 24h but less than 48h (48h remaining)
            if (!meta.autoConfirmationWarningSent24) {
              await this.notifications.triggerAutoConfirmationWarning(
                order.buyerId,
                order.id.slice(0, 8).toUpperCase(),
                48, // 48h remaining until 72h mark
              );

              await this.prisma.order.update({
                where: { id: order.id },
                data: {
                  meta: {
                    ...meta,
                    autoConfirmationWarningSent24: true,
                  },
                },
              });
              this.logger.log(
                `Sent 48h remaining warning (at 24h mark) for order ${order.id}`,
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
