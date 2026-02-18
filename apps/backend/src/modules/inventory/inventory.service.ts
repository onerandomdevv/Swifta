import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryEventType } from '@hardware-os/shared';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async reserveStock(productId: string, merchantId: string, quantity: number, orderId: string) {
      await this.createEvent(productId, merchantId, InventoryEventType.ORDER_RESERVED, -quantity, orderId, 'Order reservation');
  }

  async releaseStock(productId: string, merchantId: string, quantity: number, orderId: string) {
      await this.createEvent(productId, merchantId, InventoryEventType.ORDER_RELEASED, quantity, orderId, 'Order cancellation release');
  }

  async manualAdjustment(merchantId: string, productId: string, quantity: number, notes?: string) {
      const type = quantity > 0 ? InventoryEventType.STOCK_IN : InventoryEventType.STOCK_OUT;
      await this.createEvent(productId, merchantId, type, quantity, null, notes || 'Manual adjustment');
      return { message: 'Stock adjusted' };
  }

  async getHistory(merchantId: string, productId: string, page: number, limit: number) {
       const product = await this.prisma.product.findUnique({ where: { id: productId } });
       if (!product) throw new NotFoundException('Product not found');
       if (product.merchantId !== merchantId) throw new ForbiddenException('Access denied');

       const skip = (page - 1) * limit;
       const [data, total] = await Promise.all([
           this.prisma.inventoryEvent.findMany({
               where: { productId },
               skip,
               take: +limit,
               orderBy: { createdAt: 'desc' }
           }),
           this.prisma.inventoryEvent.count({ where: { productId } })
       ]);
       return { data, meta: { page, limit, total } };
  }

  private async createEvent(
      productId: string, 
      merchantId: string, 
      eventType: InventoryEventType, 
      quantity: number, 
      referenceId: string | null, 
      notes: string
    ) {
        // Record event
        await this.prisma.inventoryEvent.create({
            data: {
                productId,
                merchantId,
                eventType,
                quantity,
                referenceId,
                notes
            }
        });

        // Update cache
        await this.updateStockCache(productId, quantity);
  }

  private async updateStockCache(productId: string, delta: number) {
      await this.prisma.productStockCache.upsert({
          where: { productId },
          create: { productId, stock: delta },
          update: { stock: { increment: delta } }
      });
  }
}
