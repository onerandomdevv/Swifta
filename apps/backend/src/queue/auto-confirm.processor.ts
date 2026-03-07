import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { AUTO_CONFIRM_QUEUE } from "./queue.constants";
import { PrismaService } from "../prisma/prisma.service";
import { PayoutService } from "../modules/payout/payout.service";
import { WhatsAppService } from "../modules/whatsapp/whatsapp.service";
import { OrderStatus } from "@hardware-os/shared";

const AUTO_CONFIRM_HOURS = 72;
const REMINDER_24H = 24;
const REMINDER_48H = 48;
const DISPUTE_WINDOW_HOURS = 48;

@Injectable()
@Processor(AUTO_CONFIRM_QUEUE)
export class AutoConfirmProcessor extends WorkerHost {
  private readonly logger = new Logger(AutoConfirmProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly payoutService: PayoutService,
    private readonly whatsappService: WhatsAppService,
  ) {
    super();
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
   * D: Send 24h reminder to buyers who haven't confirmed delivery
   */
  private async send24hReminders() {
    const cutoffDate = new Date(Date.now() - REMINDER_24H * 60 * 60 * 1000);
    const twoDaysCutoff = new Date(Date.now() - REMINDER_48H * 60 * 60 * 1000);

    const orders = await this.prisma.order.findMany({
      where: {
        status: { in: [OrderStatus.DISPATCHED, OrderStatus.IN_TRANSIT] },
        updatedAt: { lte: cutoffDate, gt: twoDaysCutoff },
        disputeStatus: "NONE",
      },
      include: {
        user: true,
        product: true,
        supplierProduct: true,
      },
    });

    this.logger.log(`Sending 24h reminders to ${orders.length} buyers...`);

    for (const order of orders) {
      const phone = order.user?.phone;
      if (!phone) continue;

      const itemName =
        order.product?.name ?? order.supplierProduct?.name ?? "your order";

      try {
        await this.whatsappService.sendWhatsAppMessage(
          phone,
          `⏰ *Delivery Reminder*\n\nYour order #${order.id.substring(0, 8)} for *${itemName}* was dispatched 24 hours ago. If it has arrived, please confirm delivery with your OTP code to complete the transaction.\n\nIf there's an issue with delivery, open a dispute via the SwiftTrade app before the payment is released.`,
        );
      } catch (err) {
        this.logger.warn(
          `Failed to send 24h reminder to order ${order.id}: ${err}`,
        );
      }
    }
  }

  /**
   * D: Send 48h final warning to buyers who haven't confirmed delivery
   */
  private async send48hWarnings() {
    const cutoffDate = new Date(Date.now() - REMINDER_48H * 60 * 60 * 1000);
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
        await this.whatsappService.sendWhatsAppMessage(
          phone,
          `⚠️ *Final Reminder — Action Required*\n\nYour order #${order.id.substring(0, 8)} for *${itemName}* has been dispatched for 48 hours.\n\n*If you do not confirm or dispute within 24 hours, the order will be auto-confirmed and the merchant will be paid automatically.*\n\nPlease confirm delivery with your OTP or open a dispute on the SwiftTrade app.`,
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
        await (this.prisma.order as any).update({
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
            note: `Auto-confirmed after ${AUTO_CONFIRM_HOURS} hours without buyer confirmation. Dispute window ends at ${disputeWindowEndsAt.toISOString()}.`,
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
              `✅ *Order Auto-Confirmed*\n\nYour order #${order.id.substring(0, 8)} for *${itemName}* has been automatically confirmed after ${AUTO_CONFIRM_HOURS} hours.\n\nIf you did not receive your goods, you can open a dispute within the next ${DISPUTE_WINDOW_HOURS} hours via the SwiftTrade app. After that, the payment will be released to the merchant.\n\nThank you for using SwiftTrade! 🙏`,
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
              `💰 *Order #${order.id.substring(0, 8)} Auto-Confirmed!*\n\nYour order for *${itemName}* has been auto-confirmed by the system. Payout is now processing.\n\nNote: The buyer has a ${DISPUTE_WINDOW_HOURS}-hour window to raise a dispute if needed.`,
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
