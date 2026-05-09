import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { Injectable, Logger, Inject, forwardRef } from "@nestjs/common";
import { AUTO_CONFIRM_QUEUE } from "./queue.constants";
import { PrismaService } from "../prisma/prisma.service";
import { PayoutService } from "../modules/payout/payout.service";
import { WhatsAppService } from "../channels/whatsapp/whatsapp.service";
import { OrderStatus } from "@twizrr/shared";
import { PlatformConfig } from "../config/platform.config";

/**
 * AUTO-CONFIRM PROCESSOR — the ONLY auto-confirm implementation.
 *
 * This BullMQ processor handles the complete auto-confirm lifecycle:
 *   1. First reminder at 1/3 of the auto-confirm window
 *   2. Final warning at 2/3 of the auto-confirm window
 *   3. Auto-confirmation + payout at the full window
 *
 * The auto-confirm window is configured via PlatformConfig.timers.autoConfirmationHours
 * (env: AUTO_CONFIRMATION_HOURS, default: 72h).
 *
 * DO NOT add auto-confirm logic elsewhere (e.g. cron jobs) — it will cause double payouts.
 */
const AUTO_CONFIRM_HOURS = PlatformConfig.timers.autoConfirmationHours;
const REMINDER_FIRST = PlatformConfig.timers.autoConfirmReminderFirstHours;
const REMINDER_FINAL = PlatformConfig.timers.autoConfirmReminderFinalHours;
const DISPUTE_WINDOW_HOURS =
  PlatformConfig.timers.autoConfirmDisputeWindowHours;

@Injectable()
@Processor(AUTO_CONFIRM_QUEUE, {
  drainDelay: 60000,
  stalledInterval: 300000,
  lockDuration: 60000,
})
export class AutoConfirmProcessor extends WorkerHost {
  private readonly logger = new Logger(AutoConfirmProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => PayoutService))
    private readonly payoutService: PayoutService,
    private readonly whatsappService: WhatsAppService,
  ) {
    super();
  }

  /**
   * Formats hours into a human-readable string (e.g. "72 hours" or "3 days")
   */
  private formatDuration(hours: number): string {
    if (hours === 0) return "0 hours";
    if (hours % 24 === 0) {
      const days = hours / 24;
      return `${days} day${days !== 1 ? "s" : ""}`;
    }
    return `${hours} hour${hours !== 1 ? "s" : ""}`;
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Auto-confirm job: ${job.name} (id=${job.id})`);

    switch (job.name) {
      case "send-24h-reminder":
        return this.send24hReminders();
      case "send-48h-warning":
        return this.send48hWarnings();
      case "auto-confirm-deliveries":
        return this.autoConfirmDeliveries();
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  /**
   * Send reminder to buyers past 1/3 of the auto-confirm window
   */
  private async send24hReminders() {
    this.logger.log(`Checking for orders past ${REMINDER_FIRST}h mark...`);
    const cutoffDate = new Date(Date.now() - REMINDER_FIRST * 60 * 60 * 1000);
    const twoDaysCutoff = new Date(
      Date.now() - REMINDER_FINAL * 60 * 60 * 1000,
    );

    const orders = await this.prisma.order.findMany({
      where: {
        status: { in: [OrderStatus.DISPATCHED, OrderStatus.IN_TRANSIT] },
        updatedAt: { lte: cutoffDate, gt: twoDaysCutoff },
        disputeStatus: "NONE",
      },
      include: {
        user: true,
        product: true,
      },
    });

    this.logger.log(`Sending 24h reminders to ${orders.length} buyers...`);

    for (const order of orders) {
      const phone = order.user?.phone;
      if (!phone) continue;

      const itemName = order.product?.name ?? "your order";

      try {
        await this.whatsappService.sendWhatsAppMessage(
          phone,
          `⏰ *Delivery Reminder*\n\nYour order #${order.id.substring(0, 8)} for *${itemName}* was dispatched ${this.formatDuration(REMINDER_FIRST)} ago. If it has arrived, please confirm delivery with your OTP code to complete the transaction.\n\nIf there's an issue with delivery, open a dispute via the twizrr app before the payment is released.`,
        );
      } catch (err) {
        this.logger.warn(
          `Failed to send 24h reminder to order ${order.id}: ${err}`,
        );
      }
    }
  }

  /**
   * Send final warning to buyers past 2/3 of the auto-confirm window
   */
  private async send48hWarnings() {
    this.logger.log(`Checking for orders past ${REMINDER_FINAL}h mark...`);
    const cutoffDate = new Date(Date.now() - REMINDER_FINAL * 60 * 60 * 1000);
    const threeDaysCutoff = new Date(
      Date.now() - AUTO_CONFIRM_HOURS * 60 * 60 * 1000,
    );

    const orders = await this.prisma.order.findMany({
      where: {
        status: { in: [OrderStatus.DISPATCHED, OrderStatus.IN_TRANSIT] },
        updatedAt: { lte: cutoffDate, gt: threeDaysCutoff },
        disputeStatus: "NONE",
      },
      include: {
        user: true,
        product: true,
        supplierProduct: true,
      },
    });

    this.logger.log(`Sending 48h warnings to ${orders.length} buyers...`);

    for (const order of orders) {
      const phone = order.user?.phone;
      if (!phone) continue;

      const itemName =
        order.product?.name ?? order.supplierProduct?.name ?? "your order";

      try {
        const remainingHours = AUTO_CONFIRM_HOURS - REMINDER_FINAL;
        await this.whatsappService.sendWhatsAppMessage(
          phone,
          `⚠️ *Final Reminder — Action Required*\n\nYour order #${order.id.substring(0, 8)} for *${itemName}* has been dispatched for ${this.formatDuration(REMINDER_FINAL)}.\n\n*If you do not confirm or dispute within ${this.formatDuration(remainingHours)}, the order will be auto-confirmed and the merchant will be paid automatically.*\n\nPlease confirm delivery with your OTP or open a dispute on the twizrr app.`,
        );
      } catch (err) {
        this.logger.warn(
          `Failed to send 48h warning to order ${order.id}: ${err}`,
        );
      }
    }
  }

  /**
   * D: Auto-confirm orders that have been dispatched for 72+ hours with no confirmation or dispute
   */
  private async autoConfirmDeliveries() {
    const cutoffDate = new Date(
      Date.now() - AUTO_CONFIRM_HOURS * 60 * 60 * 1000,
    );

    const orders = await this.prisma.order.findMany({
      where: {
        status: { in: [OrderStatus.DISPATCHED, OrderStatus.IN_TRANSIT] },
        updatedAt: { lte: cutoffDate },
        disputeStatus: "NONE",
      },
      include: {
        user: true,
        product: true,
        supplierProduct: true,
        merchantProfile: {
          include: { user: true },
        },
      },
    });

    this.logger.log(`Auto-confirming ${orders.length} overdue orders...`);

    for (const order of orders) {
      try {
        const disputeWindowEndsAt = new Date(
          Date.now() + DISPUTE_WINDOW_HOURS * 60 * 60 * 1000,
        );

        // 1. Mark order as COMPLETED with dispute window
        await this.prisma.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.COMPLETED,
            disputeWindowEndsAt,
          },
        });

        // 2. Create tracking event
        await this.prisma.orderTracking.create({
          data: {
            orderId: order.id,
            status: OrderStatus.COMPLETED,
            note: `Auto-confirmed after ${this.formatDuration(AUTO_CONFIRM_HOURS)} without buyer confirmation. Dispute window ends at ${disputeWindowEndsAt.toISOString()}.`,
          },
        });

        // 3. Trigger merchant payout
        try {
          await this.payoutService.initiatePayout(order.id);
        } catch (payoutErr) {
          this.logger.error(
            `Payout failed for auto-confirmed order ${order.id}: ${payoutErr}`,
          );
          // Don't bail — order is still confirmed, payout can be retried manually
        }

        const itemName =
          order.product?.name ?? order.supplierProduct?.name ?? "your order";

        // 4. Notify buyer
        if (order.user?.phone) {
          try {
            await this.whatsappService.sendWhatsAppMessage(
              order.user.phone,
              `✅ *Order Auto-Confirmed*\n\nYour order #${order.id.substring(0, 8)} for *${itemName}* has been automatically confirmed after ${this.formatDuration(AUTO_CONFIRM_HOURS)}.\n\nIf you did not receive your goods, you can open a dispute within the next ${this.formatDuration(DISPUTE_WINDOW_HOURS)} via the twizrr app. After that, the payment will be released to the merchant.\n\nThank you for using twizrr! 🙏`,
            );

            // Trigger V5 Review Prompt
            await this.whatsappService.sendReviewPrompt(
              order.buyerId,
              order.id,
              order.merchantProfile?.businessName || "the merchant",
              itemName,
            );
          } catch (err) {
            this.logger.warn(`Buyer notification failed for order ${order.id}`);
          }
        }

        // 5. Notify merchant
        const merchantPhone = (order.merchantProfile as any)?.user?.phone;
        if (merchantPhone) {
          try {
            await this.whatsappService.sendWhatsAppMessage(
              merchantPhone,
              `💰 *Order #${order.id.substring(0, 8)} Auto-Confirmed!*\n\nYour order for *${itemName}* has been auto-confirmed by the system. Payout is now processing.\n\nNote: The buyer has a ${this.formatDuration(DISPUTE_WINDOW_HOURS)} window to raise a dispute if needed.`,
            );
          } catch (err) {
            this.logger.warn(
              `Merchant notification failed for order ${order.id}`,
            );
          }
        }

        this.logger.log(`Auto-confirmed order ${order.id} successfully`);
      } catch (err) {
        this.logger.error(`Failed to auto-confirm order ${order.id}: ${err}`);
      }
    }

    return { processed: orders.length };
  }
}
