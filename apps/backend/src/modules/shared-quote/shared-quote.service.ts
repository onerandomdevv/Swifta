import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  GoneException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateSharedQuoteDto } from "./dto/create-shared-quote.dto";
import { UpdateSharedQuoteDto } from "./dto/update-shared-quote.dto";
import { paginate } from "../../common/utils/pagination";
import * as crypto from "crypto";

@Injectable()
export class SharedQuoteService {
  private readonly logger = new Logger(SharedQuoteService.name);

  constructor(private prisma: PrismaService) {}

  private generateSlug(): string {
    return "HW-" + crypto.randomBytes(4).toString("hex").toUpperCase();
  }

  async create(merchantId: string, dto: CreateSharedQuoteDto) {
    const subtotalKobo = dto.items.reduce(
      (sum, item) => sum + item.totalKobo,
      0,
    );
    const deliveryFeeKobo = dto.deliveryFeeKobo || 0;
    const totalKobo = subtotalKobo + deliveryFeeKobo;

    const expiresAt = dto.expiresAt
      ? new Date(dto.expiresAt)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days default

    let slug = this.generateSlug();

    try {
      return await this.prisma.sharedQuote.create({
        data: {
          merchantId,
          slug,
          buyerName: dto.buyerName,
          buyerPhone: dto.buyerPhone,
          buyerEmail: dto.buyerEmail,
          items: dto.items as any,
          subtotalKobo: BigInt(subtotalKobo),
          deliveryFeeKobo: BigInt(deliveryFeeKobo),
          totalKobo: BigInt(totalKobo),
          note: dto.note,
          expiresAt,
        },
        include: { merchantProfile: { select: { businessName: true } } },
      });
    } catch (error: any) {
      // Retry once on slug collision
      if (error.code === "P2002") {
        slug = this.generateSlug();
        return this.prisma.sharedQuote.create({
          data: {
            merchantId,
            slug,
            buyerName: dto.buyerName,
            buyerPhone: dto.buyerPhone,
            buyerEmail: dto.buyerEmail,
            items: dto.items as any,
            subtotalKobo: BigInt(subtotalKobo),
            deliveryFeeKobo: BigInt(deliveryFeeKobo),
            totalKobo: BigInt(totalKobo),
            note: dto.note,
            expiresAt,
          },
          include: { merchantProfile: { select: { businessName: true } } },
        });
      }
      throw error;
    }
  }

  async listByMerchant(
    merchantId: string,
    page: number,
    limit: number,
    status?: string,
  ) {
    const where: any = { merchantId };
    if (status) {
      where.status = status;
    }

    return paginate(
      this.prisma.sharedQuote,
      { page, limit },
      {
        where,
        orderBy: { createdAt: "desc" },
        include: { merchantProfile: { select: { businessName: true } } },
      },
    );
  }

  async getPublicBySlug(slug: string) {
    const quote = await this.prisma.sharedQuote.findUnique({
      where: { slug },
      include: {
        merchantProfile: {
          select: { businessName: true, verificationTier: true },
        },
      },
    });

    if (!quote) {
      throw new NotFoundException("Quote not found");
    }

    // Check expiry
    if (new Date(quote.expiresAt) < new Date()) {
      throw new GoneException("This quote has expired");
    }

    // Mark as VIEWED on first access
    if (!quote.viewedAt) {
      await this.prisma.sharedQuote.update({
        where: { id: quote.id },
        data: {
          viewedAt: new Date(),
          status:
            quote.status === "DRAFT" || quote.status === "SENT"
              ? "VIEWED"
              : quote.status,
        },
      });
      quote.viewedAt = new Date();
      if (quote.status === "DRAFT" || quote.status === "SENT") {
        (quote as any).status = "VIEWED";
      }
    }

    return quote;
  }

  async update(merchantId: string, id: string, dto: UpdateSharedQuoteDto) {
    const quote = await this.prisma.sharedQuote.findUnique({
      where: { id },
    });

    if (!quote) {
      throw new NotFoundException("Shared quote not found");
    }

    if (quote.merchantId !== merchantId) {
      throw new ForbiddenException("Access denied");
    }

    if (quote.status !== "DRAFT") {
      throw new BadRequestException("Only draft quotes can be updated");
    }

    const data: any = {};
    if (dto.buyerName !== undefined) data.buyerName = dto.buyerName;
    if (dto.buyerPhone !== undefined) data.buyerPhone = dto.buyerPhone;
    if (dto.buyerEmail !== undefined) data.buyerEmail = dto.buyerEmail;
    if (dto.note !== undefined) data.note = dto.note;
    if (dto.expiresAt !== undefined) data.expiresAt = new Date(dto.expiresAt);

    if (dto.items) {
      data.items = dto.items as any;
      const subtotalKobo = dto.items.reduce(
        (sum, item) => sum + item.totalKobo,
        0,
      );
      const deliveryFeeKobo =
        dto.deliveryFeeKobo ?? Number(quote.deliveryFeeKobo);
      data.subtotalKobo = BigInt(subtotalKobo);
      data.deliveryFeeKobo = BigInt(deliveryFeeKobo);
      data.totalKobo = BigInt(subtotalKobo + deliveryFeeKobo);
    } else if (dto.deliveryFeeKobo !== undefined) {
      data.deliveryFeeKobo = BigInt(dto.deliveryFeeKobo);
      data.totalKobo = BigInt(Number(quote.subtotalKobo) + dto.deliveryFeeKobo);
    }

    return this.prisma.sharedQuote.update({
      where: { id },
      data,
      include: { merchantProfile: { select: { businessName: true } } },
    });
  }
}
