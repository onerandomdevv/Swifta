import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { UpdateMerchantDto } from "./dto/update-merchant.dto";
import { UpdateBankAccountDto } from "./dto/update-bank-account.dto";
import { UserRole } from "@hardware-os/shared";
import { PaystackClient } from "../payment/paystack.client";
import { NotificationTriggerService } from "../notification/notification-trigger.service";

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
    const merchant = await this.prisma.merchantProfile.findUnique({
      where: { id: merchantId },
      include: {
        user: {
          select: {
            email: true,
            phone: true,
          },
        },
      },
    });
    if (!merchant) throw new NotFoundException("Merchant profile not found");
    return merchant;
  }

  async getPublicProfile(merchantId: string) {
    const merchant = await this.prisma.merchantProfile.findUnique({
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
          },
        },
      },
    });

    if (!merchant) throw new NotFoundException("Merchant not found");

    // We only expose contact info if the merchant is VERIFIED
    const isVerified = merchant.verificationTier === "VERIFIED";

    return {
      id: merchant.id,
      businessName: merchant.businessName,
      businessAddress: merchant.businessAddress,
      businessType: merchant.businessType,
      estYear: merchant.estYear,
      category: merchant.category,
      warehouseLocation: merchant.warehouseLocation,
      distributionCenter: merchant.distributionCenter,
      warehouseCapacity: merchant.warehouseCapacity,
      verificationTier: merchant.verificationTier,
      createdAt: merchant.createdAt,
      dealsClosed: merchant._count.orders,
      profileImage: merchant.profileImage,
      coverImage: merchant.coverImage,
      cacVerified: merchant.cacVerified,
      addressVerified: merchant.addressVerified,
      guarantorVerified: merchant.guarantorVerified,
      bankVerified: merchant.bankVerified,
      averageRating: merchant.averageRating || 0,
      reviewCount: merchant.reviewCount || 0,
      description: merchant.description,
      socialLinks: merchant.socialLinks as Record<string, string>,
      contact: isVerified
        ? {
            email: merchant.user.email,
            phone: merchant.user.phone,
          }
        : null,
    };
  }

  async getAllMerchants() {
    return this.prisma.merchantProfile.findMany({
      where: {
        verificationTier: "VERIFIED",
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
}
