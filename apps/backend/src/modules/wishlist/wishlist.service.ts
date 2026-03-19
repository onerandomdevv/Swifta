import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class WishlistService {
  private readonly logger = new Logger(WishlistService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Toggle a product in the user's wishlist.
   * If saved → remove. If not saved → add.
   */
  async toggle(userId: string, productId: string): Promise<{ saved: boolean }> {
    const existing = await this.prisma.savedProduct.findUnique({
      where: {
        userId_productId: { userId, productId },
      },
    });

    if (existing) {
      await this.prisma.savedProduct.delete({
        where: { id: existing.id },
      });
      return { saved: false };
    }

    await this.prisma.savedProduct.create({
      data: { userId, productId },
    });
    return { saved: true };
  }

  /**
   * Get all saved products for a user with full product + merchant data.
   */
  async findAll(userId: string) {
    const saved = await this.prisma.savedProduct.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          include: {
            merchantProfile: {
              select: {
                id: true,
                businessName: true,
                verificationTier: true,
                profileImage: true,
                averageRating: true,
                reviewCount: true,
              },
            },
            productStockCache: { select: { stock: true } },
            category: { select: { name: true, slug: true } },
          },
        },
      },
    });

    return saved.map((s) => ({
      ...s.product,
      savedAt: s.createdAt,
      stockCache: s.product.productStockCache,
      merchantProfile: s.product.merchantProfile,
    }));
  }

  /**
   * Check if a specific product is saved by the user.
   */
  async isSaved(
    userId: string,
    productId: string,
  ): Promise<{ saved: boolean }> {
    const existing = await this.prisma.savedProduct.findUnique({
      where: {
        userId_productId: { userId, productId },
      },
    });
    return { saved: !!existing };
  }

  /**
   * Get saved product IDs for a user (bulk check for the feed).
   */
  async getSavedIds(userId: string): Promise<string[]> {
    const saved = await this.prisma.savedProduct.findMany({
      where: { userId },
      select: { productId: true },
    });
    return saved.map((s) => s.productId);
  }
}
