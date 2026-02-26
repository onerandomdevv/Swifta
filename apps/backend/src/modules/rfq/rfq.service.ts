import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { NotificationTriggerService } from "../notification/notification-trigger.service";
import { CreateRFQDto } from "./dto/create-rfq.dto";
import { ProductService } from "../product/product.service";
import {
  RFQStatus,
  RFQ_EXPIRY_HOURS,
  PaginatedResponse,
  RFQ,
} from "@hardware-os/shared";
import { paginate } from "../../common/utils/pagination";

@Injectable()
export class RFQService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationTriggerService,
    private productService: ProductService,
  ) {}

  async create(buyerId: string, dto: CreateRFQDto) {
    let merchantId = dto.targetMerchantId;

    if (dto.productId) {
      // Standard RFQ: Validate product and get merchantId
      const product = await this.productService.validateProductAvailability(
        dto.productId,
      );
      merchantId = product.merchantId;
    } else {
      // Custom RFQ: Must have targetMerchantId and unlistedItemDetails
      if (!merchantId) {
        throw new BadRequestException(
          "targetMerchantId is required for custom requests",
        );
      }
      if (!dto.unlistedItemDetails) {
        throw new BadRequestException(
          "unlistedItemDetails is required for custom requests",
        );
      }

      // Verify the target merchant actually exists
      const merchant = await this.prisma.merchantProfile.findUnique({
        where: { id: merchantId },
      });
      if (!merchant) {
        throw new NotFoundException("Target merchant not found");
      }
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + RFQ_EXPIRY_HOURS);

    const rfq = await this.prisma.rfq.create({
      data: {
        user: { connect: { id: buyerId } },
        merchantProfile: { connect: { id: merchantId } },
        product: dto.productId ? { connect: { id: dto.productId } } : undefined,
        quantity: dto.quantity,
        deliveryAddress: dto.deliveryAddress,
        notes: dto.notes,
        expiresAt,
        unlistedItemDetails: dto.unlistedItemDetails
          ? (dto.unlistedItemDetails as any)
          : null,
      },
    });

    await this.notifications.triggerNewRFQ(merchantId, rfq.id);

    return rfq;
  }

  async listByBuyer(
    buyerId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResponse<RFQ>> {
    return paginate(
      this.prisma.rfq,
      { page, limit },
      {
        where: { buyerId: buyerId },
        orderBy: { createdAt: "desc" },
        include: {
          product: { select: { name: true, unit: true } },
          quotes: true,
          merchantProfile: { select: { businessName: true } },
        },
      },
    );
  }

  async listByMerchant(
    merchantId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResponse<RFQ>> {
    return paginate(
      this.prisma.rfq,
      { page, limit },
      {
        where: { merchantId },
        orderBy: { createdAt: "desc" },
        include: {
          product: { select: { name: true, unit: true } },
          user: { select: { firstName: true, lastName: true } },
        },
      },
    );
  }

  async getById(id: string, userId?: string, merchantId?: string) {
    const rfq = await this.prisma.rfq.findUnique({
      where: { id },
      include: { product: true, quotes: true, merchantProfile: true },
    });

    if (!rfq) {
      throw new NotFoundException("RFQ not found");
    }

    // Access control: buyer can see own RFQs, merchant can see RFQs addressed to them
    if (merchantId) {
      if (rfq.merchantId !== merchantId) {
        throw new ForbiddenException("Access denied");
      }
    } else if (userId) {
      if (rfq.buyerId !== userId) {
        throw new ForbiddenException("Access denied");
      }
    }

    return rfq;
  }

  async cancel(buyerId: string, rfqId: string) {
    const rfq = await this.prisma.rfq.findUnique({ where: { id: rfqId } });

    if (!rfq) {
      throw new NotFoundException("RFQ not found");
    }

    if (rfq.buyerId !== buyerId) {
      throw new ForbiddenException("Access denied");
    }

    if (rfq.status !== RFQStatus.OPEN) {
      throw new BadRequestException("Only OPEN RFQs can be cancelled");
    }

    return this.prisma.rfq.update({
      where: { id: rfqId },
      data: { status: RFQStatus.CANCELLED },
    });
  }

  async update(
    buyerId: string,
    rfqId: string,
    dto: import("./dto/update-rfq.dto").UpdateRFQDto,
  ) {
    const rfq = await this.prisma.rfq.findUnique({ where: { id: rfqId } });

    if (!rfq) throw new NotFoundException("RFQ not found");
    if (rfq.buyerId !== buyerId) throw new ForbiddenException("Access denied");

    if (rfq.status !== RFQStatus.OPEN) {
      throw new BadRequestException("Only OPEN RFQs can be edited");
    }

    return this.prisma.rfq.update({
      where: { id: rfqId },
      data: {
        quantity: dto.quantity,
        deliveryAddress: dto.deliveryAddress,
        notes: dto.notes,
      },
    });
  }

  async delete(buyerId: string, rfqId: string) {
    const rfq = await this.prisma.rfq.findUnique({ where: { id: rfqId } });

    if (!rfq) throw new NotFoundException("RFQ not found");
    if (rfq.buyerId !== buyerId) throw new ForbiddenException("Access denied");

    if (rfq.status !== RFQStatus.OPEN && rfq.status !== RFQStatus.CANCELLED) {
      throw new BadRequestException(
        "Cannot delete an RFQ that is already in progress or completed",
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Delete associated quotes first
      await tx.quote.deleteMany({ where: { rfqId } });
      // Delete the RFQ
      await tx.rfq.delete({ where: { id: rfqId } });
      return { success: true, message: "RFQ deleted completely" };
    });
  }

  async expireStaleRFQs(): Promise<string[]> {
    const now = new Date();

    // Find stale RFQs first (to get buyer IDs for notifications)
    const staleRFQs = await this.prisma.rfq.findMany({
      where: {
        status: RFQStatus.OPEN,
        expiresAt: { lt: now },
      },
      select: { id: true, buyerId: true },
    });

    if (staleRFQs.length === 0) return [];

    // Bulk update to EXPIRED
    await this.prisma.rfq.updateMany({
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
