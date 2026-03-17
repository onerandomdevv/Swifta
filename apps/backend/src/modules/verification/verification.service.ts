import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import {
  SubmitVerificationDto,
  ReviewVerificationDto,
} from "./verification.dto";
import { NotificationTriggerService } from "../notification/notification-trigger.service";
import { VerificationTier, OrderStatus, NotificationType } from "@swifta/shared";

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationTriggerService,
  ) {}

  async submitRequest(merchantId: string, dto: SubmitVerificationDto) {
    const merchant = await this.prisma.merchantProfile.findUnique({
      where: { id: merchantId },
    });

    if (!merchant) throw new NotFoundException("Merchant profile not found");

    if (merchant.verificationTier === VerificationTier.TIER_3) {
      throw new BadRequestException(
        "You are already at the highest verification tier",
      );
    }

    // Validate prerequisite tier
    if (
      dto.targetTier === "TIER_2" &&
      merchant.verificationTier !== VerificationTier.TIER_1
    ) {
      throw new BadRequestException("You must be TIER_1 to apply for TIER_2");
    }
    if (
      dto.targetTier === "TIER_3" &&
      merchant.verificationTier !== VerificationTier.TIER_2
    ) {
      throw new BadRequestException("You must be TIER_2 to apply for TIER_3");
    }

    // Atomically check for existing PENDING request and create
    const request = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.verificationRequest.findFirst({
        where: { merchantId, status: "PENDING", targetTier: dto.targetTier },
      });

      if (existing) {
        throw new BadRequestException(
          `You already have a ${dto.targetTier} verification request pending review`,
        );
      }

      return tx.verificationRequest.create({
        data: {
          merchantId,
          governmentIdUrl: dto.governmentIdUrl,
          idType: dto.idType,
          cacCertUrl: dto.cacCertUrl,
          targetTier: dto.targetTier,
          ninNumber: dto.ninNumber,
          status: "PENDING",
        },
        include: {
          merchant: {
            select: { id: true, businessName: true, userId: true },
          },
        },
      });
    });

    // Notify admins
    try {
      const admins = await this.prisma.adminProfile.findMany({
        include: { user: true },
        where: { user: { role: { in: ["SUPER_ADMIN", "OPERATOR"] } } },
      });
      const adminIds = admins.map((a) => a.userId);

      if (adminIds.length > 0) {
        await this.notifications.triggerNewMerchantSubmission(adminIds, {
          merchantId: request.merchantId,
          merchantName: request.merchant.businessName,
          targetTier: dto.targetTier as string,
        });
      }
    } catch (e) {
      this.logger.error("Failed to notify admins of new verification request");
    }

    return request;
  }

  async getStatus(merchantId: string) {
    const merchant = await this.prisma.merchantProfile.findUnique({
      where: { id: merchantId },
      include: { user: true },
    });

    if (!merchant) throw new NotFoundException("Merchant profile not found");

    const [completedOrdersCount, openDisputesCount, pendingRequest] =
      await Promise.all([
        this.prisma.order.count({
          where: { merchantId, status: OrderStatus.COMPLETED },
        }),
        this.prisma.order.count({
          where: { merchantId, disputeStatus: { not: null } },
        }),
        this.prisma.verificationRequest.findFirst({
          where: { merchantId, status: "PENDING" },
          orderBy: { createdAt: "desc" },
        }),
      ]);

    const user = merchant.user;
    const accountAgeDays = Math.floor(
      (Date.now() - new Date(merchant.createdAt).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    const months = Math.floor(accountAgeDays / 30);
    const accountAgeStr =
      months >= 1
        ? `${months} month${months > 1 ? "s" : ""}`
        : "Less than a month";

    return {
      currentTier: merchant.verificationTier,
      tier1: {
        status:
          merchant.verificationTier !== VerificationTier.UNVERIFIED
            ? "COMPLETE"
            : "IN_PROGRESS",
        requirements: {
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
          bankVerified: merchant.bankVerified,
          basicInfo: !!(
            (user.firstName?.trim() && user.lastName?.trim()) ||
            merchant.businessName?.trim()
          ),
          businessAddress: !!merchant.businessAddress?.trim(),
        },
      },
      tier2: {
        status:
          merchant.verificationTier === VerificationTier.TIER_2 ||
          merchant.verificationTier === VerificationTier.TIER_3
            ? "COMPLETE"
            : merchant.verificationTier === VerificationTier.TIER_1
              ? "IN_PROGRESS"
              : "LOCKED",
        requirements: {
          ninVerified: merchant.ninVerified,
          completedOrders: { current: completedOrdersCount, required: 5 },
          zeroDisputes: openDisputesCount === 0,
          profilePhoto: !!merchant.profileImage,
        },
        pendingRequest:
          pendingRequest?.targetTier === "TIER_2" ? pendingRequest : null,
      },
      tier3: {
        status:
          merchant.verificationTier === VerificationTier.TIER_3
            ? "COMPLETE"
            : merchant.verificationTier === VerificationTier.TIER_2
              ? "IN_PROGRESS"
              : "LOCKED",
        requirements: {
          cacVerified: merchant.cacVerified,
          addressVerified: merchant.addressVerified,
          completedOrders: { current: completedOrdersCount, required: 20 },
          averageRating: { current: merchant.averageRating, required: 4.0 },
          accountAge: { current: accountAgeStr, required: "3 months" },
        },
        pendingRequest:
          pendingRequest?.targetTier === "TIER_3" ? pendingRequest : null,
      },
    };
  }

  async getPendingRequests(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.verificationRequest.findMany({
        where: { status: "PENDING" },
        skip,
        take: limit,
        orderBy: { createdAt: "asc" },
        include: {
          merchant: {
            select: {
              id: true,
              businessName: true,
              verificationTier: true,
              user: {
                select: { email: true, phone: true },
              },
            },
          },
        },
      }),
      this.prisma.verificationRequest.count({
        where: { status: "PENDING" },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async reviewRequest(
    requestId: string,
    adminId: string,
    dto: ReviewVerificationDto,
  ) {
    const request = await this.prisma.verificationRequest.findUnique({
      where: { id: requestId },
      include: {
        merchant: {
          include: { user: true },
        },
      },
    });

    if (!request) throw new NotFoundException("Verification request not found");
    if (request.status !== "PENDING")
      throw new BadRequestException("Request is already processed");

    const merchantId = request.merchantId;

    if (dto.decision === "REJECTED") {
      if (!dto.rejectionReason) {
        throw new BadRequestException(
          "Rejection reason is required when rejecting a request",
        );
      }

      await this.prisma.verificationRequest.update({
        where: { id: requestId },
        data: {
          status: "REJECTED",
          reviewedBy: adminId,
          reviewedAt: new Date(),
          rejectionReason: dto.rejectionReason,
        },
      });

      this.notifications
        .addJob(
          request.merchant.userId,
          NotificationType.VERIFICATION_REJECTED,
          "Verification Request Rejected",
          `Your ${request.targetTier} verification request was rejected. Reason: ${dto.rejectionReason}`,
          { requestId },
        )
        .catch((err) =>
          this.logger.error(
            `Failed to enqueue rejection notification for request ${requestId}`,
            err,
          ),
        );

      return {
        message: "Verification request rejected",
        decision: "REJECTED",
      };
    }

    // Handle APPROVAL
    await this.prisma.$transaction(async (tx) => {
      // Approve the request
      await tx.verificationRequest.update({
        where: { id: requestId },
        data: {
          status: "APPROVED",
          reviewedBy: adminId,
          reviewedAt: new Date(),
        },
      });

      // Update verification metadata based on target tier
      if (request.targetTier === "TIER_2") {
        await tx.merchantProfile.update({
          where: { id: merchantId },
          data: {
            ninVerified: true,
            ninVerifiedAt: new Date(),
            ninVerifiedVia: "MANUAL",
            ninNumber: request.ninNumber || request.merchant.ninNumber,
          },
        });
      } else if (request.targetTier === "TIER_3") {
        await tx.merchantProfile.update({
          where: { id: merchantId },
          data: {
            cacVerified: true,
            addressVerified: true, // Assuming proof of address document approval
            cacVerifiedVia: "MANUAL",
            addressVerifiedVia: "MANUAL",
          },
        });
      }
    });

    // Check for tier upgrade
    const newTier = await this.checkAndUpgradeTier(merchantId);

    return {
      message: "Verification request approved",
      decision: "APPROVED",
      newTier,
    };
  }

  async checkAndUpgradeTier(merchantId: string): Promise<VerificationTier> {
    const merchant = await this.prisma.merchantProfile.findUnique({
      where: { id: merchantId },
      include: { user: true },
    });

    if (!merchant) throw new NotFoundException("Merchant not found");

    const currentTier = merchant.verificationTier;

    // Check Tier 1 requirements
    if (currentTier === VerificationTier.UNVERIFIED) {
      const user = merchant.user;
      const meetsT1 =
        user.emailVerified &&
        user.phoneVerified &&
        merchant.bankVerified &&
        merchant.bankAccountNumber &&
        (((user.firstName?.trim()?.length ?? 0) > 0 &&
          (user.lastName?.trim()?.length ?? 0) > 0) ||
          (merchant.businessName?.trim()?.length ?? 0) > 0) &&
        (merchant.businessAddress?.trim()?.length ?? 0) > 0;

      if (meetsT1) {
        await this.prisma.merchantProfile.update({
          where: { id: merchantId },
          data: {
            verificationTier: VerificationTier.TIER_1,
            tierUpgradedAt: new Date(),
          },
        });
        await this.notifyTierUpgrade(merchantId, VerificationTier.TIER_1);
        return VerificationTier.TIER_1;
      }
    }

    // Check Tier 2 requirements
    if (currentTier === VerificationTier.TIER_1) {
      const completedOrders = await this.prisma.order.count({
        where: { merchantId, status: OrderStatus.COMPLETED },
      });
      const openDisputes = await this.prisma.order.count({
        where: { merchantId, disputeStatus: { not: "NONE" } },
      });

      const meetsT2 =
        merchant.ninVerified &&
        completedOrders >= 5 &&
        openDisputes === 0 &&
        merchant.profileImage;

      if (meetsT2) {
        await this.prisma.merchantProfile.update({
          where: { id: merchantId },
          data: {
            verificationTier: VerificationTier.TIER_2,
            tierUpgradedAt: new Date(),
            verifiedAt: new Date(),
          },
        });
        await this.notifyTierUpgrade(merchantId, VerificationTier.TIER_2);
        return VerificationTier.TIER_2;
      }
    }

    // Check Tier 3 requirements
    if (currentTier === VerificationTier.TIER_2) {
      const completedOrders = await this.prisma.order.count({
        where: { merchantId, status: OrderStatus.COMPLETED },
      });

      const accountCreatedAt = merchant.createdAt;
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const meetsT3 =
        merchant.cacVerified &&
        merchant.addressVerified &&
        completedOrders >= 20 &&
        (merchant.averageRating || 0) >= 4.0 &&
        accountCreatedAt < threeMonthsAgo;

      if (meetsT3) {
        await this.prisma.merchantProfile.update({
          where: { id: merchantId },
          data: {
            verificationTier: VerificationTier.TIER_3,
            tierUpgradedAt: new Date(),
          },
        });
        await this.notifyTierUpgrade(merchantId, VerificationTier.TIER_3);
        return VerificationTier.TIER_3;
      }
    }

    return currentTier as any;
  }

  private async notifyTierUpgrade(merchantId: string, tier: VerificationTier) {
    const tierNames = {
      [VerificationTier.TIER_1]: "Basic Verified",
      [VerificationTier.TIER_2]: "Identity Verified",
      [VerificationTier.TIER_3]: "Business Verified",
    };
    const tierBenefits = {
      [VerificationTier.TIER_1]:
        "You can now list products and receive orders with escrow protection.",
      [VerificationTier.TIER_2]:
        "You now have a verified badge, direct payment option (1.5% fee), and higher visibility.",
      [VerificationTier.TIER_3]:
        "You now have a blue business badge, lowest fees (1%), priority search placement, and premium features.",
    };

    const merchant = await this.prisma.merchantProfile.findUnique({
      where: { id: merchantId },
    });

    if (!merchant) return;

    await this.notifications
      .addJob(
        merchant.userId,
        NotificationType.TIER_UPGRADED,
        `Upgraded to ${tierNames[tier]}`,
        tierBenefits[tier],
        { tier },
      )
      .catch((err) =>
        this.logger.error(`Failed to notify tier upgrade: ${err.message}`),
      );
  }
}
