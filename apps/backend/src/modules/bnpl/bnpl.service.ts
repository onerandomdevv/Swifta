import {
  Injectable,
  Inject,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { BnplPartnerClient, BuyerCreditData } from "./bnpl-partner.interface";

@Injectable()
export class BnplService {
  private readonly logger = new Logger(BnplService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject("BNPL_PARTNER_CLIENT") private partnerClient: BnplPartnerClient,
  ) {}

  private async getBuyerCreditData(buyerId: string): Promise<BuyerCreditData> {
    const user = await this.prisma.user.findUnique({
      where: { id: buyerId },
      include: {
        orders: {
          select: { status: true, totalAmountKobo: true, disputeStatus: true },
        },
      },
    });

    if (!user) {
      throw new BadRequestException("Buyer not found");
    }

    const completedOrdersCount = user.orders.filter(
      (o) => o.status === "COMPLETED",
    ).length;

    let totalSpendKobo = BigInt(0);
    let disputeCount = 0;

    user.orders.forEach((o) => {
      if (o.status === "COMPLETED")
        totalSpendKobo +=
          typeof o.totalAmountKobo === "bigint"
            ? o.totalAmountKobo
            : BigInt(o.totalAmountKobo);
      if (o.disputeStatus !== "NONE") disputeCount++;
    });

    const totalOrders = user.orders.length;
    const disputeRate = totalOrders > 0 ? disputeCount / totalOrders : 0;

    return {
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || "",
      completedOrders: completedOrdersCount,
      totalSpendKobo,
      disputeRate,
    };
  }

  async checkEligibility(buyerId: string) {
    const buyerData = await this.getBuyerCreditData(buyerId);
    return this.partnerClient.checkEligibility(buyerData);
  }

  async applyForLoan(buyerId: string, orderId: string, tenureDays: number) {
    // 1. Fetch Order
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { creditApplication: true },
    });

    if (!order) {
      throw new BadRequestException("Order not found");
    }
    if (order.buyerId !== buyerId) {
      throw new BadRequestException("Unauthorized");
    }
    if (order.creditApplication) {
      throw new BadRequestException(
        "A credit application already exists for this order",
      );
    }

    // 2. Fetch Buyer Data
    const buyerData = await this.getBuyerCreditData(buyerId);

    // 3. Check Eligibility first
    const eligibility = await this.partnerClient.checkEligibility(buyerData);
    if (!eligibility.eligible) {
      throw new BadRequestException(
        `Not eligible for Pay Later: ${eligibility.reason}`,
      );
    }

    const requestedAmount = Array.isArray(order.totalAmountKobo)
      ? order.totalAmountKobo[0]
      : (order.totalAmountKobo as bigint);
    if (requestedAmount > eligibility.maxAmount) {
      throw new BadRequestException(
        `Order amount exceeds your Pay Later limit of ${(Number(eligibility.maxAmount) / 100).toFixed(2)} NGN`,
      );
    }

    // 4. Initiate Loan with Partner
    this.logger.log(`Initiating BNPL loan with partner for order ${orderId}`);
    const loanResult = await this.partnerClient.initiateLoan(
      orderId,
      requestedAmount,
      tenureDays,
      buyerData,
    );

    if (!loanResult.approved) {
      throw new BadRequestException(
        "Loan application was rejected by the partner.",
      );
    }

    // 5. Store CreditApplication in DB & Update Order via Transaction
    const COMMISSION_PERCENTAGE = parseFloat(
      process.env.BNPL_COMMISSION_PERCENTAGE || "3",
    );
    // Calculate commission based on principal
    const commissionVal =
      (Number(requestedAmount) * COMMISSION_PERCENTAGE) / 100;
    const commissionKobo = BigInt(Math.floor(commissionVal));

    return this.prisma.$transaction(async (tx) => {
      // Create the Credit Application
      const application = await tx.creditApplication.create({
        data: {
          buyerId,
          orderId,
          requestedAmount,
          tenure: tenureDays,
          status: "DISBURSED", // Partner disbursed the loan
          partnerRef: loanResult.loanRef, // Mapped to partnerRef on V3 model
          approvedAmount: requestedAmount,
          interestRate: eligibility.interestRate,
          // Newly added fields
          partnerName: process.env.BNPL_PARTNER || "mock",
          partnerDisbursementRef: loanResult.disbursementRef,
          commissionKobo,
        },
      });

      // Advance the Order state to PAID (Partner takes over collection, SwiftTrade holds funds in escrow for merchant)
      await tx.order.update({
        where: { id: orderId },
        data: { status: "PAID" },
      });

      // Log the event
      await tx.orderEvent.create({
        data: {
          orderId,
          fromStatus: order.status,
          toStatus: "PAID",
          triggeredBy: buyerId,
          metadata: {
            method: "BNPL",
            loanRef: loanResult.loanRef,
            disbursementRef: loanResult.disbursementRef,
          },
        },
      });

      return application;
    });
  }

  async getBuyerLoans(buyerId: string) {
    // In a real flow, we might sync status with partner before returning
    const loans = await this.prisma.creditApplication.findMany({
      where: { buyerId },
      include: {
        order: {
          include: {
            merchantProfile: { select: { businessName: true } },
            product: { select: { name: true } },
            supplierProduct: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Add logic to refresh status asynchronously or on-the-fly if needed
    return loans;
  }

  // Stub for Waitlist endpoint remaining backward compatibility
  async joinWaitlist(buyerId: string, email: string, phone?: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: buyerId },
      });

      if (!user) throw new Error("User not found");

      const existing = await this.prisma.bnplWaitlist.findUnique({
        where: { userId: buyerId },
      });

      if (existing) {
        return { message: "You're already on the waitlist!" };
      }

      await this.prisma.bnplWaitlist.create({
        data: { userId: buyerId, email, phone },
      });

      return { message: "You've been added to the waitlist!" };
    } catch (error) {
      return { message: "You're already on the waitlist!" };
    }
  }
}
