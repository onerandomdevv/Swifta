import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { PaystackClient } from "../../integrations/paystack/paystack.client";
import { ConfigService } from "@nestjs/config";
import { NotificationTriggerService } from "../notification/notification-trigger.service";
import { LedgerService } from "../ledger/ledger.service";

@Injectable()
export class PayoutService {
  private readonly logger = new Logger(PayoutService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paystack: PaystackClient,
    private readonly config: ConfigService,
    private readonly notifications: NotificationTriggerService,
    private readonly ledgerService: LedgerService,
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

    // Check if a payout is already completed or processing for this order
    const existingPayout = await this.prisma.payout.findFirst({
      where: {
        orderId,
        status: { in: ["COMPLETED", "PROCESSING"] },
      },
    });

    if (existingPayout) {
      this.logger.warn(
        `Payout already exists for order ${orderId} with status ${existingPayout.status}. Skipping.`,
      );
      return;
    }

    const merchant = order.merchantProfile;
    if (!merchant) {
      this.logger.error(`Merchant profile missing for order ${orderId}`);
      return;
    }

    const payoutBreakdown = this.ledgerService.calculateOrderPayout(order);
    const platformFeeKobo = payoutBreakdown.platformFeeKobo;
    const payoutAmountKobo = payoutBreakdown.payoutAmountKobo;

    if (!merchant.paystackRecipientCode) {
      this.logger.error(
        `Merchant ${merchant.id} has no registered bank account / recipient code.`,
      );
      await this.prisma.$transaction(async (tx) => {
        const failedPayout = await tx.payout.create({
          data: {
            orderId,
            merchantId: merchant.id,
            amountKobo: payoutAmountKobo,
            platformFeeKobo,
            status: "FAILED",
            failureReason: "Merchant has no registered bank account",
          },
        });

        await this.ledgerService.recordPayoutFailed(
          {
            payoutId: failedPayout.id,
            orderId,
            merchantId: merchant.id,
            amountKobo: payoutAmountKobo,
            reason: "Merchant has no registered bank account",
          },
          tx,
        );
      });
      return;
    }

    const payout = await this.prisma.$transaction(async (tx) => {
      const createdPayout = await tx.payout.create({
        data: {
          orderId,
          merchantId: merchant.id,
          amountKobo: payoutAmountKobo,
          platformFeeKobo,
          status: "PROCESSING",
          initiatedAt: new Date(),
        },
      });

      await this.ledgerService.recordPayoutInitiated(
        {
          payoutId: createdPayout.id,
          orderId,
          merchantId: merchant.id,
          amountKobo: payoutAmountKobo,
          platformFeeKobo,
        },
        tx,
      );

      return createdPayout;
    });

    try {
      this.logger.log(
        `Initiating Paystack transfer for order ${orderId} (Payout ID: ${payout.id})`,
      );
      const transferResponse = await this.paystack.createTransfer(
        merchant.paystackRecipientCode,
        payoutAmountKobo,
        `PO-${order.id.slice(0, 8).toUpperCase()}`,
        `twizrr payout for Order #${order.id.slice(0, 8).toUpperCase()}`,
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
      await this.prisma.$transaction(async (tx) => {
        await tx.payout.update({
          where: { id: payout.id },
          data: {
            status: "FAILED",
            failureReason: error.message,
          },
        });

        await this.ledgerService.recordPayoutFailed(
          {
            payoutId: payout.id,
            orderId,
            merchantId: merchant.id,
            amountKobo: payoutAmountKobo,
            reason: error.message,
          },
          tx,
        );
      });
    }
  }
}
