import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { InventoryEventType } from "@twizrr/shared";

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async reserveStock(
    productId: string,
    merchantId: string,
    quantity: number,
    orderId: string,
  ) {
    await this.createEvent(
      productId,
      merchantId,
      InventoryEventType.ORDER_RESERVED,
      -quantity,
      orderId,
      "Order reservation",
    );
  }

  async releaseStock(
    productId: string,
    merchantId: string,
    quantity: number,
    orderId: string,
  ) {
    await this.createEvent(
      productId,
      merchantId,
      InventoryEventType.ORDER_RELEASED,
      quantity,
      orderId,
      "Order cancellation release",
    );
  }

  async releaseStockBatch(
    items: { productId: string; quantity: number }[],
    merchantId: string,
    orderId: string,
  ) {
    await this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        // 1. Record event
        await tx.inventoryEvent.create({
          data: {
            productId: item.productId,
            merchantId,
            eventType: InventoryEventType.ORDER_RELEASED,
            quantity: item.quantity,
            referenceId: orderId,
            notes: "Order cancellation release (batch)",
          },
        });

        // 2. Update stock cache atomically
        await tx.productStockCache.upsert({
          where: { productId: item.productId },
          create: { productId: item.productId, stock: item.quantity },
          update: { stock: { increment: item.quantity } },
        });
      }
    });
  }

  async manualAdjustment(
    merchantId: string,
    productId: string,
    quantity: number,
    notes?: string,
  ) {
    // Verify product ownership
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException("Product not found");
    if (product.merchantId !== merchantId)
      throw new ForbiddenException("Access denied");

    const type =
      quantity > 0 ? InventoryEventType.STOCK_IN : InventoryEventType.STOCK_OUT;

    await this.createEvent(
      productId,
      merchantId,
      type,
      quantity,
      null,
      notes || "Manual adjustment",
    );

    return { message: "Stock adjusted" };
  }

  async getStockLevel(merchantId: string, productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException("Product not found");
    if (product.merchantId !== merchantId)
      throw new ForbiddenException("Access denied");

    const cache = await this.prisma.productStockCache.findUnique({
      where: { productId },
    });

    return {
      productId,
      stock: cache?.stock ?? 0,
      updatedAt: cache?.updatedAt ?? null,
    };
  }

  async getHistory(
    merchantId: string,
    productId: string,
    page: number,
    limit: number,
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException("Product not found");
    if (product.merchantId !== merchantId)
      throw new ForbiddenException("Access denied");

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.inventoryEvent.findMany({
        where: { productId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.inventoryEvent.count({ where: { productId } }),
    ]);

    return { data, meta: { page, limit, total } };
  }

  /**
   * Atomic: creates inventory event + updates stock cache in one transaction.
   * This is the single source of truth for all stock changes.
   */
  private async createEvent(
    productId: string,
    merchantId: string,
    eventType: InventoryEventType,
    quantity: number,
    referenceId: string | null,
    notes: string,
  ) {
    await this.prisma.$transaction(async (tx) => {
      // 1. Record event
      await tx.inventoryEvent.create({
        data: {
          productId,
          merchantId,
          eventType,
          quantity,
          referenceId,
          notes,
        },
      });

      // 2. Update stock cache atomically
      await tx.productStockCache.upsert({
        where: { productId },
        create: { productId, stock: quantity },
        update: { stock: { increment: quantity } },
      });
    });
  }
}
