import { Injectable, Logger } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import {
  NOTIFICATION_QUEUE,
  WHATSAPP_QUEUE,
} from "../../queue/queue.constants";
import { NotificationType, NotificationChannel } from "@swifta/shared";

@Injectable()
export class NotificationTriggerService {
  private readonly logger = new Logger(NotificationTriggerService.name);

  constructor(
    @InjectQueue(NOTIFICATION_QUEUE) private queue: Queue,
    @InjectQueue(WHATSAPP_QUEUE) private whatsappQueue: Queue,
  ) {}

  public async addJob(
    userId: string,
    type: NotificationType,
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
      NotificationType.WELCOME,
      "Welcome to Swifta",
      "Welcome to Africa's digital trade network.",
    );
  }

  async triggerEmailVerification(userId: string, otp: string) {
    await this.addJob(
      userId,
      NotificationType.EMAIL_VERIFICATION,
      "Verify your account",
      `Your code is ${otp}`,
      { otp },
      [NotificationChannel.EMAIL],
      { removeOnFail: true },
    );
  }

  async triggerOrderPreparing(
    buyerId: string,
    metadata: { orderId: string; reference: string },
  ) {
    await this.addJob(
      buyerId,
      NotificationType.ORDER_PREPARING,
      "Order Preparing",
      "📦 Your order is being prepared! The merchant is packing your goods.",
      { ...metadata },
      [
        NotificationChannel.IN_APP,
        NotificationChannel.EMAIL,
        NotificationChannel.WHATSAPP,
      ],
    );
  }

  async triggerOrderDispatched(
    buyerId: string,
    metadata: { orderId: string; reference: string; otp: string },
  ) {
    await this.addJob(
      buyerId,
      NotificationType.ORDER_DISPATCHED,
      "Order Dispatched",
      `🚚 Your order has been dispatched! Your delivery code is: ${metadata.otp}`,
      { ...metadata },
      [
        NotificationChannel.IN_APP,
        NotificationChannel.EMAIL,
        NotificationChannel.WHATSAPP,
      ],
    );
  }

  async triggerOrderInTransit(
    buyerId: string,
    metadata: { orderId: string; reference: string; note?: string },
  ) {
    const noteText = metadata.note ? ` Merchant says: ${metadata.note}` : "";
    await this.addJob(
      buyerId,
      NotificationType.ORDER_IN_TRANSIT,
      "Order In Transit",
      `📍 Your order is on the way!${noteText}`,
      { ...metadata },
      [
        NotificationChannel.IN_APP,
        NotificationChannel.EMAIL,
        NotificationChannel.WHATSAPP,
      ],
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
      NotificationType.DELIVERY_CONFIRMED,
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
      NotificationType.DELIVERY_CONFIRMED,
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
      NotificationType.PAYOUT_INITIATED,
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
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      const errStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `WhatsApp notification failed for new-order: ${errMsg}`,
        errStack,
      );
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
      NotificationType.PAYOUT_COMPLETED,
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
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      const errStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `WhatsApp notification failed for payout-completed: ${errMsg}`,
        errStack,
      );
    }
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
      NotificationType.PAYOUT_FAILED,
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
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      const errStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `WhatsApp notification failed for payout-failed: ${errMsg}`,
        errStack,
      );
    }
  }

  async triggerOrderCancelled(
    buyerId: string,
    merchantId: string,
    orderId: string,
  ) {
    await this.addJob(
      buyerId,
      NotificationType.ORDER_CANCELLED,
      "Order Cancelled",
      "Order has been cancelled.",
      { orderId },
    );
    await this.addJob(
      merchantId,
      NotificationType.ORDER_CANCELLED,
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
      NotificationType.PASSWORD_RESET,
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
      NotificationType.PAYMENT_CONFIRMED,
      "Payment Successful",
      "Your payment was successful.",
      { ...metadata, amountKobo: metadata.amountKobo.toString() },
      [
        NotificationChannel.IN_APP,
        NotificationChannel.EMAIL,
        NotificationChannel.WHATSAPP,
      ],
    );
    // Notify merchant
    await this.addJob(
      merchantId,
      NotificationType.PAYMENT_CONFIRMED,
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
      NotificationType.DIRECT_PURCHASE_CONFIRMED,
      "Payment confirmed!",
      "Your order is being prepared. You will receive a delivery code when the merchant dispatches.",
      { ...metadata, amountKobo: metadata.amountKobo.toString() },
      [
        NotificationChannel.IN_APP,
        NotificationChannel.EMAIL,
        NotificationChannel.WHATSAPP,
      ],
    );

    // Notify merchant via Email / In-App
    await this.addJob(
      merchantId,
      NotificationType.DIRECT_PURCHASE_RECEIVED,
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
      NotificationType.REORDER_REMINDER,
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
      NotificationType.MERCHANT_REORDER_PROMPT,
      "Reorder Opportunity",
      `${metadata.buyerName} might need a restock of ${metadata.productName}.`,
      { ...metadata, isMerchantId: true },
    );
  }

  async triggerMerchantVerified(userId: string) {
    await this.addJob(
      userId,
      NotificationType.MERCHANT_VERIFIED,
      "Account Verified",
      "Your merchant account has been successfully verified. You can now list products and receive quotes.",
      {},
    );
  }

  async triggerMerchantRejected(userId: string, reason?: string) {
    await this.addJob(
      userId,
      NotificationType.MERCHANT_REJECTED,
      "Account Verification Rejected",
      `Your merchant account verification was unsuccessful. ${reason ? "Reason: " + reason : "Please review your details and re-submit."}`,
      { reason },
    );
  }

  async triggerNewMerchantSubmission(
    adminUserIds: string[],
    metadata: { merchantId: string; merchantName: string; targetTier?: string },
  ) {
    await Promise.allSettled(
      adminUserIds.map((adminId) =>
        this.addJob(
          adminId,
          NotificationType.NEW_MERCHANT_SUBMISSION,
          "New Merchant Verification Pending",
          `${metadata.merchantName} has submitted their account for verification${metadata.targetTier ? ` (${metadata.targetTier})` : ""}.`,
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
          NotificationType.PAYOUT_REQUESTED,
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
      NotificationType.PAYOUT_REQUEST_RECEIVED,
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
      NotificationType.ORDER_DISPUTED,
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
      NotificationType.DISPUTE_RESOLVED,
      "Dispute Resolved",
      `The dispute for Order #${orderId.slice(0, 8)} has been resolved.`,
      { orderId, resolution },
      [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      { url: `/buyer/orders/${orderId}` },
    );
  }

  async triggerAutoConfirmationWarning(
    buyerId: string,
    orderRef: string,
    hoursRemaining: number,
  ) {
    await this.addJob(
      buyerId,
      NotificationType.ORDER_AUTO_CONFIRM_WARNING,
      "Action Required: Order Confirmation",
      `Your order #${orderRef} will be automatically confirmed in ${hoursRemaining} hours. Please confirm delivery or raise a dispute if there are issues.`,
      { orderRef, hoursRemaining },
      [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    );
  }

  async triggerOrderAutoConfirmed(
    buyerId: string,
    merchantId: string,
    metadata: { orderId: string; reference: string; amountKobo: bigint },
  ) {
    const serializedMetadata = {
      ...metadata,
      amountKobo: metadata.amountKobo.toString(),
    };

    // Notify buyer
    await this.addJob(
      buyerId,
      NotificationType.ORDER_AUTO_CONFIRMED,
      "Order Auto-Confirmed",
      `Order #${metadata.reference.slice(0, 8)} has been automatically confirmed after 72 hours.`,
      serializedMetadata,
      [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      { url: `/buyer/orders/${metadata.orderId}` },
    );

    // Notify merchant
    await this.addJob(
      merchantId,
      NotificationType.ORDER_AUTO_CONFIRMED,
      "Order Auto-Confirmed",
      `Order #${metadata.reference.slice(0, 8)} has been automatically confirmed by the system. Payout will be processed shortly.`,
      { ...serializedMetadata, isMerchantId: true },
      [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      { url: `/merchant/orders/${metadata.orderId}` },
    );
  }
}
