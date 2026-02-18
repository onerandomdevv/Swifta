import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationTriggerService } from '../notification/notification-trigger.service';
import { InventoryService } from '../inventory/inventory.service';
import { OrderStatus, OTP_LENGTH } from '@hardware-os/shared';
import { validateTransition } from './order-state-machine';
import * as crypto from 'crypto';

@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationTriggerService,
    private inventoryService: InventoryService
  ) {}

  async createFromQuote(quoteId: string, buyerId: string) {
    const quote = await this.prisma.quote.findUnique({ where: { id: quoteId } });
    if (!quote) throw new NotFoundException('Quote not found');

    const orderId = crypto.randomUUID();
    
    // Idempotency key for initial creation could be quoteId to prevent duplicates
    const idempotencyKey = `order-create-${quoteId}`;

    const order = await this.prisma.order.create({
      data: {
        id: orderId,
        quoteId,
        buyerId,
        merchantId: quote.merchantId,
        totalAmountKobo: quote.totalPriceKobo,
        deliveryFeeKobo: quote.deliveryFeeKobo,
        currency: quote.currency,
        status: OrderStatus.PENDING_PAYMENT,
        idempotencyKey
      }
    });

    // Reserve stock happens on payment success or here?
    // Requirement implies "ORDER_RESERVED" event in inventory. 
    // Usually reservation happens at order creation or payment. 
    // Let's reserve on creation for now, release if cancelled/expired.
    const rfq = await this.prisma.rFQ.findUnique({ where: { id: quote.rfqId } });
    if (rfq) {
        await this.inventoryService.reserveStock(rfq.productId, quote.merchantId, rfq.quantity, order.id);
    }

    return order;
  }

  async transition(orderId: string, toStatus: OrderStatus, triggeredBy: string, metadata?: any) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    if (!validateTransition(order.status as unknown as OrderStatus, toStatus)) {
        throw new BadRequestException(`Invalid state transition from ${order.status} to ${toStatus}`);
    }

    const updatedOrder = await this.prisma.order.update({
        where: { id: orderId },
        data: { status: toStatus }
    });

    await this.prisma.orderEvent.create({
        data: {
            orderId,
            fromStatus: order.status,
            toStatus,
            triggeredBy,
            metadata: metadata || {}
        }
    });

    return updatedOrder;
  }

  async getById(id: string) {
    const order = await this.prisma.order.findUnique({
        where: { id },
        include: { quote: { include: { rfq: { include: { product: true } } } }, events: true }
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async listByBuyer(buyerId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { buyerId },
        skip,
        take: +limit,
        orderBy: { createdAt: 'desc' },
         include: { merchant: { select: { businessName: true } } }
      }),
      this.prisma.order.count({ where: { buyerId } })
    ]);
    return { data, meta: { page, limit, total } };
  }

  async listByMerchant(merchantId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
     const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { merchantId },
        skip,
        take: +limit,
        orderBy: { createdAt: 'desc' },
        include: { buyer: { select: { email: true, phone: true } } }
      }),
      this.prisma.order.count({ where: { merchantId } })
    ]);
    return { data, meta: { page, limit, total } };
  }

  async dispatch(merchantId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.merchantId !== merchantId) throw new ForbiddenException('Access denied');

    // Generate Delivery OTP
    const deliveryOtp = Math.floor(100000 + Math.random() * 900000).toString();

    const updatedOrder = await this.prisma.order.update({
        where: { id: orderId },
        data: { deliveryOtp }
    });

    await this.transition(orderId, OrderStatus.DISPATCHED, (await this.getUserIdFromMerchant(merchantId)), { deliveryOtp: 'generated' });

    await this.notifications.triggerOrderDispatched(order.buyerId, orderId);

    return updatedOrder;
  }

  async confirmDelivery(buyerId: string, orderId: string, otp: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.buyerId !== buyerId) throw new ForbiddenException('Access denied');
    
    if (order.deliveryOtp !== otp) {
        throw new BadRequestException('Invalid OTP');
    }

    await this.transition(orderId, OrderStatus.DELIVERED, buyerId);
    
    // Release stock permanently (STOCK_OUT happened at reservation? No, reservation holds it. Release converts reservation to STOCK_OUT?)
    // Inventory service needs to handle "converting reservation to sold". 
    // For now, let's assume reservation just holds it, and we might not need another event unless we want to "commit" it. 
    // The requirement lists ORDER_RELEASED. Usually RELEASE means "cancel reservation". 
    // Let's assume on DELIVERED/COMPLETED it's final.

    await this.notifications.triggerDeliveryConfirmed(order.merchantId, orderId);
    
    // Auto-complete or wait for system? Let's auto-complete for now or leave at DELIVERED.
    // Transition to COMPLETED usually happens after payouts or some time.
    await this.transition(orderId, OrderStatus.COMPLETED, buyerId);

    // Initiate payout
    // this.paymentService.initiatePayout(orderId); // Circular dependency potential, trigger via event/notification service maybe?
    // For now, stub notification triggers payout logic
    await this.notifications.triggerPayoutInitiated(order.merchantId, orderId);

    return { message: 'Delivery confirmed' };
  }

  async cancel(userId: string, orderId: string) {
     const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    
    // Check ownership (buyer or merchant) - simpler to just query user directly?
    // We only have userId. Need to check if user is the buyer or the merchant owner.
    // For simplicity assuming buyer triggers cancel mostly. Merchant cancel logic similar.
    if (order.buyerId !== userId && order.merchantId !== (await this.getMerchantIdFromUser(userId))) {
         throw new ForbiddenException('Access denied');
    }

    await this.transition(orderId, OrderStatus.CANCELLED, userId);
    
    // Release stock
    const quote = await this.prisma.quote.findUnique({ where: { id: order.quoteId }, include: { rfq: true } });
    if (quote && quote.rfq) {
        await this.inventoryService.releaseStock(quote.rfq.productId, order.merchantId, quote.rfq.quantity, orderId);
    }

    await this.notifications.triggerOrderCancelled(order.buyerId, order.merchantId, orderId);

    return { message: 'Order cancelled' };
  }

  async dispute(buyerId: string, orderId: string) {
      const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.buyerId !== buyerId) throw new ForbiddenException('Access denied');

    await this.transition(orderId, OrderStatus.DISPUTE, buyerId);
    return { message: 'Order dispute raised' };
  }
  
  private async getUserIdFromMerchant(merchantId: string): Promise<string> {
      const merchant = await this.prisma.merchantProfile.findUnique({ where: { id: merchantId } });
      return merchant?.userId || '';
  }

  private async getMerchantIdFromUser(userId: string): Promise<string> {
      const merchant = await this.prisma.merchantProfile.findUnique({ where: { userId } });
      return merchant?.id || '';
  }
}
