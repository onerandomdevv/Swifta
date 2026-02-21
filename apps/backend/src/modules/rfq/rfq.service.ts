import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationTriggerService } from '../notification/notification-trigger.service';
import { CreateRFQDto } from './dto/create-rfq.dto';
import { ProductService } from '../product/product.service';
import { RFQStatus, RFQ_EXPIRY_HOURS, PaginatedResponse, RFQ } from '@hardware-os/shared';
import { paginate } from '../../common/utils/pagination';

@Injectable()
export class RFQService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationTriggerService,
    private productService: ProductService,
  ) {}

  async create(buyerId: string, dto: CreateRFQDto) {
    // Use unified validation from ProductService
    const product = await this.productService.validateProductAvailability(dto.productId);

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

    await this.notifications.triggerNewRFQ(product.merchantId, rfq.id);

    return rfq;
  }

  async listByBuyer(buyerId: string, page: number, limit: number): Promise<PaginatedResponse<RFQ>> {
    return paginate(this.prisma.rFQ, { page, limit }, {
      where: { buyerId },
      orderBy: { createdAt: 'desc' },
      include: {
        product: true,
        quotes: true,
        merchant: { select: { businessName: true } },
      },
    });
  }

  async listByMerchant(merchantId: string, page: number, limit: number): Promise<PaginatedResponse<RFQ>> {
    return paginate(this.prisma.rFQ, { page, limit }, {
      where: { merchantId },
      orderBy: { createdAt: 'desc' },
      include: {
        product: true,
        buyer: { select: { email: true, phone: true } },
      },
    });
  }

  async getById(id: string, userId?: string, merchantId?: string) {
    const rfq = await this.prisma.rFQ.findUnique({
      where: { id },
      include: { product: true, quotes: true },
    });

    if (!rfq) {
      throw new NotFoundException('RFQ not found');
    }

    // Access control: buyer can see own RFQs, merchant can see RFQs addressed to them
    if (userId && merchantId) {
      // Merchant — check merchantId
      if (rfq.merchantId !== merchantId) {
        throw new ForbiddenException('Access denied');
      }
    } else if (userId) {
      // Buyer — check buyerId
      if (rfq.buyerId !== userId) {
        throw new ForbiddenException('Access denied');
      }
    }

    return rfq;
  }

  async cancel(buyerId: string, rfqId: string) {
    const rfq = await this.prisma.rFQ.findUnique({ where: { id: rfqId } });

    if (!rfq) {
      throw new NotFoundException('RFQ not found');
    }

    if (rfq.buyerId !== buyerId) {
      throw new ForbiddenException('Access denied');
    }

    if (rfq.status !== RFQStatus.OPEN) {
      throw new BadRequestException(
        'Only OPEN RFQs can be cancelled',
      );
    }

    return this.prisma.rFQ.update({
      where: { id: rfqId },
      data: { status: RFQStatus.CANCELLED },
    });
  }

  async expireStaleRFQs(): Promise<string[]> {
    const now = new Date();

    // Find stale RFQs first (to get buyer IDs for notifications)
    const staleRFQs = await this.prisma.rFQ.findMany({
      where: {
        status: RFQStatus.OPEN,
        expiresAt: { lt: now },
      },
      select: { id: true, buyerId: true },
    });

    if (staleRFQs.length === 0) return [];

    // Bulk update to EXPIRED
    await this.prisma.rFQ.updateMany({
      where: {
        status: RFQStatus.OPEN,
        expiresAt: { lt: now },
      },
      data: { status: RFQStatus.EXPIRED },
    });

    // Return buyer IDs for notification triggers
    return staleRFQs.map((rfq) => rfq.buyerId);
  }
}
