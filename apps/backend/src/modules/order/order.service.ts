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
import { LogisticsService } from "../logistics/logistics.service";
import {
  PAYOUT_QUEUE,
  REVIEW_QUEUE,
  CHECKOUT_REMINDER_QUEUE,
} from "../../queue/queue.constants";
import { WhatsAppService } from "../whatsapp/whatsapp.service";
import {
  InventoryEventType,
  Order,
  OrderStatus,
  PaginatedResponse,
  PriceType,
} from "@swifta/shared";

import { paginate } from "../../common/utils/pagination";
import { validateTransition, getNextStates } from "./order-state-machine";
import * as crypto from "crypto";
import { VerificationService } from "../verification/verification.service";
import { CreateDirectOrderDto } from "./dto/create-direct-order.dto";
import { CreateTrackingDto } from "./dto/create-tracking.dto";
import { CheckoutCartDto } from "./dto/checkout-cart.dto";

import { PayoutService } from "../payout/payout.service";
import { PlatformConfig } from "../../config/platform.config";

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
    @InjectQueue(REVIEW_QUEUE) private reviewQueue: Queue,
    @InjectQueue(CHECKOUT_REMINDER_QUEUE) private checkoutReminderQueue: Queue,
    private verificationService: VerificationService,
    @Inject(forwardRef(() => LogisticsService))
    private logisticsService: LogisticsService,
    @Inject(forwardRef(() => WhatsAppService))
    private whatsappService: WhatsAppService,
    private payoutService: PayoutService,
  ) {}

  // ──────────────────────────────────────────────
  //  CREATE DIRECT ORDER
  // ──────────────────────────────────────────────

  async createDirectOrder(buyerId: string, dto: CreateDirectOrderDto) {
    const {
      productId,
      quantity,
      deliveryAddress,
      deliveryDetails,
      paymentMethod: requestedMethod,
      deliveryMethod = "MERCHANT_DELIVERY",
    } = dto;
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { productStockCache: true, merchantProfile: true },
    });

    if (!product) throw new NotFoundException("Product not found");
    if (!product.isActive) throw new BadRequestException("Product is inactive");

    if (product.merchantProfile?.userId === buyerId) {
      throw new ForbiddenException(
        "Merchants cannot purchase their own products",
      );
    }

    // Resolve buyer type to determine price
    const buyerProfile = await this.prisma.buyerProfile.findUnique({
      where: { userId: buyerId },
    });
    const isConsumer = buyerProfile?.buyerType === "CONSUMER";

    const resolvedPriceKobo =
      isConsumer && product.retailPriceKobo
        ? product.retailPriceKobo
        : (product.wholesalePriceKobo ?? product.pricePerUnitKobo);

    if (resolvedPriceKobo === null) {
      throw new BadRequestException("Product price is not available");
    }

    // Handle missing stock cache: auto-heal for all active products to prevent checkout blocks
    let currentStock = product.productStockCache?.stock ?? 0;
    if (!product.productStockCache && product.isActive) {
      this.logger.warn(
        `Auto-creating missing productStockCache for product ${product.id}`,
      );
      currentStock = product.isSeeded ? 100 : 50;
      await this.prisma.productStockCache.upsert({
        where: { productId: product.id },
        update: { stock: currentStock },
        create: { productId: product.id, stock: currentStock },
      });
    }

    if (currentStock < quantity) {
      throw new BadRequestException("Insufficient stock");
    }

    // Determine payment method based on merchant verification tier
    const merchantTier = product.merchantProfile?.verificationTier;
    const isTier2Or3 = merchantTier === "TIER_2" || merchantTier === "TIER_3";
    const paymentMethod =
      requestedMethod === "DIRECT" && isTier2Or3 ? "DIRECT" : "ESCROW";

    const subtotalKobo = BigInt(resolvedPriceKobo) * BigInt(quantity);
    const platformFeePercent = PlatformConfig.getPlatformFeePercent(
      merchantTier,
      paymentMethod,
    );
    const platformFeeKobo = PlatformConfig.calculateFeeKobo(
      subtotalKobo,
      merchantTier,
      paymentMethod,
    );

    let calculatedDeliveryFeeKobo = 0n;
    if (
      deliveryMethod === "PLATFORM_LOGISTICS" &&
      product.merchantProfile?.businessAddress
    ) {
      // Estimate weight roughly, e.g., 50kg per unit if bulky, or fallback to 1kg
      const estimatedWeightKg =
        product.unit.toLowerCase() === "bag" ? 50 * quantity : 1 * quantity;
      const quote = await this.logisticsService.getQuote(
        product.merchantProfile.businessAddress,
        deliveryAddress,
        estimatedWeightKg,
      );
      calculatedDeliveryFeeKobo = BigInt(quote.costKobo);
    }

    // Add delivery fee logic
    const totalKobo =
      subtotalKobo + platformFeeKobo + calculatedDeliveryFeeKobo;

    const idempotencyKey =
      dto.idempotencyKey ||
      this.generateDeterministicKey("direct", buyerId, {
        productId,
        quantity,
        deliveryAddress,
        paymentMethod,
        deliveryMethod,
      });

    // Create the order with reservation
    const order = await this.prisma.$transaction(async (tx) => {
      // 1. Atomic reservation
      const updateResult = await tx.productStockCache.updateMany({
        where: {
          productId: product.id,
          stock: { gte: quantity },
        },
        data: { stock: { decrement: quantity } },
      });

      if (updateResult.count === 0) {
        throw new BadRequestException("Insufficient stock");
      }

      // 2. Inventory Event
      await tx.inventoryEvent.create({
        data: {
          productId: product.id,
          merchantId: product.merchantId,
          eventType: InventoryEventType.ORDER_RESERVED,
          quantity: quantity,
          notes: `Direct purchase reservation (buyer: ${buyerId})`,
        },
      });

      // 3. Create order (with P2002 idempotency guard)
      let newOrder;
      try {
        newOrder = await tx.order.create({
          data: {
            buyerId,
            merchantId: product.merchantId,
            productId: product.id,
            quantity,
            unitPriceKobo: resolvedPriceKobo,
            deliveryAddress,
            deliveryDetails: deliveryDetails ? (deliveryDetails as any) : null,
            totalAmountKobo: totalKobo,
            deliveryFeeKobo: calculatedDeliveryFeeKobo,
            currency: "NGN",
            status: OrderStatus.PENDING_PAYMENT,
            paymentMethod,
            deliveryMethod,
            platformFeeKobo,
            platformFeePercent,
            quoteId: null,
            idempotencyKey,
            payoutStatus: "PENDING",
          },
        });
      } catch (err: any) {
        // If idempotency key conflict (P2002), return existing order
        if (err?.code === "P2002") {
          const existing = await tx.order.findFirst({
            where: { idempotencyKey },
          });
          if (existing) return existing;
        }
        throw err;
      }

      // Log initial OrderEvent
      await tx.orderEvent.create({
        data: {
          orderId: newOrder.id,
          fromStatus: null,
          toStatus: OrderStatus.PENDING_PAYMENT,
          triggeredBy: buyerId,
          metadata: {
            action: "direct_purchase_created",
            productId,
            quantity,
            paymentMethod,
          },
        },
      });

      return newOrder;
    });

    // Notify Merchant (outside transaction)
    try {
      const orderWithDetails = await this.prisma.order.findUnique({
        where: { id: order.id },
        include: { user: true, product: true },
      });

      if (orderWithDetails && order.merchantId) {
        this.whatsappService
          .sendDirectOrderNotification(order.merchantId, {
            orderId: order.id,
            buyerName:
              orderWithDetails.user.firstName +
              " " +
              orderWithDetails.user.lastName,
            productName: orderWithDetails.product?.name || "Product",
            quantity: order.quantity || 1,
            amountKobo: order.totalAmountKobo,
            deliveryAddress: order.deliveryAddress || "Not specified",
          })
          .catch((err) =>
            this.logger.error(`Error in sendDirectOrderNotification: ${err}`),
          );
      }
    } catch (notifierErr) {
      this.logger.error(
        `Failed to send merchant WhatsApp notification for ${order.id}`,
        notifierErr,
      );
    }

    this.logger.log(
      `Direct order ${order.id} created for product ${productId} (method: ${paymentMethod})`,
    );

    await this.checkoutReminderQueue.add(
      "send-checkout-reminder",
      { orderId: order.id },
      { delay: 60 * 60 * 1000 },
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
      totalAmountKobo: Number(totalKobo), // For notifications/events, cast back to number
      platformFeeKobo,
      paymentMethod,
    };
  }

  // ──────────────────────────────────────────────
  //  CHECKOUT CART (B2C MULTI-ITEM CHECKOUT)
  // ──────────────────────────────────────────────

  async checkoutCart(buyerId: string, dto: CheckoutCartDto) {
    const {
      cartItemIds,
      deliveryAddress,
      deliveryDetails,
      deliveryMethod = "MERCHANT_DELIVERY",
      paymentMethod: requestedMethod,
    } = dto;

    if (!cartItemIds || cartItemIds.length === 0) {
      throw new BadRequestException("No cart items provided for checkout.");
    }

    // Fetch the cart items with products and ensuring they belong to the buyer
    const items = await this.prisma.cartItem.findMany({
      where: {
        id: { in: cartItemIds },
        buyerId: buyerId,
      },
      include: {
        product: {
          include: { merchantProfile: true, productStockCache: true },
        },
      },
    });

    if (items.length !== cartItemIds.length) {
      throw new BadRequestException(
        "One or more cart items are invalid or do not belong to you.",
      );
    }

    // Ensure all items are from the SAME MERCHANT because Escrow Payouts are 1-to-1 Order-to-Merchant
    const merchantIds = new Set(items.map((item) => item.product.merchantId));
    if (merchantIds.size > 1) {
      throw new BadRequestException(
        "Cart checkout is restricted to one merchant per order. Please split your checkout.",
      );
    }

    const merchantId = items[0].product.merchantId;
    const merchantProfile = items[0].product.merchantProfile;
    if (!merchantProfile) {
      throw new BadRequestException(
        "Merchant profile not found for these items.",
      );
    }

    if (merchantProfile.userId === buyerId) {
      throw new ForbiddenException(
        "Merchants cannot purchase their own products",
      );
    }

    await this.prisma.buyerProfile.findUnique({
      where: { userId: buyerId },
    });

    let subtotalKobo = 0n;
    const jsonItems = [];

    // Validations and calculations
    for (const item of items) {
      const product = item.product;
      if (!product.isActive || product.deletedAt) {
        throw new BadRequestException(
          `Product ${product.name} is no longer available.`,
        );
      }

      // Logic: Retail vs Wholesale price selection based on item.priceType
      const isWholesale = item.priceType === PriceType.WHOLESALE;
      const minQty = isWholesale
        ? product.minOrderQuantity
        : product.minOrderQuantityConsumer;

      // Handle missing stock cache: auto-heal for all active products to prevent checkout blocks
      let currentStock = product.productStockCache?.stock ?? 0;
      if (!product.productStockCache && product.isActive) {
        this.logger.warn(
          `Auto-creating missing productStockCache for product ${product.id}`,
        );
        // Give it a default buffer to allow checkout to proceed or 100 for seeded
        currentStock = product.isSeeded ? 100 : 50;
        await this.prisma.productStockCache.upsert({
          where: { productId: product.id },
          update: { stock: currentStock },
          create: { productId: product.id, stock: currentStock },
        });
      }

      if (currentStock < item.quantity || item.quantity < minQty) {
        throw new BadRequestException(
          `Insufficient stock or quantity for ${product.name} is below the minimum for ${item.priceType} (${minQty})`,
        );
      }

      const resolvedPriceKobo = isWholesale
        ? (product.wholesalePriceKobo ?? product.pricePerUnitKobo ?? 0n)
        : (product.retailPriceKobo ?? product.pricePerUnitKobo ?? 0n);

      if (resolvedPriceKobo === 0n) {
        throw new BadRequestException(
          `Product ${product.name} does not have a valid ${item.priceType} price.`,
        );
      }

      subtotalKobo += BigInt(resolvedPriceKobo) * BigInt(item.quantity);

      jsonItems.push({
        productId: product.id,
        quantity: item.quantity,
        unitPriceKobo: resolvedPriceKobo.toString(),
        name: product.name,
        priceType: item.priceType,
      });
    }

    // Determine payment method and platform fee
    const merchantTier = merchantProfile.verificationTier;
    const isTier2Or3 = merchantTier === "TIER_2" || merchantTier === "TIER_3";
    const paymentMethod =
      requestedMethod === "DIRECT" && isTier2Or3 ? "DIRECT" : "ESCROW";

    // Dynamic platform fee based on config/tier
    const platformFeePercentage = PlatformConfig.getPlatformFeePercent(
      merchantTier,
      paymentMethod,
    );
    const platformFeeKobo = PlatformConfig.calculateFeeKobo(
      subtotalKobo,
      merchantTier,
      paymentMethod,
    );

    let calculatedDeliveryFeeKobo = 0n;
    if (
      deliveryMethod === "PLATFORM_LOGISTICS" &&
      merchantProfile.businessAddress
    ) {
      // Very rough estimate of 10kg per cart item total for now
      const estimatedWeightKg = 10 * items.length;
      // No try-catch here: let logistics errors propagate to the user
      const quote = await this.logisticsService.getQuote(
        merchantProfile.businessAddress,
        deliveryAddress,
        estimatedWeightKg,
      );
      calculatedDeliveryFeeKobo = BigInt(quote.costKobo);
    }

    const totalKobo =
      subtotalKobo + platformFeeKobo + calculatedDeliveryFeeKobo;
    const idempotencyKey =
      dto.idempotencyKey ||
      this.generateDeterministicKey("cart", buyerId, {
        cartItemIds: [...cartItemIds].sort(),
        deliveryAddress,
        paymentMethod,
        deliveryMethod,
      });

    // Create the order atomically with inventory reservation
    const order = await this.prisma.$transaction(async (tx) => {
      // 1. Atomic: check and decrement stock
      for (const item of items) {
        const updateResult = await tx.productStockCache.updateMany({
          where: {
            productId: item.productId,
            stock: { gte: item.quantity },
          },
          data: { stock: { decrement: item.quantity } },
        });

        if (updateResult.count === 0) {
          throw new BadRequestException(
            `Insufficient stock for ${item.product.name}.`,
          );
        }

        // Log inventory event
        await tx.inventoryEvent.create({
          data: {
            productId: item.productId,
            merchantId: merchantId as string,
            eventType: InventoryEventType.ORDER_RESERVED,
            quantity: item.quantity,
            notes: `Reserved for cart checkout (buyer: ${buyerId})`,
          },
        });
      }

      // 2. Create the order (with P2002 idempotency guard)
      let newOrder;
      try {
        newOrder = await tx.order.create({
          data: {
            buyerId,
            merchantId,
            deliveryAddress,
            deliveryDetails: deliveryDetails ? (deliveryDetails as any) : null,
            totalAmountKobo: totalKobo,
            deliveryFeeKobo: calculatedDeliveryFeeKobo,
            currency: "NGN",
            status: OrderStatus.PENDING_PAYMENT,
            paymentMethod,
            deliveryMethod: deliveryMethod as any,
            platformFeeKobo,
            platformFeePercent: platformFeePercentage,
            items: jsonItems,
            quoteId: null,
            idempotencyKey,
            payoutStatus: "PENDING",
          },
        });
      } catch (err: any) {
        // If idempotency key conflict (P2002), return existing order
        if (err?.code === "P2002") {
          const existing = await tx.order.findFirst({
            where: { idempotencyKey },
          });
          if (existing) return existing;
        }
        throw err;
      }

      // 3. Create initial order event (audit trail)
      await tx.orderEvent.create({
        data: {
          orderId: newOrder.id,
          toStatus: OrderStatus.PENDING_PAYMENT,
          triggeredBy: buyerId,
          metadata: { action: "cart_checkout", items: jsonItems },
        },
      });

      // 4. NOTE: Cart items are NOT cleared here anymore.
      // They will be cleared in the webhook handler after payment succeeds.
      // This prevents data loss when buyers abandon payment.

      return newOrder;
    });

    await this.checkoutReminderQueue.add(
      "send-checkout-reminder",
      { orderId: order.id },
      { delay: 60 * 60 * 1000 },
    );

    // Generate Payment Link
    const paymentData = await this.paymentService.initialize(
      buyerId,
      { orderId: order.id },
      `init-cart-${order.id}`,
    );

    return {
      orderId: order.id,
      authorizationUrl: paymentData.authorization_url,
      totalAmountKobo: Number(totalKobo),
      platformFeeKobo: Number(platformFeeKobo),
      paymentMethod,
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
        orderEvents: { orderBy: { createdAt: "asc" } },
        review: true,
      },
    });
    if (!order) throw new NotFoundException("Order not found");

    // Ownership check: must be the buyer OR the merchant
    const isBuyer = order.buyerId === userId;
    const isMerchant = merchantId && order.merchantId === merchantId;
    if (!isBuyer && !isMerchant) {
      throw new ForbiddenException("Access denied");
    }

    if (!isBuyer && "deliveryOtp" in order) {
      order.deliveryOtp = null;
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
    const paginated = await paginate(
      this.prisma.order,
      { page, limit },
      {
        where: { merchantId },
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { email: true, phone: true } },
          product: true,
        },
      },
    );

    // Strip OTP from merchant responses
    if (paginated.data) {
      (paginated.data as any[]).forEach((order) => {
        order.deliveryOtp = null;
      });
    }

    return paginated as any;
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

    if (
      order.status !== OrderStatus.PAID &&
      order.status !== OrderStatus.PREPARING
    ) {
      throw new BadRequestException(
        "Order must be in PAID or PREPARING status to dispatch",
      );
    }

    // Crypto-secure 6-digit OTP
    const deliveryOtp =
      order.deliveryOtp || crypto.randomInt(100000, 999999).toString();

    // Resolve triggeredBy (userId from merchantId)
    const triggeredBy = await this.getUserIdFromMerchant(merchantId);

    // Save OTP, dispatchedAt + tracking record atomically
    await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: orderId },
        data: { deliveryOtp, dispatchedAt: new Date() },
      }),
      this.prisma.orderTracking.create({
        data: {
          orderId,
          status: OrderStatus.DISPATCHED,
        },
      }),
    ]);

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
  //  TRACKING (merchant)
  // ──────────────────────────────────────────────

  async addTracking(
    merchantId: string,
    orderId: string,
    dto: CreateTrackingDto,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException("Order not found");
    if (order.merchantId !== merchantId)
      throw new ForbiddenException("Access denied");

    // Reject DELIVERED status for merchant tracking updates
    if (dto.status === OrderStatus.DELIVERED) {
      throw new BadRequestException(
        "Use confirmDelivery() to mark an order as DELIVERED after OTP validation",
      );
    }

    // Check valid next states via state machine
    const allowedNext = getNextStates(order.status as OrderStatus);
    if (!allowedNext.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${dto.status}`,
      );
    }

    // Handle OTP generation if transitioning to DISPATCHED
    let deliveryOtp = order.deliveryOtp;
    if (dto.status === OrderStatus.DISPATCHED && !deliveryOtp) {
      deliveryOtp = crypto.randomInt(100000, 999999).toString();
      await this.prisma.order.update({
        where: { id: orderId },
        data: { deliveryOtp, dispatchedAt: new Date() },
      });
    }

    // Resolve triggeredBy
    const triggeredBy = await this.getUserIdFromMerchant(merchantId);

    // Create tracking record
    await this.prisma.orderTracking.create({
      data: {
        orderId,
        status: dto.status,
        note: dto.note,
      },
    });

    const updatedOrder = await this.transition(
      orderId,
      order.status as OrderStatus,
      dto.status,
      triggeredBy,
      { action: "tracking_update", note: dto.note },
    );

    // Send relevant notification
    try {
      if (dto.status === OrderStatus.PREPARING) {
        await this.notifications.triggerOrderPreparing(order.buyerId, {
          orderId,
          reference: orderId.slice(0, 8).toUpperCase(),
        });
      } else if (dto.status === OrderStatus.DISPATCHED) {
        await this.notifications.triggerOrderDispatched(order.buyerId, {
          orderId,
          reference: orderId.slice(0, 8).toUpperCase(),
          otp: deliveryOtp as string,
        });
      } else if (dto.status === OrderStatus.IN_TRANSIT) {
        await this.notifications.triggerOrderInTransit(order.buyerId, {
          orderId,
          reference: orderId.slice(0, 8).toUpperCase(),
          note: dto.note,
        });
      }
    } catch (error) {
      this.logger.error(
        `Failed to send tracking notification for order ${orderId} (buyer ${order.buyerId}, type: ${dto.status})`,
        error instanceof Error ? error.stack : "Unknown error",
      );
    }

    return updatedOrder;
  }

  async getTracking(orderId: string, userId: string, merchantId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException("Order not found");

    // Ensure permission
    if (order.buyerId !== userId && order.merchantId !== merchantId) {
      throw new ForbiddenException("Access denied");
    }

    return this.prisma.orderTracking.findMany({
      where: { orderId },
      orderBy: { createdAt: "asc" },
    });
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
    if (
      order.status !== OrderStatus.DISPATCHED &&
      order.status !== OrderStatus.IN_TRANSIT
    ) {
      throw new BadRequestException(
        "Order must be in DISPATCHED or IN_TRANSIT status to confirm delivery",
      );
    }

    if (order.deliveryOtp !== otp) {
      throw new BadRequestException("Invalid OTP");
    }

    // Transition: CURRENT_STATUS → DELIVERED
    await this.transition(
      orderId,
      order.status as OrderStatus,
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
      this.logger.log(
        `Evaluating tier upgrade for merchant ${order.merchantId}`,
      );
      await this.verificationService.checkAndUpgradeTier(order.merchantId);
    } catch (error) {
      this.logger.error(
        `Failed to evaluate tier upgrade for merchant ${order.merchantId}: ${error instanceof Error ? error.message : error}`,
      );
    }

    // AUTO-PAYOUT: Only queue payout for ESCROW orders.
    // DIRECT orders are already paid out immediately on payment confirmation.
    if (order.paymentMethod === "ESCROW") {
      try {
        this.logger.log(`Queueing auto-payout for ESCROW order ${orderId}`);
        await this.payoutQueue.add(
          "process-payout",
          { orderId },
          { jobId: `payout-${orderId}` },
        );
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        this.logger.error(
          `Auto-payout failed for order ${orderId} (will need manual retry): ${msg}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    } else {
      this.logger.log(
        `Skipping payout queue for DIRECT order ${orderId} (already paid out)`,
      );
    }

    // Create reorder reminder (best-effort)
    try {
      await this.reorderService.createReminder(orderId);
    } catch (error) {
      this.logger.error(
        `Failed to create reorder reminder for order ${orderId}: ${error instanceof Error ? error.message : error}`,
      );
    }

    // REVIEW PROMPT: Queue a review prompt job after 1 hour (3600 seconds)
    // Only if the order has a merchant (Reviews are for merchants)
    if (order.merchantId) {
      try {
        this.logger.log(
          `Queueing review prompt for order ${orderId} in 1 hour`,
        );
        await this.reviewQueue.add(
          "send-review-prompt",
          { orderId, buyerId },
          {
            delay: 3600 * 1000, // 1 hour delay
            jobId: `review-prompt-${orderId}`,
            removeOnComplete: true,
          },
        );
      } catch (error) {
        this.logger.error(
          `Failed to queue review prompt for order ${orderId}: ${error instanceof Error ? error.message : error}`,
        );
      }
    } else {
      this.logger.log(
        `Skipping review prompt for order ${orderId} (No merchant associated)`,
      );
    }

    return { message: "Delivery confirmed" };
  }

  /**
   * System-triggered delivery confirmation after 72 hours of inactivity.
   */
  async autoConfirmDelivery(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true, // buyer
        merchantProfile: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    if (
      order.status !== OrderStatus.DISPATCHED &&
      order.status !== OrderStatus.IN_TRANSIT
    ) {
      this.logger.warn(
        `Order ${orderId} is in ${order.status} state, cannot auto-confirm.`,
      );
      return;
    }

    this.logger.log(`Auto-confirming delivery for order ${orderId}`);

    // 1. Transition to DELIVERED (uses standard audit trail)
    await this.transition(
      orderId,
      order.status as OrderStatus,
      OrderStatus.DELIVERED,
      order.buyerId, // System acting on behalf of buyer's silence
      { action: "system_auto_confirm" },
    );

    // 2. Clear dispute window immediately for auto-confirmation
    await this.prisma.order.update({
      where: { id: orderId },
      data: { disputeWindowEndsAt: new Date() },
    });

    // 3. Create tracking entry AFTER transition
    await this.prisma.orderTracking.create({
      data: {
        orderId,
        status: OrderStatus.DELIVERED,
        note: "Delivery auto-confirmed after 72 hours of no response.",
      },
    });

    // 4. Notify participants with strict isolation
    try {
      if (order.merchantId) {
        await this.notifications.triggerOrderAutoConfirmed(
          order.buyerId,
          order.merchantId,
          {
            orderId: order.id,
            reference: order.id.slice(0, 8).toUpperCase(),
            amountKobo: order.totalAmountKobo,
          },
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to notify for auto-confirmed order ${orderId}: ${error instanceof Error ? error.message : error}`,
      );
    }

    // 5. Final transition to COMPLETED
    await this.transition(
      orderId,
      OrderStatus.DELIVERED,
      OrderStatus.COMPLETED,
      order.buyerId,
      { action: "auto_completion_payout" },
    );

    // 6. Post-completion processing (payouts and tier checks)
    try {
      if (order.merchantId) {
        // Upgrade check
        await this.verificationService.checkAndUpgradeTier(order.merchantId);

        // Payout if ESCROW
        if (order.paymentMethod === "ESCROW") {
          await this.payoutQueue.add(
            "process-payout",
            { orderId },
            { jobId: `payout-${orderId}` },
          );
        }
      }
    } catch (err: unknown) {
      this.logger.error(
        `Post-auto-confirm processing failed for ${orderId}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    return { success: true };
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

    // Release reserved stock for different order types
    if (order.productId && order.quantity) {
      // Direct Purchase
      await this.inventoryService.releaseStock(
        order.productId,
        order.merchantId as string,
        order.quantity,
        orderId,
      );
    } else if (order.items) {
      // Cart Checkout (Multi-item)
      const items = order.items as any[];
      const releasePayload = items
        .filter((item) => item.productId && item.quantity)
        .map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity),
        }));

      if (releasePayload.length > 0) {
        await this.inventoryService.releaseStockBatch(
          releasePayload,
          order.merchantId as string,
          orderId,
        );
      }
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
      const amount = Number(
        (o.totalAmountKobo || 0n) + (o.deliveryFeeKobo || 0n),
      );
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

  private generateDeterministicKey(
    prefix: string,
    buyerId: string,
    payload: Record<string, any>,
  ): string {
    // Canonicalize: sort arrays and use stable key ordering
    const canonical = this.canonicalize({ buyerId, ...payload });
    const hash = crypto.createHash("sha256").update(canonical).digest("hex");
    return `${prefix}-${hash.substring(0, 16)}`;
  }

  /**
   * Stable JSON serialization: sort object keys recursively and sort arrays
   * so that the same logical payload always produces the same hash.
   */
  private canonicalize(obj: any): string {
    return JSON.stringify(obj, (_, value) => {
      if (Array.isArray(value)) {
        // Sort primitive arrays for stable ordering
        return [...value].sort();
      }
      if (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value)
      ) {
        // Sort object keys
        return Object.keys(value)
          .sort()
          .reduce(
            (sorted, key) => {
              sorted[key] = value[key];
              return sorted;
            },
            {} as Record<string, any>,
          );
      }
      return value;
    });
  }
}
