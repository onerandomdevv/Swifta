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
      try {
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

        // Check for TRUSTED tier upgrade (inside transaction)
        try {
          await this.evaluateTrustedTierInternal(merchantId, tx);
        } catch (tierErr) {
          this.logger.error(
            `Failed to evaluate trusted tier for merchant ${merchantId}`,
            tierErr,
          );
        }

        return newReview;
      } catch (error) {
        if ((error as any).code === "P2002") {
          throw new ConflictException("This order has already been reviewed");
        }
        throw error;
      }
    });

    return review;
  }

  async updateComment(orderId: string, comment: string) {
    const review = await this.prisma.review.findUnique({
      where: { orderId },
    });
    if (!review) throw new NotFoundException("Review not found for this order");

    return this.prisma.review.update({
      where: { orderId },
      data: { comment },
    });
  }

  async findByMerchant(merchantId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const reviews = await this.prisma.review.findMany({
      where: { merchantId },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
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
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      buyerName: r.buyer?.user?.firstName || "Buyer",
    }));
  }

  async findByOrder(orderId: string) {
    return this.prisma.review.findUnique({
      where: { orderId },
    });
  }

  private async evaluateTrustedTier(merchantId: string) {
    return this.evaluateTrustedTierInternal(merchantId, this.prisma as any);
  }

  private async evaluateTrustedTierInternal(merchantId: string, tx: any) {
    const merchant = await tx.merchantProfile.findUnique({
      where: { id: merchantId },
      include: {
        _count: {
          select: { orders: { where: { status: OrderStatus.COMPLETED } } },
        },
      },
    });

    if (!merchant) return;

    // Criteria: 10+ completed orders, 30+ days since creation, 4.5+ average rating
    const completedOrders = merchant._count.orders;
    const daysSinceCreation =
      (new Date().getTime() - merchant.createdAt.getTime()) /
      (1000 * 60 * 60 * 24);
    const avgRating = merchant.averageRating || 0;

    if (completedOrders >= 10 && daysSinceCreation >= 30 && avgRating >= 4.5) {
      if (merchant.verificationTier !== VerificationTier.TRUSTED) {
        await tx.merchantProfile.update({
          where: { id: merchantId },
          data: { verificationTier: VerificationTier.TRUSTED },
        });
        this.logger.log(`Merchant ${merchantId} upgraded to TRUSTED tier`);
      }
    }
  }
}
