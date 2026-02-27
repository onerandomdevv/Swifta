import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { NotificationTriggerService } from "../notification/notification-trigger.service";
import { SubmitQuoteDto } from "./dto/submit-quote.dto";
import {
  RFQStatus,
  QuoteStatus,
  OrderStatus,
  InventoryEventType,
  DEFAULT_CURRENCY,
} from "@hardware-os/shared";
import * as crypto from "crypto";

@Injectable()
export class QuoteService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationTriggerService,
  ) {}

  async submit(merchantId: string, dto: SubmitQuoteDto) {
    const rfq = await this.prisma.rfq.findUnique({
      where: { id: dto.rfqId },
    });

    if (!rfq) {
      throw new NotFoundException("RFQ not found");
    }

    // Only OPEN RFQs can receive quotes (spec says merchant submits quote for OPEN RFQ)
    if (rfq.status !== RFQStatus.OPEN) {
      throw new BadRequestException("RFQ is not open for quotes");
    }

    if (rfq.merchantId !== merchantId) {
      throw new ForbiddenException("You can only quote for your own RFQs");
    }

    // Check if RFQ has expired
    if (rfq.expiresAt && new Date(rfq.expiresAt) < new Date()) {
      throw new BadRequestException("RFQ has expired");
    }

    const quote = await this.prisma.quote.create({
      data: {
        rfqId: dto.rfqId,
        merchantId,
        unitPriceKobo: dto.unitPriceKobo,
        totalPriceKobo: dto.totalPriceKobo,
        deliveryFeeKobo: dto.deliveryFeeKobo ?? BigInt(0),
        validUntil: new Date(dto.validUntil),
        notes: dto.notes,
        currency: DEFAULT_CURRENCY,
        status: QuoteStatus.PENDING,
      },
    });

    // Update RFQ status to QUOTED
    await this.prisma.rfq.update({
      where: { id: dto.rfqId },
      data: { status: RFQStatus.QUOTED },
    });

    // Fetch details for notification
    const merchant = await this.prisma.merchantProfile.findUnique({
      where: { id: merchantId },
      select: { businessName: true },
    });

    const productName = rfq.productId
      ? (await this.prisma.product.findUnique({ where: { id: rfq.productId } }))
          ?.name || "Hardware Product"
      : (rfq.unlistedItemDetails as any)?.name || "Custom Hardware Item";

    await this.notifications.triggerQuoteReceived(rfq.buyerId, {
      quoteId: quote.id,
      merchantName: merchant?.businessName || "A Merchant",
      productName,
      totalPriceKobo: quote.totalPriceKobo,
    });

    return quote;
  }

  /**
   * CRITICAL: Quote acceptance is an atomic transaction.
   * All of the following must happen in ONE prisma.$transaction:
   * 1. Update quote → ACCEPTED (optimistic locking)
   * 2. Update RFQ → ACCEPTED
   * 3. Decline all other quotes for this RFQ
   * 4. Create Order (PENDING_PAYMENT)
   * 5. Create InventoryEvent (ORDER_RESERVED)
   * 6. Update ProductStockCache
   *
   * If any step fails, everything rolls back. No partial state.
   */
  async accept(buyerId: string, quoteId: string) {
    // Pre-flight validation (outside transaction for fast failure)
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: { rfq: true },
    });

    if (!quote) {
      throw new NotFoundException("Quote not found");
    }

    if (quote.rfq.buyerId !== buyerId) {
      throw new ForbiddenException("Access denied");
    }

    if (quote.status !== QuoteStatus.PENDING) {
      throw new BadRequestException("Quote is not pending");
    }

    // Check quote expiry
    if (new Date(quote.validUntil) < new Date()) {
      throw new BadRequestException("Quote has expired");
    }

    // Execute everything atomically
    const order = await this.prisma.$transaction(async (tx) => {
      // 1. Optimistic locking: update quote only if still PENDING
      const updated = await tx.quote.updateMany({
        where: { id: quoteId, status: QuoteStatus.PENDING },
        data: { status: QuoteStatus.ACCEPTED },
      });

      if (updated.count === 0) {
        throw new BadRequestException("Quote was already accepted or declined");
      }

      // 2. Update RFQ status → ACCEPTED
      await tx.rfq.update({
        where: { id: quote.rfqId },
        data: { status: RFQStatus.ACCEPTED },
      });

      // 3. Decline all other quotes for this RFQ
      await tx.quote.updateMany({
        where: { rfqId: quote.rfqId, id: { not: quoteId } },
        data: { status: QuoteStatus.DECLINED },
      });

      // 4. Create Order (PENDING_PAYMENT)
      const orderId = crypto.randomUUID();
      const idempotencyKey = `order-create-${quoteId}`;
      const totalAmount =
        quote.totalPriceKobo + (quote.deliveryFeeKobo ?? BigInt(0));

      const newOrder = await tx.order.create({
        data: {
          id: orderId,
          quoteId,
          buyerId,
          merchantId: quote.merchantId,
          totalAmountKobo: totalAmount,
          deliveryFeeKobo: quote.deliveryFeeKobo ?? BigInt(0),
          currency: quote.currency ?? DEFAULT_CURRENCY,
          status: OrderStatus.PENDING_PAYMENT,
          idempotencyKey,
        },
      });

      // 5 & 6. Only create Inventory Events if referencing an official catalogue product
      if (quote.rfq.productId) {
        // 5. Create InventoryEvent (ORDER_RESERVED)
        await tx.inventoryEvent.create({
          data: {
            productId: quote.rfq.productId,
            merchantId: quote.merchantId,
            eventType: InventoryEventType.ORDER_RESERVED,
            quantity: -quote.rfq.quantity,
            referenceId: newOrder.id,
            notes: "Order reservation",
          },
        });

        // 6. Update ProductStockCache
        await tx.productStockCache.upsert({
          where: { productId: quote.rfq.productId },
          update: { stock: { decrement: quote.rfq.quantity } },
          create: {
            productId: quote.rfq.productId,
            stock: -quote.rfq.quantity,
          },
        });
      }

      // 7. Create OrderEvent (audit trail)
      await tx.orderEvent.create({
        data: {
          orderId: newOrder.id,
          fromStatus: null as any,
          toStatus: OrderStatus.PENDING_PAYMENT,
          triggeredBy: buyerId,
          metadata: { action: "quote_accepted", quoteId },
        },
      });

      return newOrder;
    });

    // Notifications outside transaction (best-effort)
    // Fetch buyer name for merchant notification
    const buyer = await this.prisma.user.findUnique({
      where: { id: buyerId },
      select: { firstName: true, lastName: true },
    });

    await this.notifications.triggerQuoteAccepted(quote.merchantId, {
      quoteId,
      orderId: order.id,
      buyerName: buyer ? `${buyer.firstName} ${buyer.lastName}` : "A Buyer",
      amountKobo: order.totalAmountKobo,
    });

    return order;
  }

  async decline(buyerId: string, quoteId: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: { rfq: true },
    });

    if (!quote) {
      throw new NotFoundException("Quote not found");
    }

    if (quote.rfq.buyerId !== buyerId) {
      throw new ForbiddenException("Access denied");
    }

    // Only PENDING quotes can be declined
    if (quote.status !== QuoteStatus.PENDING) {
      throw new BadRequestException("Quote is not pending");
    }

    await this.prisma.quote.update({
      where: { id: quoteId },
      data: { status: QuoteStatus.DECLINED },
    });

    await this.notifications.triggerQuoteDeclined(quote.merchantId, quoteId);

    return { message: "Quote declined" };
  }

  async update(merchantId: string, quoteId: string, dto: any) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
    });

    if (!quote) {
      throw new NotFoundException("Quote not found");
    }

    if (quote.merchantId !== merchantId) {
      throw new ForbiddenException("Access denied");
    }

    if (quote.status !== QuoteStatus.PENDING) {
      throw new BadRequestException("Only pending quotes can be updated");
    }

    return this.prisma.quote.update({
      where: { id: quoteId },
      data: {
        unitPriceKobo: dto.unitPriceKobo,
        totalPriceKobo: dto.totalPriceKobo,
        deliveryFeeKobo: dto.deliveryFeeKobo,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        notes: dto.notes,
      },
    });
  }

  async getByRFQ(rfqId: string) {
    return this.prisma.quote.findMany({
      where: { rfqId },
      orderBy: { createdAt: "desc" },
      include: { merchantProfile: { select: { businessName: true } } },
    });
  }
}
