import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { PrismaService } from "../../prisma/prisma.service";
import { NotificationTriggerService } from "../notification/notification-trigger.service";
import { InventoryService } from "../inventory/inventory.service";
import { PaymentService } from "../payment/payment.service";
import { ReorderService } from "../reorder/reorder.service";
import { PAYOUT_QUEUE } from "../../queue/queue.constants";
import {
  OrderStatus,
  OTP_LENGTH,
  PaginatedResponse,
  Order,
} from "@hardware-os/shared";
import { paginate } from "../../common/utils/pagination";
import { validateTransition } from "./order-state-machine";
import * as crypto from "crypto";
import { VerificationService } from "../verification/verification.service";

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationTriggerService,
    private inventoryService: InventoryService,
    @Inject(forwardRef(() => PaymentService))
    private paymentService: PaymentService,
    private reorderService: ReorderService,
    @InjectQueue(PAYOUT_QUEUE) private payoutQueue: Queue,
    private verificationService: VerificationService,
  ) {}

  // ──────────────────────────────────────────────
  //  CREATE ORDER FROM ACCEPTED QUOTE (transaction)
  // ──────────────────────────────────────────────

  async createFromQuote(quoteId: string, buyerId: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: { rfq: true },
    });
    if (!quote) throw new NotFoundException("Quote not found");
    if (!quote.rfq) throw new NotFoundException("RFQ not found for this quote");

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
          metadata: { action: "order_created_from_quote", quoteId },
        },
      });

      // Reserve inventory
      await tx.inventoryEvent.create({
        data: {
          productId: quote.rfq.productId,
          merchantId: quote.merchantId,
          eventType: "ORDER_RESERVED",
          quantity: -quote.rfq.quantity,
          referenceId: newOrder.id,
          notes: "Order reservation",
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
  //  CREATE DIRECT ORDER
  // ──────────────────────────────────────────────

  async createDirectOrder(buyerId: string, dto: any) {
    const { productId, quantity, deliveryAddress } = dto;
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { productStockCache: true },
    });

    if (!product) throw new NotFoundException("Product not found");
    if (!product.isActive) throw new BadRequestException("Product is inactive");
    if ((product as any).pricePerUnitKobo === null) {
      throw new BadRequestException("Product requires an RFQ");
    }

    if (
      !product.productStockCache ||
      product.productStockCache.stock < quantity
    ) {
      throw new BadRequestException("Insufficient stock");
    }

    const subtotalKobo = Number((product as any).pricePerUnitKobo) * quantity;
    const platformFeePercentage = Number(
      process.env.PLATFORM_FEE_PERCENTAGE || "2",
    );
    const platformFeeKobo = Math.floor(
      subtotalKobo * (platformFeePercentage / 100),
    );
    const totalAmountKobo = BigInt(subtotalKobo + platformFeeKobo);

    const idempotencyKey = `direct-order-${productId}-${buyerId}-${Date.now()}`;

    // Create the order
    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          buyerId,
          merchantId: product.merchantId,
          productId: (product as any).id,
          quantity,
          unitPriceKobo: (product as any).pricePerUnitKobo,
          deliveryAddress,
          totalAmountKobo,
          deliveryFeeKobo: 0n,
          currency: "NGN",
          status: OrderStatus.PENDING_PAYMENT,
          quoteId: null,
          idempotencyKey,
          payoutStatus: "PENDING",
        },
      });

      // Log initial OrderEvent
      await tx.orderEvent.create({
        data: {
          orderId: newOrder.id,
          fromStatus: null,
          toStatus: OrderStatus.PENDING_PAYMENT,
          triggeredBy: buyerId,
          metadata: { action: "direct_purchase_created", productId, quantity },
        },
      });

      return newOrder;
    });

    this.logger.log(
      `Direct order ${order.id} created for product ${productId}`,
    );

    // Call payment service to get the authorization URL dynamically
    const paymentData = await this.paymentService.initialize(
      buyerId,
      { orderId: order.id },
      `init-direct-${order.id}`,
    );

    return {
      orderId: order.id,
      authorizationUrl: paymentData.authorization_url,
      totalAmountKobo: Number(totalAmountKobo),
      platformFeeKobo,
    };
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
    if (!order) throw new NotFoundException("Order not found");

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
        orderEvents: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!order) throw new NotFoundException("Order not found");

    // Ownership check: must be the buyer OR the merchant
    const isBuyer = order.buyerId === userId;
    const isMerchant = merchantId && order.merchantId === merchantId;
    if (!isBuyer && !isMerchant) {
      throw new ForbiddenException("Access denied");
    }

    return order;
  }

  // ──────────────────────────────────────────────
  //  LIST ORDERS
  // ──────────────────────────────────────────────

  async listByBuyer(
    buyerId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResponse<Order>> {
    return paginate(
      this.prisma.order,
      { page, limit },
      {
        where: { buyerId },
        orderBy: { createdAt: "desc" },
        include: { merchantProfile: { select: { businessName: true } } },
      },
    );
  }

  async listByMerchant(
    merchantId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResponse<Order>> {
    return paginate(
      this.prisma.order,
      { page, limit },
      {
        where: { merchantId },
        orderBy: { createdAt: "desc" },
        include: { user: { select: { email: true, phone: true } } },
      },
    );
  }

  // ──────────────────────────────────────────────
  //  DISPATCH (merchant only, generates OTP)
  // ──────────────────────────────────────────────

  async dispatch(merchantId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException("Order not found");
    if (order.merchantId !== merchantId)
      throw new ForbiddenException("Access denied");

    if (order.status !== OrderStatus.PAID) {
      throw new BadRequestException("Order must be in PAID status to dispatch");
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
      { action: "dispatched" },
    );

    // Notification (async, best-effort)
    await this.notifications.triggerOrderDispatched(order.buyerId, {
      orderId,
      reference: orderId.slice(0, 8).toUpperCase(),
      otp: deliveryOtp,
    });

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
    if (!order) throw new NotFoundException("Order not found");
    if (order.buyerId !== buyerId)
      throw new ForbiddenException("Access denied");

    // Explicit status check before OTP validation
    if (order.status !== OrderStatus.DISPATCHED) {
      throw new BadRequestException(
        "Order must be in DISPATCHED status to confirm delivery",
      );
    }

    if (order.deliveryOtp !== otp) {
      throw new BadRequestException("Invalid OTP");
    }

    // Transition: DISPATCHED → DELIVERED
    await this.transition(
      orderId,
      OrderStatus.DISPATCHED,
      OrderStatus.DELIVERED,
      buyerId,
      { action: "delivery_confirmed" },
    );

    // Notify both merchant and buyer (best-effort, must not block state transition)
    try {
      await this.notifications.triggerDeliveryConfirmed(
        order.merchantId,
        order.buyerId,
        {
          orderId,
          reference: orderId.slice(0, 8).toUpperCase(),
          amountKobo: order.totalAmountKobo,
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to send delivery confirmed notification (orderId=${orderId}, merchantId=${order.merchantId}): ${error instanceof Error ? error.message : error}`,
      );
    }

    // Auto-transition: DELIVERED → COMPLETED
    await this.transition(
      orderId,
      OrderStatus.DELIVERED,
      OrderStatus.COMPLETED,
      buyerId,
      { action: "auto_completed" },
    );

    // Call VerificationService to trigger check on merchant's verification tier
    try {
      this.logger.log(`Evaluating tier upgrade for merchant ${order.merchantId}`);
      await this.verificationService.checkAndUpgradeTier(order.merchantId);
    } catch (error) {
      this.logger.error(
        `Failed to evaluate tier upgrade for merchant ${order.merchantId}: ${error instanceof Error ? error.message : error}`,
      );
    }

    // Trigger payout notification (PaymentService handles actual payout)
    // AUTO-PAYOUT: Initiate payout now that order is COMPLETED
    try {
      this.logger.log(`Queueing auto-payout for order ${orderId}`);
      await this.payoutQueue.add("process-payout", { orderId });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      this.logger.error(
        `Auto-payout failed for order ${orderId} (will need manual retry): ${msg}`,
        error instanceof Error ? error.stack : undefined,
      );
      // Swallow error so we don't rollback the delivery confirmation
    }

    // Create reorder reminder (best-effort)
    try {
      await this.reorderService.createReminder(orderId);
    } catch (error) {
      this.logger.error(
        `Failed to create reorder reminder for order ${orderId}: ${error instanceof Error ? error.message : error}`,
      );
    }

    return { message: "Delivery confirmed" };
  }

  // ──────────────────────────────────────────────
  //  CANCEL (role-based status rules)
  // ──────────────────────────────────────────────

  async cancel(userId: string, orderId: string, merchantId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException("Order not found");

    const isBuyer = order.buyerId === userId;
    const isMerchant = merchantId && order.merchantId === merchantId;

    if (!isBuyer && !isMerchant) {
      throw new ForbiddenException("Access denied");
    }

    // Role-based cancellation rules per guide:
    // - Buyer can cancel if PENDING_PAYMENT (no refund needed)
    // - Merchant can cancel if PAID (auto-refund triggered)
    if (isBuyer && order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new BadRequestException(
        "Buyer can only cancel orders in PENDING_PAYMENT status",
      );
    }
    if (isMerchant && order.status !== OrderStatus.PAID) {
      throw new BadRequestException(
        "Merchant can only cancel orders in PAID status",
      );
    }

    // Transition to CANCELLED
    await this.transition(
      orderId,
      order.status as OrderStatus,
      OrderStatus.CANCELLED,
      userId,
      { cancelledBy: isBuyer ? "buyer" : "merchant" },
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

    return { message: "Order cancelled" };
  }

  // ──────────────────────────────────────────────
  //  DISPUTE (buyer only, DISPATCHED only)
  // ──────────────────────────────────────────────

  async reportIssue(buyerId: string, orderId: string, reason: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException("Order not found");
    if (order.buyerId !== buyerId)
      throw new ForbiddenException("Access denied");

    // Issues can be raised for PAID or DISPATCHED orders
    if (
      order.status !== OrderStatus.DISPATCHED &&
      order.status !== OrderStatus.PAID
    ) {
      throw new BadRequestException(
        "Issues can only be raised for PAID or DISPATCHED orders",
      );
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.DISPUTE,
        disputeStatus: "PENDING",
        disputeReason: reason,
      },
    });

    await this.prisma.orderEvent.create({
      data: {
        orderId,
        fromStatus: order.status as OrderStatus,
        toStatus: OrderStatus.DISPUTE,
        triggeredBy: buyerId,
        metadata: { action: "issue_reported", reason },
      },
    });

    // Notify merchant and admin
    try {
      await this.notifications.triggerOrderDisputed(
        order.merchantId,
        orderId,
        reason,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send dispute notification: ${error instanceof Error ? error.message : error}`,
      );
    }

    return updatedOrder;
  }

  // ──────────────────────────────────────────────
  //  ORDER RECEIPT AGGREGATION
  // ──────────────────────────────────────────────

  async getReceipt(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        merchantProfile: {
          select: {
            businessName: true,
            businessAddress: true,
            user: { select: { phone: true, email: true } },
          },
        },
        user: { select: { email: true, phone: true } },
        quote: {
          include: {
            rfq: {
              include: { product: true },
            },
          },
        },
        payments: {
          where: { status: "SUCCESS" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    if (order.buyerId !== userId) {
      throw new ForbiddenException("Only the buyer can access their receipt");
    }

    return order;
  }

  // ──────────────────────────────────────────────
  //  HELPERS
  // ──────────────────────────────────────────────

  async getMerchantSummary(merchantId: string) {
    const orders = await this.prisma.order.findMany({
      where: { merchantId },
      select: {
        totalAmountKobo: true,
        deliveryFeeKobo: true,
        status: true,
      },
    });

    const summary = {
      escrow: 0,
      paidOut: 0,
      pending: 0,
      failed: 0,
      orderCount: orders.length,
    };

    orders.forEach((o) => {
      const amount =
        Number(o.totalAmountKobo || 0) + Number(o.deliveryFeeKobo || 0);
      switch (o.status) {
        case OrderStatus.PAID:
        case OrderStatus.DISPATCHED:
          summary.escrow += amount;
          break;
        case OrderStatus.DELIVERED:
        case OrderStatus.COMPLETED:
          summary.paidOut += amount;
          break;
        case OrderStatus.PENDING_PAYMENT:
          summary.pending += amount;
          break;
        case OrderStatus.CANCELLED:
        case OrderStatus.DISPUTE:
          summary.failed += amount;
          break;
      }
    });

    return summary;
  }

  private async getUserIdFromMerchant(merchantId: string): Promise<string> {
    const merchant = await this.prisma.merchantProfile.findUnique({
      where: { id: merchantId },
    });
    if (!merchant) throw new NotFoundException("Merchant not found");
    return merchant.userId;
  }
}
