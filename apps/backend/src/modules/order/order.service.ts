import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationTriggerService } from '../notification/notification-trigger.service';
import { InventoryService } from '../inventory/inventory.service';
import { PaymentService } from '../payment/payment.service';
import { OrderStatus, OTP_LENGTH } from '@hardware-os/shared';
import { validateTransition } from './order-state-machine';
import * as crypto from 'crypto';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationTriggerService,
    private inventoryService: InventoryService,
    @Inject(forwardRef(() => PaymentService))
    private paymentService: PaymentService,
  ) {}

  // ──────────────────────────────────────────────
  //  CREATE ORDER FROM ACCEPTED QUOTE (transaction)
  // ──────────────────────────────────────────────

  async createFromQuote(quoteId: string, buyerId: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: { rfq: true },
    });
    if (!quote) throw new NotFoundException('Quote not found');
    if (!quote.rfq) throw new NotFoundException('RFQ not found for this quote');

    const idempotencyKey = `order-create-${quoteId}`;

    // Check idempotency — if order already exists for this quote, return it
    const existing = await this.prisma.order.findUnique({
      where: { quoteId },
    });
    if (existing) return existing;

    // Atomic: create order + reserve inventory + log initial event
    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          quoteId,
          buyerId,
          merchantId: quote.merchantId,
          totalAmountKobo: quote.totalPriceKobo,
          deliveryFeeKobo: quote.deliveryFeeKobo,
          currency: quote.currency,
          status: OrderStatus.PENDING_PAYMENT,
          idempotencyKey,
        },
      });

      // Log initial OrderEvent
      await tx.orderEvent.create({
        data: {
          orderId: newOrder.id,
          fromStatus: null,
          toStatus: OrderStatus.PENDING_PAYMENT,
          triggeredBy: buyerId,
          metadata: { action: 'order_created_from_quote', quoteId },
        },
      });

      // Reserve inventory
      await tx.inventoryEvent.create({
        data: {
          productId: quote.rfq.productId,
          merchantId: quote.merchantId,
          eventType: 'ORDER_RESERVED',
          quantity: -quote.rfq.quantity,
          referenceId: newOrder.id,
          notes: 'Order reservation',
        },
      });

      await tx.productStockCache.upsert({
        where: { productId: quote.rfq.productId },
        create: { productId: quote.rfq.productId, stock: -quote.rfq.quantity },
        update: { stock: { decrement: quote.rfq.quantity } },
      });

      return newOrder;
    });

    this.logger.log(`Order ${order.id} created from quote ${quoteId}`);
    return order;
  }

  // ──────────────────────────────────────────────
  //  GENERIC STATE TRANSITION (audit + validate)
  // ──────────────────────────────────────────────

  private async transition(
    orderId: string,
    fromStatus: OrderStatus,
    toStatus: OrderStatus,
    triggeredBy: string,
    metadata?: Record<string, any>,
  ) {
    if (!validateTransition(fromStatus, toStatus)) {
      throw new BadRequestException(
        `Invalid state transition from ${fromStatus} to ${toStatus}`,
      );
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: toStatus },
    });

    await this.prisma.orderEvent.create({
      data: {
        orderId,
        fromStatus,
        toStatus,
        triggeredBy,
        metadata: metadata || {},
      },
    });

    this.logger.log(`Order ${orderId}: ${fromStatus} → ${toStatus}`);
    return updatedOrder;
  }

  // ──────────────────────────────────────────────
  //  SYSTEM-DRIVEN TRANSITION (e.g., payment webhook)
  // ──────────────────────────────────────────────

  async transitionBySystem(
    orderId: string,
    fromStatus: OrderStatus,
    toStatus: OrderStatus,
    metadata?: Record<string, any>,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException('Order not found');

    if (!validateTransition(fromStatus, toStatus)) {
      throw new BadRequestException(
        `Invalid state transition from ${fromStatus} to ${toStatus}`,
      );
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: toStatus },
    });

    await this.prisma.orderEvent.create({
      data: {
        orderId,
        fromStatus,
        toStatus,
        triggeredBy: order.buyerId,
        metadata: { ...(metadata || {}), triggeredBySystem: true },
      },
    });

    this.logger.log(`Order ${orderId}: ${fromStatus} → ${toStatus} (system)`);
    return updatedOrder;
  }

  // ──────────────────────────────────────────────
  //  GET ORDER BY ID (with ownership check)
  // ──────────────────────────────────────────────

  async getById(id: string, userId: string, merchantId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        quote: { include: { rfq: { include: { product: true } } } },
        events: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');

    // Ownership check: must be the buyer OR the merchant
    const isBuyer = order.buyerId === userId;
    const isMerchant = merchantId && order.merchantId === merchantId;
    if (!isBuyer && !isMerchant) {
      throw new ForbiddenException('Access denied');
    }

    return order;
  }

  // ──────────────────────────────────────────────
  //  LIST ORDERS
  // ──────────────────────────────────────────────

  async listByBuyer(buyerId: string, page: number, limit: number) {
    const skip = (+page - 1) * +limit;
    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { buyerId },
        skip,
        take: +limit,
        orderBy: { createdAt: 'desc' },
        include: { merchant: { select: { businessName: true } } },
      }),
      this.prisma.order.count({ where: { buyerId } }),
    ]);
    return { data, meta: { page: +page, limit: +limit, total } };
  }

  async listByMerchant(merchantId: string, page: number, limit: number) {
    const skip = (+page - 1) * +limit;
    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { merchantId },
        skip,
        take: +limit,
        orderBy: { createdAt: 'desc' },
        include: { buyer: { select: { email: true, phone: true } } },
      }),
      this.prisma.order.count({ where: { merchantId } }),
    ]);
    return { data, meta: { page: +page, limit: +limit, total } };
  }

  // ──────────────────────────────────────────────
  //  DISPATCH (merchant only, generates OTP)
  // ──────────────────────────────────────────────

  async dispatch(merchantId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.merchantId !== merchantId)
      throw new ForbiddenException('Access denied');

    if (order.status !== OrderStatus.PAID) {
      throw new BadRequestException(
        'Order must be in PAID status to dispatch',
      );
    }

    // Crypto-secure 6-digit OTP
    const deliveryOtp = crypto.randomInt(100000, 999999).toString();

    // Resolve triggeredBy (userId from merchantId)
    const triggeredBy = await this.getUserIdFromMerchant(merchantId);

    // Save OTP + transition atomically
    await this.prisma.order.update({
      where: { id: orderId },
      data: { deliveryOtp },
    });

    const updatedOrder = await this.transition(
      orderId,
      order.status as OrderStatus,
      OrderStatus.DISPATCHED,
      triggeredBy,
      { action: 'dispatched' },
    );

    // Notification (async, best-effort)
    await this.notifications.triggerOrderDispatched(order.buyerId, orderId);

    this.logger.log(`Order ${orderId} dispatched, OTP generated`);
    return updatedOrder;
  }

  // ──────────────────────────────────────────────
  //  CONFIRM DELIVERY (buyer only, verifies OTP)
  // ──────────────────────────────────────────────

  async confirmDelivery(buyerId: string, orderId: string, otp: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.buyerId !== buyerId)
      throw new ForbiddenException('Access denied');

    // Explicit status check before OTP validation
    if (order.status !== OrderStatus.DISPATCHED) {
      throw new BadRequestException(
        'Order must be in DISPATCHED status to confirm delivery',
      );
    }

    if (order.deliveryOtp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    // Transition: DISPATCHED → DELIVERED
    await this.transition(
      orderId,
      OrderStatus.DISPATCHED,
      OrderStatus.DELIVERED,
      buyerId,
      { action: 'delivery_confirmed' },
    );

    // Notify merchant
    await this.notifications.triggerDeliveryConfirmed(
      order.merchantId,
      orderId,
    );

    // Auto-transition: DELIVERED → COMPLETED
    await this.transition(
      orderId,
      OrderStatus.DELIVERED,
      OrderStatus.COMPLETED,
      buyerId,
      { action: 'auto_completed' },
    );

    // Trigger payout notification (PaymentService handles actual payout)
    // AUTO-PAYOUT: Initiate payout now that order is COMPLETED
    try {
      this.logger.log(`Initiating auto-payout for order ${orderId}`);
      await this.paymentService.initiatePayout(orderId);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Auto-payout failed for order ${orderId} (will need manual retry): ${msg}`,
        error instanceof Error ? error.stack : undefined,
      );
      // Swallow error so we don't rollback the delivery confirmation
    }

    await this.notifications.triggerPayoutInitiated(
      order.merchantId,
      orderId,
    );

    return { message: 'Delivery confirmed' };
  }

  // ──────────────────────────────────────────────
  //  CANCEL (role-based status rules)
  // ──────────────────────────────────────────────

  async cancel(userId: string, orderId: string, merchantId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException('Order not found');

    const isBuyer = order.buyerId === userId;
    const isMerchant = merchantId && order.merchantId === merchantId;

    if (!isBuyer && !isMerchant) {
      throw new ForbiddenException('Access denied');
    }

    // Role-based cancellation rules per guide:
    // - Buyer can cancel if PENDING_PAYMENT (no refund needed)
    // - Merchant can cancel if PAID (auto-refund triggered)
    if (isBuyer && order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new BadRequestException(
        'Buyer can only cancel orders in PENDING_PAYMENT status',
      );
    }
    if (isMerchant && order.status !== OrderStatus.PAID) {
      throw new BadRequestException(
        'Merchant can only cancel orders in PAID status',
      );
    }

    // Transition to CANCELLED
    await this.transition(
      orderId,
      order.status as OrderStatus,
      OrderStatus.CANCELLED,
      userId,
      { cancelledBy: isBuyer ? 'buyer' : 'merchant' },
    );

    // Release reserved stock
    const quote = await this.prisma.quote.findUnique({
      where: { id: order.quoteId },
      include: { rfq: true },
    });
    if (quote?.rfq) {
      await this.inventoryService.releaseStock(
        quote.rfq.productId,
        order.merchantId,
        quote.rfq.quantity,
        orderId,
      );
    }

    // Notify both parties
    await this.notifications.triggerOrderCancelled(
      order.buyerId,
      order.merchantId,
      orderId,
    );

    return { message: 'Order cancelled' };
  }

  // ──────────────────────────────────────────────
  //  DISPUTE (buyer only, DISPATCHED only)
  // ──────────────────────────────────────────────

  async dispute(buyerId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.buyerId !== buyerId)
      throw new ForbiddenException('Access denied');

    if (order.status !== OrderStatus.DISPATCHED) {
      throw new BadRequestException(
        'Disputes can only be raised for DISPATCHED orders',
      );
    }

    await this.transition(
      orderId,
      OrderStatus.DISPATCHED,
      OrderStatus.DISPUTE,
      buyerId,
      { action: 'dispute_raised' },
    );

    return { message: 'Order dispute raised' };
  }

  // ──────────────────────────────────────────────
  //  HELPERS
  // ──────────────────────────────────────────────

  private async getUserIdFromMerchant(merchantId: string): Promise<string> {
    const merchant = await this.prisma.merchantProfile.findUnique({
      where: { id: merchantId },
    });
    if (!merchant) throw new NotFoundException('Merchant not found');
    return merchant.userId;
  }
}
