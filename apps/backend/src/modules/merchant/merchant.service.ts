import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { UpdateMerchantDto } from "./dto/update-merchant.dto";
import { UpdateBankAccountDto } from "./dto/update-bank-account.dto";
import { UserRole, VerificationTier } from "@swifta/shared";
import { PaystackClient } from "../payment/paystack.client";
import { NotificationTriggerService } from "../notification/notification-trigger.service";
import { UpdatePreferencesDto } from "./dto/update-preferences.dto";

@Injectable()
export class MerchantService {
  constructor(
    private prisma: PrismaService,
    private paystack: PaystackClient,
    private notifications: NotificationTriggerService,
  ) {}

  async resolveBankAccount(accountNumber: string, bankCode: string) {
    try {
      const response = await this.paystack.resolveAccount(
        accountNumber,
        bankCode,
      );
      return {
        accountName: response.account_name,
        accountNumber: response.account_number,
        bankId: response.bank_id,
      };
    } catch (error: any) {
      throw new NotFoundException(
        `Could not resolve account: ${error.message}`,
      );
    }
  }

  async getBanks() {
    try {
      const banks = await this.paystack.getBanks();
      // Only return active nuban banks to keep the list clean
      return banks
        .filter((b) => b.active && b.type === "nuban")
        .map((b) => ({ code: b.code, name: b.name }));
    } catch (error: any) {
      throw new NotFoundException(`Could not get banks: ${error.message}`);
    }
  }

  async getProfile(merchantId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [merchant, slugChangesCount] = await Promise.all([
      this.prisma.merchantProfile.findUnique({
        where: { id: merchantId },
        include: {
          user: {
            select: {
              email: true,
              phone: true,
              emailVerified: true,
            },
          },
        },
      }),
      (this.prisma as any).merchantSlugHistory.count({
        where: {
          merchantProfileId: merchantId,
          changedAt: { gte: thirtyDaysAgo },
        },
      }),
    ]);

    if (!merchant) throw new NotFoundException("Merchant profile not found");

    return {
      ...merchant,
      contact: merchant.user
        ? {
            email: merchant.user.email,
            phone: merchant.user.phone,
            emailVerified: merchant.user.emailVerified,
          }
        : null,
      slugChangesCount,
    };
  }

  async getPublicProfile(merchantId: string) {
    const merchant = await (this.prisma.merchantProfile.findUnique({
      where: { id: merchantId },
      include: {
        user: {
          select: {
            email: true,
            phone: true,
          },
        },
        _count: {
          select: {
            orders: {
              where: {
                status: "COMPLETED",
              },
            },
            followers: true,
          } as any,
        },
      },
    }) as any);

    if (!merchant) throw new NotFoundException("Merchant not found");

    // We only expose contact info if the merchant is TIER_2 or higher
    const isVerified =
      merchant.verificationTier === VerificationTier.TIER_2 ||
      merchant.verificationTier === VerificationTier.TIER_3;

    return {
      id: merchant.id,
      slug: merchant.slug,
      businessName: merchant.businessName,
      businessAddress: merchant.businessAddress,
      businessType: merchant.businessType,
      estYear: merchant.estYear,
      category: merchant.category,
      warehouseLocation: merchant.warehouseLocation,
      distributionCenter: merchant.distributionCenter,
      warehouseCapacity: merchant.warehouseCapacity,
      verificationTier: merchant.verificationTier,
      verifiedAt: merchant.verifiedAt,
      createdAt: merchant.createdAt,
      lastSlugChangeAt: merchant.lastSlugChangeAt,
      profileImage: merchant.profileImage,
      coverImage: merchant.coverImage,
      cacVerified: merchant.cacVerified,
      addressVerified: merchant.addressVerified,
      guarantorVerified: merchant.guarantorVerified,
      bankVerified: merchant.bankVerified,
      averageRating: merchant.averageRating || 0,
      reviewCount: merchant.reviewCount || 0,
      description: merchant.description,
      socialLinks: merchant.socialLinks as any,
      contact: isVerified
        ? {
            email: merchant.user.email,
            phone: merchant.user.phone,
          }
        : null,
      dealsClosed: Number(merchant._count.orders),
      followersCount: merchant._count.followers,
    };
  }

  async getAllMerchants() {
    return this.prisma.merchantProfile.findMany({
      where: {
        verificationTier: VerificationTier.TIER_2,
      },
      select: {
        id: true,
        businessName: true,
        verificationTier: true,
      },
      orderBy: {
        businessName: "asc",
      },
    });
  }

  async updateProfile(merchantId: string, dto: UpdateMerchantDto) {
    const existing = await this.prisma.merchantProfile.findUnique({
      where: { id: merchantId },
    });
    if (!existing) throw new NotFoundException("Merchant profile not found");

    // Build the data to update — only provided fields
    const updateData: Record<string, any> = { ...dto };

    // Progressive onboarding auto-advance (5-step flow)
    const merged = { ...existing, ...dto };

    let newStep = existing.onboardingStep;

    // Step 1 → 2: Business profile complete (businessName, businessType, estYear, category)
    if (
      newStep === 1 &&
      merged.businessName &&
      merged.businessType &&
      merged.estYear &&
      merged.category
    ) {
      newStep = 2;
    }

    // Step 2 → 3: Registration details complete (cacNumber, taxId)
    if (newStep === 2 && merged.cacNumber && merged.taxId) {
      newStep = 3;
    }

    // Step 3 → 4: Warehouse/logistics complete (businessAddress, warehouseLocation, distributionCenter, warehouseCapacity)
    if (
      newStep === 3 &&
      merged.businessAddress &&
      merged.warehouseLocation &&
      merged.distributionCenter &&
      merged.warehouseCapacity
    ) {
      newStep = 4;
    }

    // Step 4 → 5: Bank details complete (bankCode, bankAccountNumber, settlementAccountName)
    if (
      newStep === 4 &&
      merged.bankCode &&
      merged.bankAccountNumber &&
      merged.settlementAccountName
    ) {
      newStep = 5;
    }

    // Step 5 reached: Set verification = PENDING (review & submit step)

    if (newStep !== existing.onboardingStep) {
      updateData.onboardingStep = newStep;
    }

    const updated = await this.prisma.merchantProfile.update({
      where: { id: merchantId },
      data: updateData,
      include: {
        user: {
          select: {
            email: true,
            phone: true,
          },
        },
      },
    });

    return updated;
  }

  async updateBankAccount(merchantId: string, dto: UpdateBankAccountDto) {
    const existing = await this.prisma.merchantProfile.findUnique({
      where: { id: merchantId },
    });
    if (!existing) throw new NotFoundException("Merchant profile not found");

    // 1. Resolve account to verify and get the exact account name
    const resolved = await this.resolveBankAccount(
      dto.bankAccountNumber,
      dto.bankCode,
    );

    // 2. Create Paystack Transfer Recipient for future payouts
    const recipient = await this.paystack.createTransferRecipient(
      dto.bankCode,
      dto.bankAccountNumber,
      resolved.accountName,
    );

    // 3. Prepare the data to update
    const updateData: any = {
      bankAccountNumber: dto.bankAccountNumber,
      bankCode: dto.bankCode,
      settlementAccountName: resolved.accountName,
      paystackRecipientCode: recipient.recipient_code,
    };

    // Auto-advance step 4->5 if other fields are complete and we are at step 4
    if (existing.onboardingStep === 4) {
      updateData.onboardingStep = 5;
    }

    return this.prisma.merchantProfile.update({
      where: { id: merchantId },
      data: updateData,
    });
  }

  async submitForVerification(merchantId: string) {
    const merchant = await this.prisma.merchantProfile.findUnique({
      where: { id: merchantId },
    });

    if (!merchant) throw new NotFoundException("Merchant not found");

    // Only allow submission if they've at least provided bank details (Step 4+)
    if (merchant.onboardingStep < 4) {
      throw new BadRequestException(
        "Please complete your profile and bank details before submitting for verification.",
      );
    }

    const updated = await this.prisma.merchantProfile.update({
      where: { id: merchantId },
      data: {
        onboardingStep: Math.max(merchant.onboardingStep, 5),
      },
    });

    // Notify Admins
    const admins = await this.prisma.user.findMany({
      where: {
        role: { in: [UserRole.SUPER_ADMIN, UserRole.OPERATOR] },
      },
      select: { id: true },
    });

    const adminIds = admins.map((a) => a.id);
    if (adminIds.length > 0) {
      await this.notifications.triggerNewMerchantSubmission(adminIds, {
        merchantId,
        merchantName: merchant.businessName || "Unknown Merchant",
      });
    }

    return updated;
  }

  async findBySlug(slug: string) {
    // Attempt direct match first
    const directMatch = await (this.prisma.merchantProfile as any).findUnique({
      where: { slug: slug.toLowerCase() },
      include: {
        user: {
          select: {
            email: true,
            phone: true,
          },
        },
      },
    });

    if (directMatch) return directMatch;

    // Check history for redirection
    const historyMatch = await (
      this.prisma as any
    ).merchantSlugHistory.findFirst({
      where: { oldSlug: slug.toLowerCase() },
      include: {
        merchantProfile: {
          include: {
            user: {
              select: {
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (historyMatch) return historyMatch.merchantProfile;

    throw new NotFoundException(`Merchant with username "${slug}" not found`);
  }

  async updateUsername(merchantId: string, newSlugInput: string) {
    const newSlug = newSlugInput.toLowerCase().trim();

    // 1. Format validation
    const slugRegex = /^[a-z0-9](-?[a-z0-9])*$/;
    if (!slugRegex.test(newSlug) || newSlug.length < 3 || newSlug.length > 30) {
      throw new BadRequestException(
        "Username must be 3-30 characters, lowercase alphanumeric, and can contain hyphens (but not at the start/end).",
      );
    }

    const merchant = await this.prisma.merchantProfile.findUnique({
      where: { id: merchantId },
      include: { user: { select: { emailVerified: true } } },
    });
    if (!merchant) throw new NotFoundException("Merchant profile not found");

    if (!merchant.user.emailVerified) {
      throw new BadRequestException(
        "You must verify your email address before you can change your business username.",
      );
    }

    if ((merchant as any).slug === newSlug) {
      throw new BadRequestException(
        "New username must be different from current one.",
      );
    }

    // 2. Uniqueness check (Current + History)
    const isTaken = await (this.prisma.merchantProfile as any).findUnique({
      where: { slug: newSlug },
    });
    if (isTaken) throw new BadRequestException("Username is already in use.");

    const isReserved = await (this.prisma as any).merchantSlugHistory.findFirst(
      {
        where: { oldSlug: newSlug },
      },
    );
    if (isReserved)
      throw new BadRequestException(
        "Username is reserved by another merchant.",
      );

    // 3. Cooldown check (7 days)
    if ((merchant as any).lastSlugChangeAt) {
      const msSinceLastChange =
        Date.now() - (merchant as any).lastSlugChangeAt.getTime();
      const coolingDays = msSinceLastChange / (1000 * 60 * 60 * 24);
      if (coolingDays < 7) {
        const remaining = Math.ceil(7 - coolingDays);
        throw new BadRequestException(
          `Please wait ${remaining} more day(s) before changing your username again.`,
        );
      }
    }

    // 3. Rate Limit Check (max 3 changes in 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentChanges = await (this.prisma as any).merchantSlugHistory.count({
      where: {
        merchantProfileId: merchantId,
        changedAt: { gte: thirtyDaysAgo },
      },
    });

    if (recentChanges >= 3) {
      throw new BadRequestException(
        "You have reached the limit of 3 username changes per month.",
      );
    }

    // 4. Cooldown Check (e.g., 24 hours between changes)
    if (
      (merchant as any).lastSlugChangeAt &&
      new Date().getTime() -
        new Date((merchant as any).lastSlugChangeAt).getTime() <
        24 * 60 * 60 * 1000
    ) {
      throw new BadRequestException(
        "Please wait 24 hours between username changes.",
      );
    }

    // 5. Execute Update Transaction
    return this.prisma.$transaction(async (tx) => {
      // Record historical slug
      await (tx as any).merchantSlugHistory.create({
        data: {
          merchantProfileId: merchantId,
          oldSlug: (merchant as any).slug,
          newSlug: newSlug,
        },
      });

      // Update current profile
      return tx.merchantProfile.update({
        where: { id: merchantId },
        data: {
          slug: newSlug,
          lastSlugChangeAt: new Date(),
        },
      } as any);
    });
  }

  async followMerchant(userId: string, merchantId: string) {
    const merchant = await this.prisma.merchantProfile.findUnique({
      where: { id: merchantId },
    });
    if (!merchant) throw new NotFoundException("Merchant not found");

    if (merchant.userId === userId) {
      throw new BadRequestException("You cannot follow your own business");
    }

    try {
      return await (this.prisma as any).follow.create({
        data: {
          followerId: userId,
          merchantId: merchantId,
        },
      });
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new BadRequestException(
          "You are already following this merchant",
        );
      }
      throw error;
    }
  }

  async unfollowMerchant(userId: string, merchantId: string) {
    try {
      await (this.prisma as any).follow.delete({
        where: {
          followerId_merchantId: {
            followerId: userId,
            merchantId: merchantId,
          },
        },
      });
      return { success: true };
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new BadRequestException("You are not following this merchant");
      }
      throw error;
    }
  }

  async isFollowing(userId: string, merchantId: string) {
    const follow = await (this.prisma as any).follow.findUnique({
      where: {
        followerId_merchantId: {
          followerId: userId,
          merchantId: merchantId,
        },
      },
    });
    return !!follow;
  }

  async updatePreferences(merchantId: string, dto: UpdatePreferencesDto) {
    const merchant = await this.prisma.merchantProfile.findUnique({
      where: { id: merchantId },
    });
    if (!merchant) throw new NotFoundException("Merchant profile not found");

    return this.prisma.merchantProfile.update({
      where: { id: merchantId },
      data: {
        notificationPreferences: dto.notificationPreferences as any,
      },
    });
  }

  async getBalanceSummary(merchantId: string) {
    // Fire concurrent fast aggregates offloaded to DB (leveraging the composite indexes)
    const [escrowResult, availableResult, revenueResult, pendingResult] =
      await Promise.all([
        this.prisma.order.aggregate({
          where: { merchantId, status: { in: ["PAID", "DISPATCHED"] } },
          _sum: { totalAmountKobo: true },
        }),
        this.prisma.order.aggregate({
          where: { merchantId, payoutStatus: "COMPLETED" },
          _sum: { totalAmountKobo: true },
        }),
        this.prisma.order.aggregate({
          where: { merchantId, status: "COMPLETED" },
          _sum: { totalAmountKobo: true },
        }),
        this.prisma.order.aggregate({
          where: { merchantId, payoutStatus: "PENDING", status: "COMPLETED" },
          _sum: { totalAmountKobo: true },
        }),
      ]);

    return {
      escrowBalanceKobo: (escrowResult._sum.totalAmountKobo || 0n).toString(),
      availableBalanceKobo: (
        availableResult._sum.totalAmountKobo || 0n
      ).toString(),
      totalRevenueKobo: (revenueResult._sum.totalAmountKobo || 0n).toString(),
      pendingPayoutsKobo: (pendingResult._sum.totalAmountKobo || 0n).toString(),
    };
  }
}
