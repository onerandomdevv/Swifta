import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
} from "@nestjs/common";
import { randomBytes } from "crypto";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import type { Cache } from "cache-manager";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { PaginatedResponse, Product } from "@swifta/shared";
import { paginate } from "../../common/utils/pagination";

@Injectable()
export class ProductService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(merchantId: string, dto: CreateProductDto) {
    const {
      pricePerUnitKobo,
      retailPriceKobo,
      wholesaleDiscountPercent,
      ...rest
    } = dto;

    // 1. Fetch the merchant's slug
    const merchant = await this.prisma.merchantProfile.findUnique({
      where: { id: merchantId },
      select: { slug: true },
    });

    if (!merchant) {
      throw new NotFoundException("Merchant profile not found");
    }

    // 2. Generate Product Code (Format: merchantSlug-productNameSlug-shortId)
    const baseNameSlug = dto.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 15);
    const shortId = randomBytes(3).toString("hex"); // 6 character hash
    const productCode = `${merchant.slug}-${baseNameSlug}-${shortId}`;

    // Auto-compute wholesale price from retail price and discount
    let computedWholesaleKobo: bigint | null = null;
    if (
      retailPriceKobo &&
      wholesaleDiscountPercent &&
      wholesaleDiscountPercent > 0
    ) {
      const retailBigInt = BigInt(retailPriceKobo);
      computedWholesaleKobo = BigInt(
        Math.round(Number(retailBigInt) * (1 - wholesaleDiscountPercent / 100)),
      );
    }

    const product = await this.prisma.product.create({
      data: {
        merchantId,
        productCode, // Inject the generated semantic ID
        pricePerUnitKobo: pricePerUnitKobo ? BigInt(pricePerUnitKobo) : null,
        retailPriceKobo: retailPriceKobo ? BigInt(retailPriceKobo) : null,
        wholesalePriceKobo: computedWholesaleKobo,
        wholesaleDiscountPercent: wholesaleDiscountPercent ?? null,
        ...rest,
      },
    });
    await this.invalidateCatalogueCache();
    return product;
  }

  async listByMerchant(
    merchantId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResponse<Product>> {
    const response = await paginate(
      this.prisma.product,
      { page, limit },
      {
        where: { merchantId, deletedAt: null },
        orderBy: { createdAt: "desc" },
        include: { productStockCache: true },
      },
    );

    // Mark soft-deleted products with a flag (for frontend convenience if needed)
    response.data = response.data.map((product: any) => {
      const { productStockCache, ...rest } = product;
      return {
        ...rest,
        stockCache: productStockCache,
        isDeleted: product.deletedAt !== null,
        pricePerUnitKobo: product.pricePerUnitKobo
          ? product.pricePerUnitKobo.toString()
          : null,
        wholesalePriceKobo: product.wholesalePriceKobo
          ? product.wholesalePriceKobo.toString()
          : null,
        retailPriceKobo: product.retailPriceKobo
          ? product.retailPriceKobo.toString()
          : null,
        wholesaleDiscountPercent: product.wholesaleDiscountPercent ?? null,
      };
    });

    return response as unknown as PaginatedResponse<Product>;
  }

  async listPublicByMerchant(
    merchantId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResponse<Product>> {
    const response = await paginate(
      this.prisma.product,
      { page, limit },
      {
        where: {
          merchantId,
          isActive: true,
          deletedAt: null,
        },
        orderBy: { createdAt: "desc" },
      },
    );

    response.data = response.data.map((product: any) => ({
      ...product,
      pricePerUnitKobo: product.pricePerUnitKobo
        ? product.pricePerUnitKobo.toString()
        : null,
      wholesalePriceKobo: product.wholesalePriceKobo
        ? product.wholesalePriceKobo.toString()
        : null,
      retailPriceKobo: product.retailPriceKobo
        ? product.retailPriceKobo.toString()
        : null,
      wholesaleDiscountPercent: product.wholesaleDiscountPercent ?? null,
    }));

    return response as unknown as PaginatedResponse<Product>;
  }


  async catalogue(
    search: string = "",
    category: string = "",
    page: number,
    limit: number,
    buyerType?: string,
  ): Promise<PaginatedResponse<Product>> {
    const where: any = {
      isActive: true,
      deletedAt: null,
    };

    if (category) {
      // Check if it's a UUID
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          category,
        );

      const foundCategory = await this.prisma.category.findFirst({
        where: isUuid
          ? { id: category, isActive: true }
          : { slug: category, isActive: true },
        include: {
          children: {
            where: { isActive: true },
            select: { id: true },
          },
        },
      });

      if (foundCategory) {
        const categoryIds = [
          foundCategory.id,
          ...foundCategory.children.map((c) => c.id),
        ];
        where.categoryId = { in: categoryIds };
      } else {
        // Fallback to legacy categoryTag
        where.categoryTag = category;
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        {
          merchantProfile: {
            businessName: { contains: search, mode: "insensitive" },
          },
        },
        { category: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const response = await paginate(
      this.prisma.product,
      { page, limit },
      {
        where,
        orderBy: { createdAt: "desc" },
        include: {
          merchantProfile: {
            select: {
              id: true,
              businessName: true,
              averageRating: true,
              reviewCount: true,
              verificationTier: true,
              profileImage: true,
              cacVerified: true,
              addressVerified: true,
              guarantorVerified: true,
              bankVerified: true,
              slug: true,
            },
          },
          productStockCache: true, // Needed to determine stockAvailability
        },
      },
    );

    // Map the response to include string-serialized values + stockAvailability
    response.data = response.data.map((product: any) =>
      this.mapProductForPublic(product, buyerType),
    );

    return response as unknown as PaginatedResponse<Product>;
  }

  async getSocialFeed(
    userId: string,
    page: number,
    limit: number,
    buyerType?: string,
  ): Promise<PaginatedResponse<Product>> {
    // 1. Get merchants the user follows
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { merchantId: true },
    });

    const followedMerchantIds = following.map((f) => f.merchantId);

    if (followedMerchantIds.length === 0) {
      return {
        success: true,
        data: [],
        meta: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      };
    }

    // 2. Fetch products from these merchants
    const response = await paginate(
      this.prisma.product,
      { page, limit },
      {
        where: {
          merchantId: { in: followedMerchantIds },
          isActive: true,
          deletedAt: null,
        },
        orderBy: { createdAt: "desc" },
        include: {
          merchantProfile: {
            select: {
              id: true,
              businessName: true,
              averageRating: true,
              reviewCount: true,
              verificationTier: true,
              profileImage: true,
              cacVerified: true,
              addressVerified: true,
              guarantorVerified: true,
              bankVerified: true,
              slug: true,
            },
          },
          productStockCache: true,
        },
      },
    );

    // 3. Map response
    response.data = response.data.map((product: any) =>
      this.mapProductForPublic(product, buyerType),
    );

    return response as unknown as PaginatedResponse<Product>;
  }

  async getById(id: string, buyerType?: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        merchantProfile: {
          select: {
            id: true,
            businessName: true,
            verificationTier: true,
            averageRating: true,
            reviewCount: true,
            profileImage: true,
            cacVerified: true,
            addressVerified: true,
            guarantorVerified: true,
            bankVerified: true,
          },
        },
      },
    });
    if (!product || product.deletedAt) {
      throw new NotFoundException("Product not found");
    }

    // Resolve price for single product view
    let resolvedPrice = product.retailPriceKobo;
    if (buyerType === "BUSINESS") {
      resolvedPrice = product.wholesalePriceKobo || product.pricePerUnitKobo;
    } else {
      resolvedPrice =
        product.retailPriceKobo ||
        product.wholesalePriceKobo ||
        product.pricePerUnitKobo;
    }

    return {
      ...product,
      pricePerUnitKobo: resolvedPrice ? resolvedPrice.toString() : null,
      wholesalePriceKobo: product.wholesalePriceKobo
        ? product.wholesalePriceKobo.toString()
        : null,
      retailPriceKobo: product.retailPriceKobo
        ? product.retailPriceKobo.toString()
        : null,
      wholesaleDiscountPercent: product.wholesaleDiscountPercent ?? null,
    };
  }

  async update(merchantId: string, productId: string, dto: UpdateProductDto) {
    await this.verifyProductOwnership(merchantId, productId);
    const {
      pricePerUnitKobo,
      retailPriceKobo,
      wholesaleDiscountPercent,
      wholesaleEnabled,
      ...rest
    } = dto;
    const updateData: any = { ...rest };

    if (pricePerUnitKobo !== undefined) {
      updateData.pricePerUnitKobo =
        pricePerUnitKobo === null ? null : BigInt(pricePerUnitKobo);
    }
    if (retailPriceKobo !== undefined) {
      updateData.retailPriceKobo =
        retailPriceKobo === null ? null : BigInt(retailPriceKobo);
    }

    // Handle wholesale toggle
    if (wholesaleEnabled === false) {
      // Wholesale toggled OFF — clear all wholesale data
      updateData.wholesalePriceKobo = null;
      updateData.wholesaleDiscountPercent = null;
    } else if (
      wholesaleDiscountPercent !== undefined &&
      wholesaleDiscountPercent > 0
    ) {
      // Wholesale ON with a discount — compute wholesale price
      // Use the new retail price if provided, otherwise fetch the existing one
      let retailValue: bigint;
      if (retailPriceKobo) {
        retailValue = BigInt(retailPriceKobo);
      } else {
        const existing = await this.prisma.product.findUnique({
          where: { id: productId },
          select: { retailPriceKobo: true },
        });
        retailValue = existing?.retailPriceKobo ?? BigInt(0);
      }

      updateData.wholesaleDiscountPercent = wholesaleDiscountPercent;
      updateData.wholesalePriceKobo = BigInt(
        Math.round(Number(retailValue) * (1 - wholesaleDiscountPercent / 100)),
      );
    }

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: updateData,
    });
    await this.invalidateCatalogueCache();
    return updated;
  }

  async softDelete(merchantId: string, productId: string) {
    await this.verifyProductOwnership(merchantId, productId);
    const deleted = await this.prisma.product.update({
      where: { id: productId },
      data: { deletedAt: new Date(), isActive: false },
    });
    await this.invalidateCatalogueCache();
    return deleted;
  }

  async restore(merchantId: string, productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException("Product not found");
    if (product.merchantId !== merchantId) {
      throw new ForbiddenException("Access denied");
    }
    const restored = await this.prisma.product.update({
      where: { id: productId },
      data: { deletedAt: null },
    });
    await this.invalidateCatalogueCache();
    return restored;
  }

  async validateProductAvailability(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || product.deletedAt) {
      throw new NotFoundException("Product not found");
    }

    if (!product.isActive) {
      throw new BadRequestException("Product is not currently active");
    }

    return product;
  }

  private async verifyProductOwnership(merchantId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, merchantId },
    });
    if (!product) {
      throw new NotFoundException("Product not found");
    }
    if (product.deletedAt) {
      throw new NotFoundException("Product has been deleted");
    }
  }

  private async invalidateCatalogueCache() {
    try {
      // Clear out all keys starting with /products to purge all paginated endpoints
      const keys: string[] = await (this.cacheManager as any).store.keys(
        "/products*",
      );
      if (keys && keys.length > 0) {
        await Promise.all(keys.map((k) => this.cacheManager.del(k)));
      }
    } catch (e) {
      // In case underlying store lacks `.keys()` or errors, safely fallback to full reset
      await this.cacheManager.clear();
    }
  }

  async getAssociations(category: string) {
    return this.prisma.productAssociation.findMany({
      where: { productCategoryA: category },
      orderBy: { strength: "desc" },
      select: {
        productCategoryB: true,
        strength: true,
        promptText: true,
      },
    });
  }

  private mapProductForPublic(product: any, buyerType?: string) {
    const { productStockCache, ...rest } = product;

    let resolvedPrice = product.retailPriceKobo;
    if (buyerType === "BUSINESS") {
      resolvedPrice = product.wholesalePriceKobo || product.pricePerUnitKobo;
    } else {
      resolvedPrice =
        product.retailPriceKobo ||
        product.wholesalePriceKobo ||
        product.pricePerUnitKobo;
    }

    let stockAvailability = "OUT_OF_STOCK";
    if (productStockCache?.currentStock > 10) {
      stockAvailability = "IN_STOCK";
    } else if (
      productStockCache?.currentStock > 0 &&
      productStockCache?.currentStock <= 10
    ) {
      stockAvailability = "LOW_STOCK";
    }

    return {
      ...rest,
      pricePerUnitKobo: resolvedPrice ? resolvedPrice.toString() : null,
      wholesalePriceKobo: product.wholesalePriceKobo
        ? product.wholesalePriceKobo.toString()
        : null,
      retailPriceKobo: product.retailPriceKobo
        ? product.retailPriceKobo.toString()
        : null,
      stockAvailability,
    };
  }
}
