import {
  Injectable,
  Inject,
  BadRequestException,
  Logger,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import {
  TradeFinancingPartnerClient,
  MerchantCreditData,
} from "./trade-financing-partner.interface";
import { VerificationTier } from "@prisma/client";

@Injectable()
export class TradeFinancingService {
  private readonly logger = new Logger(TradeFinancingService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject("TRADE_FINANCING_PARTNER_CLIENT")
    private partnerClient: TradeFinancingPartnerClient,
  ) {}

  private async getMerchantCreditData(
    userId: string,
  ): Promise<MerchantCreditData> {
    const merchant = await this.prisma.merchantProfile.findUnique({
      where: { userId },
      include: {
        user: true,
        orders: {
          select: { status: true, totalAmountKobo: true, disputeStatus: true },
        },
      },
    });

    if (!merchant) {
      throw new NotFoundException("Merchant profile not found");
    }

    // Eligibility check for merchant tier
    if (
      merchant.verificationTier !== VerificationTier.VERIFIED &&
      merchant.verificationTier !== VerificationTier.TRUSTED
    ) {
      throw new ForbiddenException(
        "Trade Financing is only available to VERIFIED or TRUSTED merchants",
      );
    }

    const completedSales = merchant.orders.filter(
      (o) => o.status === "COMPLETED",
    );
    const completedSalesCount = completedSales.length;

    let totalRevenueKobo = BigInt(0);
    let disputeCount = 0;

    merchant.orders.forEach((o) => {
      if (o.status === "COMPLETED") {
        totalRevenueKobo +=
          typeof o.totalAmountKobo === "bigint"
            ? o.totalAmountKobo
            : BigInt(o.totalAmountKobo);
      }
      if (o.disputeStatus !== "NONE") {
        disputeCount++;
      }
    });

    // Calculate average monthly revenue (last 6 months or since join)
    const now = new Date();
    const joinedAt = new Date(merchant.createdAt);
    const monthsDiff = Math.max(
      1,
      (now.getFullYear() - joinedAt.getFullYear()) * 12 +
        now.getMonth() -
        joinedAt.getMonth(),
    );
    const activeMonths = Math.min(6, monthsDiff);
    const averageMonthlyRevenueKobo = totalRevenueKobo / BigInt(activeMonths);

    const totalOrders = merchant.orders.length;
    const disputeRate = totalOrders > 0 ? disputeCount / totalOrders : 0;

    return {
      userId: merchant.userId,
      merchantId: merchant.id,
      businessName: merchant.businessName,
      email: merchant.user.email,
      phone: merchant.user.phone || "",
      completedSales: completedSalesCount,
      totalRevenueKobo,
      averageMonthlyRevenueKobo,
      disputeRate,
      verificationTier: merchant.verificationTier,
    };
  }

  async checkEligibility(userId: string) {
    const merchantData = await this.getMerchantCreditData(userId);

    // Hard requirements from CLAUDE-V4.md
    if (merchantData.completedSales < 10) {
      return {
        eligible: false,
        maxAmount: 0n,
        interestRate: 0,
        reason: "Need at least 10 completed sales orders.",
      };
    }

    const minRevenue = 50000000n; // ₦500k in Kobo
    if (merchantData.averageMonthlyRevenueKobo < minRevenue) {
      return {
        eligible: false,
        maxAmount: 0n,
        interestRate: 0,
        reason: "Average monthly revenue must be above ₦500,000.",
      };
    }

    if (merchantData.disputeRate > 0.05) {
      // Allow max 5% dispute rate for B2B
      return {
        eligible: false,
        maxAmount: 0n,
        interestRate: 0,
        reason: "Dispute rate is too high for trade financing.",
      };
    }

    return this.partnerClient.checkEligibility(merchantData);
  }

  async applyForFinancing(userId: string, orderId: string, tenureDays: number) {
    // 1. Fetch Order (Must be a wholesale order from a supplier)
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { creditApplication: true, supplierProfile: true },
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }
    if (order.buyerId !== userId) {
      throw new ForbiddenException("Unauthorized");
    }
    if (!order.supplierId) {
      throw new BadRequestException(
        "Trade Financing is only available for wholesale supplier orders",
      );
    }
    if (order.creditApplication) {
      throw new BadRequestException(
        "A financing application already exists for this order",
      );
    }

    // 2. Fetch Merchant Data
    const merchantData = await this.getMerchantCreditData(userId);

    // 3. Check Eligibility
    const eligibility = await this.partnerClient.checkEligibility(merchantData);
    if (!eligibility.eligible) {
      throw new BadRequestException(
        `Not eligible for Trade Financing: ${eligibility.reason}`,
      );
    }

    const requestedAmount = order.totalAmountKobo;
    if (requestedAmount > eligibility.maxAmount) {
      throw new BadRequestException(
        `Order amount exceeds your Trade Financing limit of ${(Number(eligibility.maxAmount) / 100).toLocaleString()} NGN`,
      );
    }

    // 4. Initiate Loan with Partner
    this.logger.log(
      `Initiating Trade Financing for merchant ${merchantData.businessName} (Order: ${orderId})`,
    );
    const loanResult = await this.partnerClient.initiateLoan(
      orderId,
      requestedAmount,
      tenureDays,
      merchantData,
    );

    if (!loanResult.approved) {
      throw new BadRequestException(
        "Financing application was rejected by the partner.",
      );
    }

    // 5. Store CreditApplication in DB & Update Order via Transaction
    const COMMISSION_PERCENTAGE = parseFloat(
      process.env.TRADE_FINANCING_COMMISSION_PERCENTAGE || "3",
    );
    const commissionKobo = BigInt(
      Math.floor((Number(requestedAmount) * COMMISSION_PERCENTAGE) / 100),
    );

    return this.prisma.$transaction(async (tx) => {
      const application = await tx.creditApplication.create({
        data: {
          buyerId: userId, // The merchant is the 'buyer' of the wholesale goods
          merchantId: merchantData.merchantId,
          orderId,
          requestedAmount,
          tenure: tenureDays,
          status: "DISBURSED",
          partnerRef: loanResult.loanRef,
          approvedAmount: requestedAmount,
          interestRate: eligibility.interestRate,
          partnerName: process.env.FINANCING_PARTNER || "mock",
          partnerDisbursementRef: loanResult.disbursementRef,
          commissionKobo,
        },
      });

      await tx.order.update({
        where: { id: orderId },
        data: { status: "PAID" },
      });

      await tx.orderEvent.create({
        data: {
          orderId,
          fromStatus: order.status,
          toStatus: "PAID",
          triggeredBy: userId,
          metadata: {
            method: "TRADE_FINANCING",
            loanRef: loanResult.loanRef,
          },
        },
      });

      return application;
    });
  }

  async getMerchantLoans(userId: string) {
    const merchant = await this.prisma.merchantProfile.findUnique({
      where: { userId },
    });
    if (!merchant) throw new NotFoundException();

    return this.prisma.creditApplication.findMany({
      where: { merchantId: merchant.id },
      include: {
        order: {
          include: {
            supplierProfile: { select: { companyName: true } },
            supplierProduct: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async joinWaitlist(userId: string): Promise<{ message: string }> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { bnplWaitlist: true },
      });

      if (!user) {
        return { message: "User not found" };
      }

      if (user.bnplWaitlist && user.bnplWaitlist.length > 0) {
        return { message: "You're already on the waitlist!" };
      }

      await this.prisma.bnplWaitlist.create({
        data: {
          userId,
          email: user.email,
          phone: user.phone,
        },
      });

      return { message: "Successfully joined the waitlist!" };
    } catch (error) {
      this.logger.error(`Error joining waitlist for user ${userId}:`, error);
      throw new InternalServerErrorException("Failed to join waitlist");
    }
  }
}
