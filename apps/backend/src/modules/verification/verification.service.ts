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
import { VerificationTier, OrderStatus } from "@hardware-os/shared";

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationTriggerService,
  ) {}

  async submitRequest(merchantId: string, dto: SubmitVerificationDto) {
    // 1. Check if trying to upgrade while already TRUSTED
    const merchant = await this.prisma.merchantProfile.findUnique({
      where: { id: merchantId },
    });

    if (!merchant) throw new NotFoundException("Merchant profile not found");

    if (merchant.verificationTier === VerificationTier.TRUSTED) {
      throw new BadRequestException(
        "You are already at the highest verification tier",
      );
    }

    // 2 & 3. Atomically check for existing PENDING request and create if none exists
    const request = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.verificationRequest.findFirst({
        where: { merchantId, status: "PENDING" },
      });

      if (existing) {
        throw new BadRequestException(
          "You already have a verification request pending review",
        );
      }

      return tx.verificationRequest.create({
        data: {
          merchantId,
          governmentIdUrl: dto.governmentIdUrl,
          idType: dto.idType,
          cacCertUrl: dto.cacCertUrl,
          status: "PENDING",
        },
        include: {
          merchant: {
            select: { id: true, businessName: true, userId: true },
          },
        },
      });
    });

    // Notify admins (best effort)
    try {
      // Find admins to notify
      const admins = await this.prisma.adminProfile.findMany({
        include: { user: true },
        where: { user: { role: { in: ["SUPER_ADMIN", "OPERATOR"] } } },
      });
      const adminIds = admins.map((a) => a.userId);

      if (adminIds.length > 0) {
        await this.notifications.triggerNewMerchantSubmission(adminIds, {
          merchantId: request.merchantId,
          merchantName: request.merchant.businessName,
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
      select: {
        verificationTier: true,
        verifiedAt: true,
      },
    });

    if (!merchant) throw new NotFoundException("Merchant profile not found");

    const pendingRequest = await this.prisma.verificationRequest.findFirst({
      where: {
        merchantId,
        status: "PENDING",
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      tier: merchant.verificationTier,
      verifiedAt: merchant.verifiedAt,
      pendingRequest,
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
    // 1. Get request
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

    // 2. Handle REJECTION
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

      // Notify merchant (fire-and-forget — enqueue failure must not affect the response)
      this.notifications
        .addJob(
          request.merchant.userId,
          "VERIFICATION_REJECTED",
          "Verification Request Rejected",
          `Your verification request was rejected. Reason: ${dto.rejectionReason}`,
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

    // 3. Handle APPROVAL
    // The documents are good. But does the merchant meet requirements for VERIFIED tier?
    // Requirements: 10+ completed orders, 0 open disputes

    const [completedOrdersCount, openDisputesCount] = await Promise.all([
      this.prisma.order.count({
        where: {
          merchantId,
          status: OrderStatus.COMPLETED,
        },
      }),
      this.prisma.order.count({
        where: {
          merchantId,
          disputeStatus: "PENDING", // assuming PENDING means open dispute
        },
      }),
    ]);

    const meetsRequirements =
      completedOrdersCount >= 10 && openDisputesCount === 0;

    const txResult = await this.prisma.$transaction(async (tx) => {
      // Approve the request
      await tx.verificationRequest.update({
        where: { id: requestId },
        data: {
          status: "APPROVED",
          reviewedBy: adminId,
          reviewedAt: new Date(),
        },
      });

      // Determine new tier
      let newTier = request.merchant.verificationTier;
      let message = "";

      if (meetsRequirements) {
        newTier = VerificationTier.VERIFIED;
        message =
          "Documents approved. You are now a Verified Merchant and can accept Direct Payments!";

        await tx.merchantProfile.update({
          where: { id: merchantId },
          data: {
            verificationTier: newTier,
            verifiedAt: new Date(),
          },
        });
      } else {
        // Ensure they are at least BASIC if they were UNVERIFIED
        if (newTier === VerificationTier.UNVERIFIED) {
          newTier = VerificationTier.BASIC;
          await tx.merchantProfile.update({
            where: { id: merchantId },
            data: { verificationTier: newTier },
          });
        }
        message = `Documents approved. You are currently at ${newTier} tier. Complete 10 orders (currently ${completedOrdersCount}) with no disputes to reach VERIFIED status.`;
      }

      return { meetsRequirements, completedOrdersCount, newTier, message };
    });

    // Notify merchant outside transaction (fire-and-forget)
    this.notifications
      .addJob(
        request.merchant.userId,
        "VERIFICATION_APPROVED",
        "Verification Documents Approved",
        txResult.message,
        {
          requestId,
          newTier: txResult.newTier,
          completedOrdersCount: txResult.completedOrdersCount,
        },
      )
      .catch((err) =>
        this.logger.error(
          `Failed to enqueue approval notification for request ${requestId}`,
          err,
        ),
      );

    return {
      message: "Verification request approved",
      decision: "APPROVED",
      meetsRequirementsForVerified: txResult.meetsRequirements,
      completedOrdersCount: txResult.completedOrdersCount,
      openDisputesCount,
    };
  }

  /**
   * Called by OrderService when an order reaches COMPLETED.
   * Auto-evaluates if merchant qualifies for a tier upgrade.
   */
  async checkAndUpgradeTier(merchantId: string) {
    const merchant = await this.prisma.merchantProfile.findUnique({
      where: { id: merchantId },
    });

    if (!merchant) return;

    // Skip if already TRUSTED rules are met (we're skipping TRUSTED auto-upgrade for now per spec)
    if (merchant.verificationTier === VerificationTier.TRUSTED) return;

    // 1. UNVERIFIED -> BASIC upgrade check
    // Has email verified, phone verified, and bank details added
    if (merchant.verificationTier === VerificationTier.UNVERIFIED) {
      const user = await this.prisma.user.findUnique({
        where: { id: merchant.userId },
      });

      const hasBankDetails = merchant.bankAccountNumber && merchant.bankCode;

      if (user?.emailVerified && user?.phoneVerified && hasBankDetails) {
        await this.prisma.merchantProfile.update({
          where: { id: merchantId },
          data: { verificationTier: VerificationTier.BASIC },
        });

        this.notifications
          .addJob(
            merchant.userId,
            "TIER_UPGRADED",
            "Verification Tier Upgraded",
            "You have been upgraded to the BASIC verification tier! Submit your identity documents to unlock VERIFIED status and Direct Payments.",
          )
          .catch((err) =>
            this.logger.error(
              `Failed to enqueue BASIC tier upgrade notification for merchant ${merchantId}`,
              err,
            ),
          );
        return; // Upgraded to BASIC, return for now. Next order can trigger the verified check.
      }
    }

    // 2. BASIC -> VERIFIED upgrade check
    // Needs approved verification docs, 10+ completed orders, 0 disputes
    if (merchant.verificationTier === VerificationTier.BASIC) {
      // Check for approved docs
      const hasApprovedDocs = await this.prisma.verificationRequest.findFirst({
        where: { merchantId, status: "APPROVED" },
      });

      if (!hasApprovedDocs) return; // Can't auto-upgrade to VERIFIED without approved documents

      // Check orders and disputes
      const [completedOrdersCount, openDisputesCount] = await Promise.all([
        this.prisma.order.count({
          where: { merchantId, status: OrderStatus.COMPLETED },
        }),
        this.prisma.order.count({
          where: { merchantId, disputeStatus: "PENDING" },
        }),
      ]);

      if (completedOrdersCount >= 10 && openDisputesCount === 0) {
        await this.prisma.merchantProfile.update({
          where: { id: merchantId },
          data: {
            verificationTier: VerificationTier.VERIFIED,
            verifiedAt: new Date(),
          },
        });

        this.notifications
          .addJob(
            merchant.userId,
            "TIER_UPGRADED",
            "You are now a Verified Merchant! 🎉",
            "Congratulations! Because you've maintained a perfect track record of 10+ completed orders, you have been upgraded to VERIFIED status. You can now offer Direct Payments to your buyers.",
          )
          .catch((err) =>
            this.logger.error(
              `Failed to enqueue VERIFIED tier upgrade notification for merchant ${merchantId}`,
              err,
            ),
          );
        this.logger.log(`Auto-upgraded merchant ${merchantId} to VERIFIED`);
      }
    }
  }
}
