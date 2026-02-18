import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationTriggerService } from '../notification/notification-trigger.service';
import { CreateRFQDto } from './dto/create-rfq.dto';
import { RFQStatus, RFQ_EXPIRY_HOURS } from '@hardware-os/shared';

@Injectable()
export class RFQService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationTriggerService
  ) {}

  async create(buyerId: string, dto: CreateRFQDto) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('Product not found');

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + RFQ_EXPIRY_HOURS);

    const rfq = await this.prisma.rFQ.create({
      data: {
        buyerId,
        merchantId: product.merchantId,
        productId: dto.productId,
        quantity: dto.quantity,
        deliveryAddress: dto.deliveryAddress,
        notes: dto.notes,
        expiresAt,
      },
    });

    // Simplify notification trigger for now to avoid circular dependency issues if any
    // In real app, we'd trigger notifications here
    await this.notifications.triggerNewRFQ(product.merchantId, rfq.id);

    return rfq;
  }

  async listByBuyer(buyerId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.rFQ.findMany({
        where: { buyerId },
        skip,
        take: +limit,
        orderBy: { createdAt: 'desc' },
        include: { product: true, quotes: true }
      }),
      this.prisma.rFQ.count({ where: { buyerId } })
    ]);
    return { data, meta: { page, limit, total } };
  }

  async listByMerchant(merchantId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.rFQ.findMany({
        where: { merchantId },
        skip,
        take: +limit,
        orderBy: { createdAt: 'desc' },
        include: { product: true, buyer: { select: { email: true, phone: true } } }
      }),
      this.prisma.rFQ.count({ where: { merchantId } })
    ]);
    return { data, meta: { page, limit, total } };
  }

  async getById(id: string) {
    const rfq = await this.prisma.rFQ.findUnique({
      where: { id },
      include: { product: true, quotes: true }
    });
    if (!rfq) throw new NotFoundException('RFQ not found');
    return rfq;
  }

  async cancel(buyerId: string, rfqId: string) {
    const rfq = await this.prisma.rFQ.findUnique({ where: { id: rfqId } });
    if (!rfq) throw new NotFoundException('RFQ not found');
    if (rfq.buyerId !== buyerId) throw new ForbiddenException('Access denied');

    return this.prisma.rFQ.update({
      where: { id: rfqId },
      data: { status: RFQStatus.CANCELLED }
    });
  }

  async expireStaleRFQs() {
    const now = new Date();
    await this.prisma.rFQ.updateMany({
      where: {
        status: RFQStatus.OPEN,
        expiresAt: { lt: now }
      },
      data: { status: RFQStatus.EXPIRED }
    });
    // Triggers would be handled appropriately in a real job
  }
}
