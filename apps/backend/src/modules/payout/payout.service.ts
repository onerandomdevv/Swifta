import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { PaystackClient } from "../payment/paystack.client";
import { ConfigService } from "@nestjs/config";
import { NotificationTriggerService } from "../notification/notification-trigger.service";

@Injectable()
export class PayoutService {
  private readonly logger = new Logger(PayoutService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paystack: PaystackClient,
    private readonly config: ConfigService,
    private readonly notifications: NotificationTriggerService,
  ) {}

  async initiatePayout(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        merchantProfile: true,
        product: true,
      },
    });
    if (!order) {
      this.logger.error(`Order not found for payout: ${orderId}`);
      return;
    }

    const merchant = order.merchantProfile;

    // Determine gross amount and platform fee
    const grossAmountKobo = BigInt(order.totalAmountKobo);

    // Use saved platform fee directly from the order with legacy fallback
    let platformFeeKoboCount = 0n;
    if (order.platformFeeKobo === null || order.platformFeeKobo === undefined) {
      this.logger.warn(
        `Missing platformFeeKobo on order ${orderId}. Defaulting to 0 for legacy order payout.`,
      );
      platformFeeKoboCount = 0n;
    } else {
      platformFeeKoboCount = BigInt(order.platformFeeKobo);
    }

    const payoutAmountKobo = grossAmountKobo - platformFeeKoboCount;

    if (!merchant.paystackRecipientCode) {
      this.logger.error(
        `Merchant ${merchant.id} has no registered bank account / recipient code.`,
      );
      await this.prisma.payout.create({
        data: {
          orderId,
          merchantId: merchant.id,
          amountKobo: payoutAmountKobo,
          platformFeeKobo: platformFeeKoboCount,
          status: "FAILED",
          failureReason: "Merchant has no registered bank account",
        },
      });
      return;
    }

    const payout = await this.prisma.payout.create({
      data: {
        orderId,
        merchantId: merchant.id,
        amountKobo: payoutAmountKobo,
        platformFeeKobo: platformFeeKoboCount,
        status: "PROCESSING",
        initiatedAt: new Date(),
      },
    });

    try {
      this.logger.log(
        `Initiating Paystack transfer for order ${orderId} (Payout ID: ${payout.id})`,
      );
      const transferResponse = await this.paystack.createTransfer(
        merchant.paystackRecipientCode,
        payoutAmountKobo,
        `PO-${order.id.slice(0, 8).toUpperCase()}-${Date.now()}`,
        `Swifta payout for Order #${order.id.slice(0, 8).toUpperCase()}`,
      );

      await this.prisma.payout.update({
        where: { id: payout.id },
        data: { paystackTransferCode: transferResponse.transfer_code },
      });

      const productName = order.product?.name || "Items";
      const quantity = order.quantity || 1;

      await this.notifications.triggerPayoutInitiated(merchant.userId, {
        orderId: order.id,
        orderRef: order.id.slice(0, 8).toUpperCase(),
        productName,
        quantity,
        payoutAmountKobo: payoutAmountKobo.toString(),
        bankName: merchant.settlementAccountName || "your bank",
      });
    } catch (error: any) {
      this.logger.error(
        `Paystack Transfer Failed for Order ${orderId}: ${error.message}`,
      );
      await this.prisma.payout.update({
        where: { id: payout.id },
        data: {
          status: "FAILED",
          failureReason: error.message,
        },
      });
    }
  }
}
