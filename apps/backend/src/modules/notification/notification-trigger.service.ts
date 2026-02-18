import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { NOTIFICATION_QUEUE } from '../../queue/queue.constants';
import { NotificationType, NotificationChannel } from '@hardware-os/shared';

@Injectable()
export class NotificationTriggerService {
  constructor(@InjectQueue(NOTIFICATION_QUEUE) private queue: Queue) {}

  private async addJob(userId: string, type: string, title: string, body: string, metadata?: any) {
    await this.queue.add('send-notification', {
        userId,
        type,
        title,
        body,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        metadata
    });
  }

  async triggerNewRFQ(merchantId: string, rfqId: string) {
      // Need to get userId from merchantId usually, but let's assume processor handles lookup or we pass merchantId
      // For simplicity, we are passing IDs and the processor will resolve user email etc.
      await this.addJob(merchantId, 'NEW_RFQ', 'New RFQ Received', 'You have a new request for quote.', { rfqId, isMerchantId: true });
  }

  async triggerQuoteReceived(buyerId: string, quoteId: string) {
      await this.addJob(buyerId, 'QUOTE_RECEIVED', 'Quote Received', 'You have received a new quote.', { quoteId });
  }

  async triggerQuoteAccepted(merchantId: string, quoteId: string) {
      await this.addJob(merchantId, 'QUOTE_ACCEPTED', 'Quote Accepted', 'Your quote has been accepted.', { quoteId, isMerchantId: true });
  }

   async triggerQuoteDeclined(merchantId: string, quoteId: string) {
      await this.addJob(merchantId, 'QUOTE_DECLINED', 'Quote Declined', 'Your quote has been declined.', { quoteId, isMerchantId: true });
  }

  async triggerOrderDispatched(buyerId: string, orderId: string) {
      await this.addJob(buyerId, 'ORDER_DISPATCHED', 'Order Dispatched', 'Your order has been dispatched.', { orderId });
  }

  async triggerDeliveryConfirmed(merchantId: string, orderId: string) {
      await this.addJob(merchantId, 'DELIVERY_CONFIRMED', 'Delivery Confirmed', 'Order delivery has been confirmed.', { orderId, isMerchantId: true });
  }

  async triggerPayoutInitiated(merchantId: string, orderId: string) {
      await this.addJob(merchantId, 'PAYOUT_INITIATED', 'Payout Initiated', 'Payout for your order has been initiated.', { orderId, isMerchantId: true });
  }

   async triggerOrderCancelled(buyerId: string, merchantId: string, orderId: string) {
       // Notify both?
      await this.addJob(buyerId, 'ORDER_CANCELLED', 'Order Cancelled', 'Order has been cancelled.', { orderId });
      await this.addJob(merchantId, 'ORDER_CANCELLED', 'Order Cancelled', 'Order has been cancelled.', { orderId, isMerchantId: true });
  }

  async triggerPaymentConfirmed(buyerId: string, merchantId: string, orderId: string) {
      await this.addJob(buyerId, 'PAYMENT_CONFIRMED', 'Payment Successful', 'Your payment was successful.', { orderId });
      await this.addJob(merchantId, 'PAYMENT_CONFIRMED', 'Payment Received', 'Payment received for an order.', { orderId, isMerchantId: true });
  }
}
