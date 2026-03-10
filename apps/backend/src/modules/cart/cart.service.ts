import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AddToCartDto } from "./dto/add-to-cart.dto";
import { UpdateCartItemDto } from "./dto/update-cart-item.dto";

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
              select: { businessName: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let subtotalKobo = BigInt(0);
    const cartObj = items.map((item) => {
      // Calculate taking the lowest available price between retail/wholesale fallback
      const priceKobo =
        item.product.retailPriceKobo ??
        item.product.wholesalePriceKobo ??
        item.product.pricePerUnitKobo ??
        BigInt(0);
      const itemTotalKobo = priceKobo * BigInt(item.quantity);
      subtotalKobo += itemTotalKobo;

      return {
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        product: {
          name: item.product.name,
          imageUrl: item.product.imageUrl,
          priceKobo: priceKobo.toString(),
          merchantName:
            item.product.merchantProfile?.businessName || "Unknown Merchant",
          merchantId: item.product.merchantId,
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

    // Upsert the cart item: if it exists, add quantity, otherwise create
    const existingItem = await this.prisma.cartItem.findUnique({
      where: { buyerId_productId: { buyerId, productId: dto.productId } },
    });

    if (existingItem) {
      return this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + dto.quantity },
      });
    }

    return this.prisma.cartItem.create({
      data: {
        buyerId,
        productId: dto.productId,
        quantity: dto.quantity,
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
    });

    if (!item) {
      throw new NotFoundException("Cart item not found");
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
