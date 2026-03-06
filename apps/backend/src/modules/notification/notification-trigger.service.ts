import { Injectable } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import {
  NOTIFICATION_QUEUE,
  WHATSAPP_QUEUE,
} from "../../queue/queue.constants";
import { NotificationType, NotificationChannel } from "@hardware-os/shared";

@Injectable()
export class NotificationTriggerService {
  constructor(
    @InjectQueue(NOTIFICATION_QUEUE) private queue: Queue,
    @InjectQueue(WHATSAPP_QUEUE) private whatsappQueue: Queue,
  ) {}

  private async addJob(
    userId: string,
    type: string,
    title: string,
    body: string,
    metadata?: any,
    channels: NotificationChannel[] = [
      NotificationChannel.IN_APP,
      NotificationChannel.EMAIL,
    ],
    options?: { removeOnFail?: boolean; url?: string },
  ) {
    await this.queue.add(
      "send-notification",
      {
        userId,
        type,
        title,
        body,
        channels,
        metadata,
        url: options?.url,
      },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: true,
        removeOnFail: options?.removeOnFail ?? false,
      },
    );
  }

  async triggerWelcome(userId: string) {
    await this.addJob(
      userId,
      "WELCOME",
      "Welcome to SwiftTrade",
      "Welcome to Africa's hardware trade network.",
    );
  }

  async triggerEmailVerification(userId: string, otp: string) {
    await this.addJob(
      userId,
      "EMAIL_VERIFICATION",
      "Verify your account",
      `Your code is ${otp}`,
      { otp },
      [NotificationChannel.EMAIL],
      { removeOnFail: true },
    );
  }

  async triggerNewRFQ(
    merchantId: string,
    metadata: {
      rfqId: string;
      buyerName: string;
      productName: string;
      quantity: number;
      deliveryAddress?: string;
    },
  ) {
    // Standard in-app + email notification
    await this.addJob(
      merchantId,
      "NEW_RFQ",
      "New RFQ Received",
      "You have a new request for quote.",
      { ...metadata, isMerchantId: true },
    );

    // WhatsApp push notification (async — fire and forget)
    try {
      await this.whatsappQueue.add(
        "send-rfq-notification",
        {
          merchantId,
          rfqData: {
            rfqId: metadata.rfqId,
            buyerName: metadata.buyerName,
            productName: metadata.productName,
            quantity: metadata.quantity,
            deliveryAddress: metadata.deliveryAddress || "Not specified",
          },
        },
        {
          attempts: 2,
          backoff: { type: "exponential", delay: 3000 },
          removeOnComplete: true,
          removeOnFail: true,
        },
      );
    } catch {
      // Never let WhatsApp notification failure affect the main flow
    }
  }

  async triggerQuoteReceived(
    buyerId: string,
    metadata: {
      quoteId: string;
      merchantName: string;
      productName: string;
      totalPriceKobo: bigint;
    },
  ) {
    await this.addJob(
      buyerId,
      "QUOTE_RECEIVED",
      "Quote Received",
      "You have received a new quote.",
      { ...metadata, totalPriceKobo: metadata.totalPriceKobo.toString() }, // Pass as string for BullMQ JSON
      [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    );
  }

  async triggerQuoteAccepted(
    merchantId: string,
    metadata: {
      quoteId: string;
      orderId: string;
      buyerName: string;
      amountKobo: bigint;
    },
  ) {
    await this.addJob(
      merchantId,
      "QUOTE_ACCEPTED",
      "Quote Accepted",
      "Your quote has been accepted.",
      {
        ...metadata,
        amountKobo: metadata.amountKobo.toString(),
        isMerchantId: true,
      },
    );
  }

  async triggerQuoteDeclined(merchantId: string, quoteId: string) {
    await this.addJob(
      merchantId,
      "QUOTE_DECLINED",
      "Quote Declined",
      "Your quote has been declined.",
      { quoteId, isMerchantId: true },
    );
  }

  async triggerRFQExpired(buyerId: string, rfqId: string) {
    await this.addJob(
      buyerId,
      "RFQ_EXPIRED",
      "RFQ Expired",
      "Your request for quote has expired without receiving a response.",
      { rfqId },
    );
  }

  async triggerOrderDispatched(
    buyerId: string,
    metadata: { orderId: string; reference: string; otp: string },
  ) {
    await this.addJob(
      buyerId,
      "ORDER_DISPATCHED",
      "Order Dispatched",
      `Your order #${metadata.reference.slice(0, 8)} has been dispatched.`,
      { ...metadata },
      [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    );
  }

  async triggerDeliveryConfirmed(
    merchantId: string,
    buyerId: string,
    metadata: { orderId: string; reference: string; amountKobo: bigint },
  ) {
    // Notify merchant
    await this.addJob(
      merchantId,
      "DELIVERY_CONFIRMED",
      "Delivery Confirmed",
      `Order #${metadata.reference.slice(0, 8)} delivery has been confirmed.`,
      {
        ...metadata,
        amountKobo: metadata.amountKobo.toString(),
        isMerchantId: true,
      },
      [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    );
    // Notify buyer
    await this.addJob(
      buyerId,
      "DELIVERY_CONFIRMED",
      "Delivery Confirmed",
      `Order #${metadata.reference.slice(0, 8)} delivery has been confirmed.`,
      { ...metadata, amountKobo: metadata.amountKobo.toString() },
      [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    );
  }

  async triggerPayoutInitiated(
    merchantId: string,
    metadata: {
      orderId: string;
      orderRef: string;
      productName: string;
      quantity: number;
      payoutAmountKobo: string;
      bankName: string;
    },
  ) {
    await this.addJob(
      merchantId,
      "PAYOUT_INITIATED",
      "Payout Initiated",
      "Payout for your order has been initiated.",
      { ...metadata, isMerchantId: true },
    );

    // WhatsApp push to merchant
    try {
      await this.whatsappQueue.add(
        "send-delivery-confirmed-notification",
        {
          merchantId,
          payoutData: metadata,
        },
        {
          attempts: 2,
          backoff: { type: "exponential", delay: 3000 },
          removeOnComplete: true,
          removeOnFail: true,
        },
      );
    } catch {
      // Ignore Whatsapp failures to omit transaction rollbacks
    }
  }

  async triggerPayoutCompleted(
    merchantId: string,
    metadata: {
      amountKobo: string;
      orderRef: string;
      bankName: string;
    },
  ) {
    await this.addJob(
      merchantId,
      "PAYOUT_COMPLETED",
      "Payout Received",
      `Payout of ₦${Number(metadata.amountKobo) / 100} has been sent to your ${metadata.bankName} account for Order #${metadata.orderRef}.`,
      { ...metadata, isMerchantId: true },
    );

    try {
      await this.whatsappQueue.add(
        "send-payout-completed-notification",
        { merchantId, payoutData: metadata },
        { attempts: 2, removeOnComplete: true, removeOnFail: true },
      );
    } catch {}
  }

  async triggerPayoutFailed(
    merchantId: string,
    metadata: {
      orderRef: string;
      amountKobo?: string;
    },
  ) {
    await this.addJob(
      merchantId,
      "PAYOUT_FAILED",
      "Payout Delayed",
      `Your payout for Order #${metadata.orderRef} is being reviewed.`,
      { ...metadata, isMerchantId: true },
    );

    try {
      await this.whatsappQueue.add(
        "send-payout-failed-notification",
        { merchantId, payoutData: metadata },
        { attempts: 2, removeOnComplete: true, removeOnFail: true },
      );
    } catch {}
  }

  async triggerOrderCancelled(
    buyerId: string,
    merchantId: string,
    orderId: string,
  ) {
    await this.addJob(
      buyerId,
      "ORDER_CANCELLED",
      "Order Cancelled",
      "Order has been cancelled.",
      { orderId },
    );
    await this.addJob(
      merchantId,
      "ORDER_CANCELLED",
      "Order Cancelled",
      "Order has been cancelled.",
      { orderId, isMerchantId: true },
    );
  }

  async triggerPasswordReset(
    userId: string,
    email: string,
    resetToken: string,
    frontendUrl: string,
  ) {
    await this.addJob(
      userId,
      "PASSWORD_RESET",
      "Reset your password",
      "Forgot your password?",
      { email, resetToken, frontendUrl },
      [NotificationChannel.EMAIL],
      { removeOnFail: true },
    );
  }

  async triggerPaymentConfirmed(
    buyerId: string,
    merchantId: string,
    metadata: { orderId: string; reference: string; amountKobo: bigint },
  ) {
    // Notify buyer
    await this.addJob(
      buyerId,
      "PAYMENT_CONFIRMED",
      "Payment Successful",
      "Your payment was successful.",
      { ...metadata, amountKobo: metadata.amountKobo.toString() },
    );
    // Notify merchant
    await this.addJob(
      merchantId,
      "PAYMENT_CONFIRMED",
      "Payment Received",
      "Payment received for an order.",
      {
        ...metadata,
        amountKobo: metadata.amountKobo.toString(),
        isMerchantId: true,
      },
    );
  }

  async triggerDirectPurchaseConfirmed(
    buyerId: string,
    merchantId: string,
    metadata: {
      orderId: string;
      reference: string;
      productName: string;
      buyerName: string;
      quantity: number;
      amountKobo: bigint;
      deliveryAddress?: string;
    },
  ) {
    // Notify buyer via Email / In-App
    await this.addJob(
      buyerId,
      "DIRECT_PURCHASE_CONFIRMED",
      "Payment confirmed!",
      "Your order is being prepared. You will receive a delivery code when the merchant dispatches.",
      { ...metadata, amountKobo: metadata.amountKobo.toString() },
      [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    );

    // Notify merchant via Email / In-App
    await this.addJob(
      merchantId,
      "DIRECT_PURCHASE_RECEIVED",
      "New order received!",
      `${metadata.productName} × ${metadata.quantity} — ₦${Number(metadata.amountKobo) / 100}. Check your dashboard to dispatch.`,
      {
        ...metadata,
        amountKobo: metadata.amountKobo.toString(),
        isMerchantId: true,
      },
      [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    );

    // WhatsApp push to merchant
    try {
      await this.whatsappQueue.add(
        "send-direct-order-notification",
        {
          merchantId,
          orderData: {
            orderId: metadata.orderId,
            buyerName: metadata.buyerName,
            productName: metadata.productName,
            quantity: metadata.quantity,
            amountKobo: metadata.amountKobo.toString(),
            deliveryAddress: metadata.deliveryAddress || "Not specified",
          },
        },
        {
          attempts: 2,
          backoff: { type: "exponential", delay: 3000 },
          removeOnComplete: true,
          removeOnFail: true,
        },
      );
    } catch {
      // Ignore Whatsapp failures to omit transaction rollbacks
    }
  }

  async triggerReorderReminder(
    buyerId: string,
    metadata: {
      reminderId: string;
      productName: string;
      merchantName: string;
      originalQuantity: number;
      daysSinceOrder: number;
    },
  ) {
    await this.addJob(
      buyerId,
      "REORDER_REMINDER",
      "Time to Reorder",
      `It's been ${metadata.daysSinceOrder} days since you ordered ${metadata.productName}. Need a restock?`,
      { ...metadata },
      [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    );
  }

  async triggerMerchantReorderPrompt(
    merchantId: string,
    metadata: {
      reminderId: string;
      buyerName: string;
      productName: string;
      originalQuantity: number;
      daysSinceOrder: number;
    },
  ) {
    await this.addJob(
      merchantId,
      "MERCHANT_REORDER_PROMPT",
      "Reorder Opportunity",
      `${metadata.buyerName} might need a restock of ${metadata.productName}. Send a quote?`,
      { ...metadata, isMerchantId: true },
    );
  }

  async triggerMerchantVerified(userId: string) {
    await this.addJob(
      userId,
      "MERCHANT_VERIFIED",
      "Account Verified",
      "Your merchant account has been successfully verified. You can now list products and receive quotes.",
      {},
    );
  }

  async triggerMerchantRejected(userId: string, reason?: string) {
    await this.addJob(
      userId,
      "MERCHANT_REJECTED",
      "Account Verification Rejected",
      `Your merchant account verification was unsuccessful. ${reason ? "Reason: " + reason : "Please review your details and re-submit."}`,
      { reason },
    );
  }

  async triggerNewMerchantSubmission(
    adminUserIds: string[],
    metadata: { merchantId: string; merchantName: string },
  ) {
    await Promise.allSettled(
      adminUserIds.map((adminId) =>
        this.addJob(
          adminId,
          "NEW_MERCHANT_SUBMISSION",
          "New Merchant Verification Pending",
          `${metadata.merchantName} has submitted their account for verification.`,
          { ...metadata },
        ),
      ),
    );
  }

  async triggerPayoutRequested(
    adminUserIds: string[],
    metadata: {
      merchantId: string;
      merchantName: string;
      amountKobo: string;
      requestId: string;
    },
  ) {
    await Promise.allSettled(
      adminUserIds.map((adminId) =>
        this.addJob(
          adminId,
          "PAYOUT_REQUESTED",
          "New Payout Request",
          `${metadata.merchantName} has requested a payout.`,
          { ...metadata },
        ),
      ),
    );
  }

  async triggerMerchantPayoutRequestedConfirmation(
    userId: string,
    metadata: { amountKobo: string; requestId: string },
  ) {
    await this.addJob(
      userId,
      "PAYOUT_REQUEST_RECEIVED",
      "Payout Request Received",
      `Your payout request has been received and is being processed.`,
      { ...metadata },
    );
  }

  async triggerOrderDisputed(
    merchantId: string,
    orderId: string,
    reason: string,
  ) {
    // Notify Merchant
    await this.addJob(
      merchantId,
      "ORDER_DISPUTED",
      "Order Dispute Raised",
      `A buyer has raised a dispute for Order #${orderId.slice(0, 8)}. Reason: ${reason}`,
      { orderId, reason, isMerchantId: true },
      [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      { url: `/merchant/orders/${orderId}` },
    );

    // Notify Admins (Static broadcast for now, in a real app we'd fetch admin IDs)
    // For now, the OrderService will handle the call if it has admin IDs,
    // but here we just provide the capability.
  }

  async triggerOrderDisputeResolved(
    userId: string,
    orderId: string,
    resolution: string,
  ) {
    await this.addJob(
      userId,
      "DISPUTE_RESOLVED",
      "Dispute Resolved",
      `The dispute for Order #${orderId.slice(0, 8)} has been resolved.`,
      { orderId, resolution },
      [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      { url: `/buyer/orders/${orderId}` },
    );
  }
}
