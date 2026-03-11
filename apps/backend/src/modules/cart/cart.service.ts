import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AddToCartDto } from "./dto/add-to-cart.dto";
import { UpdateCartItemDto } from "./dto/update-cart-item.dto";
import { PriceType } from "@hardware-os/shared";

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(buyerId: string) {
    const items = await this.prisma.cartItem.findMany({
      where: { buyerId },
      include: {
        product: {
          include: {
            merchantProfile: {
              select: {
                businessName: true,
                verificationTier: true,
                businessAddress: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let subtotalKobo = BigInt(0);
    const cartObj = items.map((item) => {
      // Calculate based on the item's saved priceType
      const isWholesale = item.priceType === PriceType.WHOLESALE;
      const priceKobo = isWholesale
        ? (item.product.wholesalePriceKobo ??
          item.product.pricePerUnitKobo ??
          BigInt(0))
        : (item.product.retailPriceKobo ??
          item.product.pricePerUnitKobo ??
          BigInt(0));

      const itemTotalKobo = priceKobo * BigInt(item.quantity);
      subtotalKobo += itemTotalKobo;

      return {
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        priceType: item.priceType,
        product: {
          name: item.product.name,
          imageUrl: item.product.imageUrl,
          priceKobo: priceKobo.toString(),
          merchantName:
            item.product.merchantProfile?.businessName || "Unknown Merchant",
          merchantId: item.product.merchantId,
          merchantTier: item.product.merchantProfile?.verificationTier,
          merchantAddress: item.product.merchantProfile?.businessAddress,
          unit: item.product.unit,

          minOrderQuantity: item.product.minOrderQuantity,
          minOrderQuantityConsumer: item.product.minOrderQuantityConsumer,
        },

        itemTotalKobo: itemTotalKobo.toString(),
      };
    });

    return {
      items: cartObj,
      subtotalKobo: subtotalKobo.toString(),
    };
  }

  async addItemToCart(buyerId: string, dto: AddToCartDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId, isActive: true, deletedAt: null },
    });

    if (!product) {
      throw new NotFoundException("Product not found or unavailable");
    }

    const priceType = dto.priceType || PriceType.RETAIL;
    const minQty =
      priceType === PriceType.WHOLESALE
        ? product.minOrderQuantity
        : product.minOrderQuantityConsumer;

    if (dto.quantity < minQty) {
      throw new BadRequestException(
        `Minimum order quantity for ${priceType} is ${minQty}`,
      );
    }

    // Upsert the cart item: if it exists for this SPECIFIC priceType, add quantity
    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        buyerId_productId_priceType: {
          buyerId,
          productId: dto.productId,
          priceType,
        },
      },
    });

    if (existingItem) {
      const newQty = existingItem.quantity + dto.quantity;
      return this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQty,
        },
      });
    }

    return this.prisma.cartItem.create({
      data: {
        buyerId,
        productId: dto.productId,
        quantity: dto.quantity,
        priceType,
      },
    });
  }

  async updateItemQuantity(
    buyerId: string,
    itemId: string,
    dto: UpdateCartItemDto,
  ) {
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, buyerId },
      include: { product: true },
    });

    if (!item) {
      throw new NotFoundException("Cart item not found");
    }

    const minQty =
      item.priceType === PriceType.WHOLESALE
        ? item.product.minOrderQuantity
        : item.product.minOrderQuantityConsumer;

    if (dto.quantity < minQty) {
      throw new BadRequestException(
        `Minimum order quantity for ${item.priceType} is ${minQty}`,
      );
    }

    return this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: dto.quantity },
    });
  }

  async removeItemFromCart(buyerId: string, itemId: string) {
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, buyerId },
    });

    if (!item) {
      throw new NotFoundException("Cart item not found");
    }

    await this.prisma.cartItem.delete({
      where: { id: itemId },
    });

    return { success: true };
  }

  async clearCart(buyerId: string) {
    await this.prisma.cartItem.deleteMany({
      where: { buyerId },
    });

    return { success: true };
  }
}
