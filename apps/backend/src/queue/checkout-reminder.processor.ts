import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { CHECKOUT_REMINDER_QUEUE } from "./queue.constants";
import { PrismaService } from "../prisma/prisma.service";
import { WhatsAppService } from "../channels/whatsapp/whatsapp.service";
import { OrderStatus } from "@twizrr/shared";

@Injectable()
@Processor(CHECKOUT_REMINDER_QUEUE, {
  drainDelay: 60000,
  stalledInterval: 300000,
  lockDuration: 60000,
})
export class CheckoutReminderProcessor extends WorkerHost {
  private readonly logger = new Logger(CheckoutReminderProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsappService: WhatsAppService,
  ) {
    super();
  }

  async process(job: Job<{ orderId: string }, any, string>): Promise<any> {
    const { orderId } = job.data;
    this.logger.log(`Processing checkout reminder for order: ${orderId}`);

    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: { include: { buyerProfile: true } },
          product: true,
          supplierProduct: true,
        },
      });

      if (!order) return;
      if (order.status !== OrderStatus.PENDING_PAYMENT) {
        this.logger.log(
          `Order ${orderId} is no longer pending payment. Skipping reminder.`,
        );
        return;
      }

      const phone = order.user?.phone;
      if (!phone) return;

      const itemName =
        order.product?.name ?? order.supplierProduct?.name ?? "your items";

      let msg = `🛒 *Checkout Reminder from twizrr*\n\nHi ${order.user.firstName || "there"}! Your order #${order.id.substring(0, 8).toUpperCase()} for *${itemName}* is waiting for payment.\n\n`;

      const buyerProfile = order.user?.buyerProfile;
      if (buyerProfile?.dvaActive && buyerProfile?.dvaAccountNumber) {
        const amountNaira = (
          Number(order.totalAmountKobo) / 100
        ).toLocaleString("en-NG", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        });
        msg += `Please transfer ₦${amountNaira} to your Dedicated Virtual Account:\n\n*Bank*: ${buyerProfile.dvaBankName}\n*Account*: ${buyerProfile.dvaAccountNumber}\n*Name*: ${buyerProfile.dvaAccountName}\n\n`;
        msg += `Your order will be processed automatically once payment is received. ⚡`;
      } else {
        const metadata = order.metadata as Record<string, any>;
        if (metadata?.checkoutUrl) {
          msg += `Please complete your payment using this secure link: ${metadata.checkoutUrl}\n\n`;
          msg += `This link will finalize your order immediately. ⚡`;
        } else {
          msg += `Please return to the twizrr shop to complete your payment or request a new checkout link from the menu. ⚡`;
        }
      }

      await this.whatsappService.sendWhatsAppMessage(phone, msg);
      this.logger.log(
        `Sent checkout reminder to ${phone} for order ${orderId}`,
      );
    } catch (e) {
      this.logger.error(`Failed to process checkout reminder: ${e}`);
    }
  }
}
