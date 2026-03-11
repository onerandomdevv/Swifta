import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
} from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { PaginatedResponse, Product } from "@hardware-os/shared";
import { paginate } from "../../common/utils/pagination";

@Injectable()
export class ProductService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(merchantId: string, dto: CreateProductDto) {
    const { pricePerUnitKobo, wholesalePriceKobo, retailPriceKobo, ...rest } =
      dto;
    const product = await this.prisma.product.create({
      data: {
        merchantId,
        pricePerUnitKobo: pricePerUnitKobo ? BigInt(pricePerUnitKobo) : null,
        wholesalePriceKobo: wholesalePriceKobo
          ? BigInt(wholesalePriceKobo)
          : null,
        retailPriceKobo: retailPriceKobo ? BigInt(retailPriceKobo) : null,
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
        where: { merchantId },
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
      };
    });

    return response;
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
    }));

    return response;
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
            },
          },
          productStockCache: true, // Needed to determine stockAvailability
        },
      },
    );

    // Map the response to include string-serialized values + stockAvailability
    response.data = response.data.map((product: any) => {
      const { productStockCache, ...rest } = product;

      let resolvedPrice = product.retailPriceKobo;
      if (buyerType === "BUSINESS") {
        resolvedPrice = product.wholesalePriceKobo || product.pricePerUnitKobo;
      } else {
        // For CONSUMER or GUEST, prefer retail, then wholesale, then legacy
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
        // we overwrite pricePerUnitKobo with the resolved price for compatibility
        pricePerUnitKobo: resolvedPrice ? resolvedPrice.toString() : null,
        wholesalePriceKobo: product.wholesalePriceKobo
          ? product.wholesalePriceKobo.toString()
          : null,
        retailPriceKobo: product.retailPriceKobo
          ? product.retailPriceKobo.toString()
          : null,
        stockAvailability,
      };
    });

    return response;
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
    };
  }

  async update(merchantId: string, productId: string, dto: UpdateProductDto) {
    await this.verifyProductOwnership(merchantId, productId);
    const { pricePerUnitKobo, wholesalePriceKobo, retailPriceKobo, ...rest } =
      dto;
    const updateData: any = { ...rest };
    if (pricePerUnitKobo !== undefined) {
      updateData.pricePerUnitKobo =
        pricePerUnitKobo === null ? null : BigInt(pricePerUnitKobo);
    }
    if (wholesalePriceKobo !== undefined) {
      updateData.wholesalePriceKobo =
        wholesalePriceKobo === null ? null : BigInt(wholesalePriceKobo);
    }
    if (retailPriceKobo !== undefined) {
      updateData.retailPriceKobo =
        retailPriceKobo === null ? null : BigInt(retailPriceKobo);
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
      data: { deletedAt: new Date() },
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
}
