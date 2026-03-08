import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateReviewDto } from "./dto/create-review.dto";
import { OrderStatus, VerificationTier } from "@hardware-os/shared";

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);

  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateReviewDto) {
    const { orderId, rating, comment } = dto;

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { review: true },
    });

    if (!order) throw new NotFoundException("Order not found");
    if (order.buyerId !== userId)
      throw new ForbiddenException("You did not place this order");
    if (
      order.status !== OrderStatus.COMPLETED &&
      order.status !== OrderStatus.DELIVERED
    ) {
      throw new BadRequestException(
        "Orders can only be reviewed after delivery",
      );
    }
    if (order.review)
      throw new ConflictException("This order has already been reviewed");

    const merchantId = order.merchantId;
    if (!merchantId) throw new BadRequestException("Order has no merchant");

    // Get buyer profile
    const buyerProfile = await this.prisma.buyerProfile.findUnique({
      where: { userId },
    });
    if (!buyerProfile) throw new BadRequestException("Buyer profile not found");

    const review = await this.prisma.$transaction(async (tx) => {
      const newReview = await tx.review.create({
        data: {
          orderId,
          buyerId: buyerProfile.userId, // Review model links to buyer via buyerId (User relations)
          merchantId,
          rating,
          comment,
        },
      });

      // Recalculate merchant ratings
      const reviews = await tx.review.findMany({
        where: { merchantId },
        select: { rating: true },
      });

      const reviewCount = reviews.length;
      const totalStars = reviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = totalStars / reviewCount;

      await tx.merchantProfile.update({
        where: { id: merchantId },
        data: {
          reviewCount,
          averageRating,
        },
      });

      return newReview;
    });

    // Check for TRUSTED tier upgrade
    await this.evaluateTrustedTier(merchantId);

    return review;
  }

  async findByMerchant(merchantId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const reviews = await this.prisma.review.findMany({
      where: { merchantId },
      include: {
        buyer: {
          select: {
            user: {
              select: {
                firstName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    return reviews.map((r) => ({
      ...r,
      buyerName: r.buyer?.user?.firstName || "Buyer",
    }));
  }

  async findByOrder(orderId: string) {
    return this.prisma.review.findUnique({
      where: { orderId },
    });
  }

  private async evaluateTrustedTier(merchantId: string) {
    const merchant = await this.prisma.merchantProfile.findUnique({
      where: { id: merchantId },
      include: {
        _count: {
          select: { orders: { where: { status: OrderStatus.COMPLETED } } },
        },
      },
    });

    if (!merchant) return;

    // Criteria: 50+ completed orders, 6+ months since creation, 4.0+ average rating
    const completedOrders = merchant._count.orders;
    const monthsSinceCreation =
      (new Date().getTime() - merchant.createdAt.getTime()) /
      (1000 * 60 * 60 * 24 * 30);
    const avgRating = merchant.averageRating || 0;

    if (completedOrders >= 50 && monthsSinceCreation >= 6 && avgRating >= 4.0) {
      if (merchant.verificationTier !== VerificationTier.TRUSTED) {
        await this.prisma.merchantProfile.update({
          where: { id: merchantId },
          data: { verificationTier: VerificationTier.TRUSTED },
        });
        this.logger.log(`Merchant ${merchantId} upgraded to TRUSTED tier`);
      }
    }
  }
}
