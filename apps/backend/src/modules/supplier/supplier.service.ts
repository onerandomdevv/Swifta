import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateSupplierProductDto } from "./dto/create-supplier-product.dto";
import { UpdateSupplierProductDto } from "./dto/update-supplier-product.dto";
import { CreateWholesaleOrderDto } from "./dto/create-wholesale-order.dto";
import { OrderStatus } from "@swifta/shared";
import { PaymentService } from "../payment/payment.service";
import { WhatsAppService } from "../whatsapp/whatsapp.service";

@Injectable()
export class SupplierService {
  private readonly logger = new Logger(SupplierService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => PaymentService))
    private paymentService: PaymentService,
    @Inject(forwardRef(() => WhatsAppService))
    private whatsappService: WhatsAppService,
  ) {}

  private async findMerchantCategories(merchantId: string): Promise<string[]> {
    const products = await this.prisma.product.findMany({
      where: { merchantId, isActive: true, deletedAt: null },
      select: { categoryTag: true },
      distinct: ["categoryTag"],
    });
    return products.map((p) => p.categoryTag);
  }

  async getRecommendedCatalogue(
    merchantId: string,
    page: number = 1,
    limit: number = 50,
  ) {
    const merchantCategories = (
      await this.findMerchantCategories(merchantId)
    ).map((c) => c.trim().toLowerCase());

    // Get all active supplier products (with pagination)
    const allProducts = await this.prisma.supplierProduct.findMany({
      where: {
        isActive: true,
        supplier: { isVerified: true },
      },
      include: {
        supplier: {
          select: { companyName: true, isVerified: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
    });

    // Map and Sort: Recommended (matching categories) first
    return allProducts
      .map((p) => {
        const isMatch = merchantCategories.includes(
          p.category.trim().toLowerCase(),
        );
        return { ...p, isRecommended: isMatch };
      })
      .sort((a, b) => {
        if (a.isRecommended && !b.isRecommended) return -1;
        if (!a.isRecommended && b.isRecommended) return 1;
        return 0; // maintain default order (createdAt desc from query)
      });
  }

  async getProfile(userId: string) {
    const profile = await this.prisma.supplierProfile.findUnique({
      where: { userId },
      include: { products: true, user: true },
    });
    if (!profile) throw new NotFoundException("Supplier profile not found");
    return profile;
  }

  async createProduct(userId: string, dto: CreateSupplierProductDto) {
    const profile = await this.prisma.supplierProfile.findUnique({
      where: { userId },
    });
    if (!profile)
      throw new ForbiddenException(
        "Only registered suppliers can list products",
      );

    return this.prisma.supplierProduct.create({
      data: {
        supplierId: profile.id,
        name: dto.name,
        category: dto.category,
        description: dto.description,
        wholesalePriceKobo: BigInt(dto.wholesalePriceKobo),
        minOrderQty: dto.minOrderQty,
        unit: dto.unit,
      },
    });
  }

  async getMyProducts(userId: string) {
    const profile = await this.prisma.supplierProfile.findUnique({
      where: { userId },
    });
    if (!profile) return [];

    return this.prisma.supplierProduct.findMany({
      where: { supplierId: profile.id },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateProduct(
    userId: string,
    productId: string,
    dto: UpdateSupplierProductDto,
  ) {
    const profile = await this.prisma.supplierProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new ForbiddenException();

    const product = await this.prisma.supplierProduct.findFirst({
      where: { id: productId, supplierId: profile.id },
    });
    if (!product) throw new NotFoundException();

    return this.prisma.supplierProduct.update({
      where: { id: productId },
      data: {
        ...dto,
        ...(dto.wholesalePriceKobo
          ? { wholesalePriceKobo: BigInt(dto.wholesalePriceKobo) }
          : {}),
      },
    });
  }

  async listCatalogue() {
    return this.prisma.supplierProduct.findMany({
      where: {
        isActive: true,
        supplier: {
          isVerified: true,
        },
      },
      include: {
        supplier: {
          select: {
            companyName: true,
            isVerified: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getDashboardStats(userId: string) {
    const profile = await this.prisma.supplierProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new ForbiddenException();

    const productCount = await this.prisma.supplierProduct.count({
      where: { supplierId: profile.id },
    });

    const activeOrders = await this.prisma.order.count({
      where: {
        supplierId: profile.id,
        status: {
          in: ["PAID", "PREPARING", "IN_TRANSIT", "DISPATCHED"],
        },
      },
    });

    const revenue = await this.prisma.order.aggregate({
      where: {
        supplierId: profile.id,
        status: "COMPLETED",
      },
      _sum: {
        totalAmountKobo: true,
      },
    });

    return {
      productCount,
      activeOrders,
      totalRevenueKobo: revenue._sum.totalAmountKobo || 0n,
      isVerified: profile.isVerified,
    };
  }

  async createOrder(userId: string, dto: CreateWholesaleOrderDto) {
    const product = await this.prisma.supplierProduct.findUnique({
      where: { id: dto.productId },
      include: { supplier: true },
    });

    if (!product) throw new NotFoundException("Wholesale product not found");
    if (!product.isActive) throw new BadRequestException("Product is inactive");
    if (dto.quantity < product.minOrderQty) {
      throw new BadRequestException(
        `Minimum order quantity is ${product.minOrderQty}`,
      );
    }

    const subtotalKobo = Number(product.wholesalePriceKobo) * dto.quantity;
    const platformFeeKobo = Math.floor(subtotalKobo * 0.01);
    const totalAmountKobo = BigInt(subtotalKobo + platformFeeKobo);

    const idempotencyKey = `wholesale-order-${product.id}-${userId}-${Date.now()}`;

    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          buyerId: userId,
          supplierId: product.supplierId,
          supplierProductId: product.id,
          quantity: dto.quantity,
          unitPriceKobo: product.wholesalePriceKobo,
          deliveryAddress: dto.deliveryAddress,
          totalAmountKobo,
          deliveryFeeKobo: 0n,
          currency: "NGN",
          status: OrderStatus.PENDING_PAYMENT,
          paymentMethod: "ESCROW",
          idempotencyKey,
        },
      });

      await tx.orderEvent.create({
        data: {
          orderId: newOrder.id,
          fromStatus: null,
          toStatus: OrderStatus.PENDING_PAYMENT,
          triggeredBy: userId,
          metadata: {
            action: "wholesale_order_created",
            productId: product.id,
          },
        },
      });

      return newOrder;
    });

    // Initialize payment — if this fails, compensate by deleting the orphan order
    let paymentData: { authorization_url?: string };
    try {
      paymentData = await this.paymentService.initialize(
        userId,
        { orderId: order.id },
        `init-wholesale-${order.id}`,
      );
    } catch (paymentError) {
      // Compensate: remove the order so it doesn't sit in PENDING_PAYMENT forever
      await this.prisma.order.delete({ where: { id: order.id } });
      throw new BadRequestException(
        "Payment initialization failed. Please try again.",
      );
    }

    // Trigger WhatsApp notification to Supplier (outside transaction)
    try {
      const buyer = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      if (buyer) {
        await this.whatsappService.sendSupplierNewOrder(product.supplierId, {
          orderId: order.id,
          buyerName: `${buyer.firstName} ${buyer.lastName}`,
          productName: product.name,
          quantity: dto.quantity,
          amountKobo: totalAmountKobo,
          deliveryAddress: dto.deliveryAddress,
        });
      }
    } catch (notifierErr) {
      // Just log, don't fail the order creation
      this.logger.error(
        `Failed to send supplier WhatsApp notification for ${order.id}`,
        notifierErr instanceof Error ? notifierErr.stack : String(notifierErr),
      );
    }

    return {
      orderId: order.id,
      authorizationUrl: paymentData.authorization_url,
      totalAmountKobo: Number(totalAmountKobo),
    };
  }
}
