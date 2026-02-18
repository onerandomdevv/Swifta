import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaystackClient } from './paystack.client';
import { NotificationTriggerService } from '../notification/notification-trigger.service';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import { PaymentStatus, PaymentDirection, OrderStatus } from '@hardware-os/shared';
import * as crypto from 'crypto';

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private paystack: PaystackClient,
    private notifications: NotificationTriggerService
  ) {}

  async initialize(buyerId: string, dto: InitializePaymentDto, idempotencyKey: string) {
    const order = await this.prisma.order.findUnique({ where: { id: dto.orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== OrderStatus.PENDING_PAYMENT) throw new BadRequestException('Order not in pending payment state');

    const paymentReference = `tx-${crypto.randomUUID()}`;
    const buyer = await this.prisma.user.findUnique({ where: { id: buyerId } });

    // Initialize Paystack
    const paystackResponse = await this.paystack.initializeTransaction(
        buyer.email,
        order.totalAmountKobo + order.deliveryFeeKobo,
        paymentReference,
        'http://localhost:3000/buyer/orders/payment/callback' // Verify URL
    );

    // Record Payment
    const payment = await this.prisma.payment.create({
        data: {
            orderId: order.id,
            paystackReference: paymentReference,
            amountKobo: order.totalAmountKobo + order.deliveryFeeKobo,
            currency: 'NGN',
            status: PaymentStatus.INITIALIZED,
            direction: PaymentDirection.INFLOW,
            idempotencyKey: idempotencyKey || paymentReference // Fallback if no idempotency key provided
        }
    });

    return { ...paystackResponse, paymentReference };
  }

  async handleWebhook(payload: any) {
      if (payload.event === 'charge.success') {
          const reference = payload.data.reference;
           await this.verifyTransaction(reference);
      }
      return { status: 'received' };
  }

  async verifyTransaction(reference: string) {
      const payment = await this.prisma.payment.findUnique({ where: { paystackReference: reference } });
      if (!payment) return; // Or log error
      
      const verification = await this.paystack.verifyTransaction(reference);

      if (verification && verification.status === 'success') {
          // Update payment
          await this.prisma.payment.update({
              where: { id: payment.id },
              data: { status: PaymentStatus.SUCCESS, verifiedAt: new Date() }
          });

          // Update order
          await this.prisma.order.update({
              where: { id: payment.orderId },
              data: { status: OrderStatus.PAID }
          });
          
          // Notifications
           const order = await this.prisma.order.findUnique({ where: { id: payment.orderId } });
           await this.notifications.triggerPaymentConfirmed(order.buyerId, order.merchantId, order.id);
      } else {
           await this.prisma.payment.update({
              where: { id: payment.id },
              data: { status: PaymentStatus.FAILED }
          });
      }
  }

  async initiatePayout(orderId: string) {
      // Stub context
      // Payout logic to be implemented
  }
}
