import { Injectable } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { NOTIFICATION_QUEUE } from "../../queue/queue.constants";
import { NotificationType, NotificationChannel } from "@hardware-os/shared";

@Injectable()
export class NotificationTriggerService {
  constructor(@InjectQueue(NOTIFICATION_QUEUE) private queue: Queue) {}

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
    options?: { removeOnFail?: boolean },
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
    },
  ) {
    await this.addJob(
      merchantId,
      "NEW_RFQ",
      "New RFQ Received",
      "You have a new request for quote.",
      { ...metadata, isMerchantId: true },
    );
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

  async triggerPayoutInitiated(merchantId: string, orderId: string) {
    await this.addJob(
      merchantId,
      "PAYOUT_INITIATED",
      "Payout Initiated",
      "Payout for your order has been initiated.",
      { orderId, isMerchantId: true },
    );
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
}
