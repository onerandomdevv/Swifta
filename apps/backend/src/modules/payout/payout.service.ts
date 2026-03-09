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
        quote: { include: { rfq: { include: { product: true } } } },
      },
    });
    if (!order) {
      this.logger.error(`Order not found for payout: ${orderId}`);
      return;
    }

    const merchant = order.merchantProfile;

    // Determine platform fee vs payout amount
    let subtotalKobo = 0;
    if (
      order.quoteId === null &&
      order.productId !== null &&
      order.quantity !== null
    ) {
      subtotalKobo = Number(order.unitPriceKobo) * order.quantity;
    } else {
      subtotalKobo =
        Number(order.totalAmountKobo) - Number(order.deliveryFeeKobo);
    }

    // Dynamic fee: 1% for DIRECT payments, 2% for ESCROW
    const platformFeePercentage = order.paymentMethod === "DIRECT" ? 1 : 2;
    const platformFeeKobo = Math.floor(
      subtotalKobo * (platformFeePercentage / 100),
    );
    const payoutAmountKobo =
      BigInt(subtotalKobo) -
      BigInt(platformFeeKobo) +
      BigInt(order.deliveryFeeKobo);

    if (!merchant.paystackRecipientCode) {
      this.logger.error(
        `Merchant ${merchant.id} has no registered bank account / recipient code.`,
      );
      await this.prisma.payout.create({
        data: {
          orderId,
          merchantId: merchant.id,
          amountKobo: payoutAmountKobo,
          platformFeeKobo: BigInt(platformFeeKobo),
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
        platformFeeKobo: BigInt(platformFeeKobo),
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
        `SwiftTrade payout for Order #${order.id.slice(0, 8).toUpperCase()}`,
      );

      await this.prisma.payout.update({
        where: { id: payout.id },
        data: { paystackTransferCode: transferResponse.transfer_code },
      });

      const productName =
        order.product?.name || order.quote?.rfq?.product?.name || "Items";
      const quantity = order.quantity || order.quote?.rfq?.quantity || 1;

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
