import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { UpdateMerchantDto } from "./dto/update-merchant.dto";
import { VerificationStatus } from "@hardware-os/shared";

@Injectable()
export class MerchantService {
  constructor(private prisma: PrismaService) {}

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
      select: {
        id: true,
        businessName: true,
        businessAddress: true,
        verification: true,
        createdAt: true,
      },
    });
    if (!merchant) throw new NotFoundException("Merchant not found");
    return merchant;
  }

  async updateProfile(merchantId: string, dto: UpdateMerchantDto) {
    const existing = await this.prisma.merchantProfile.findUnique({
      where: { id: merchantId },
    });
    if (!existing) throw new NotFoundException("Merchant profile not found");

    // Build the data to update — only provided fields
    const updateData: Record<string, any> = { ...dto };

    // Progressive onboarding auto-advance
    const merged = { ...existing, ...dto };

    let newStep = existing.onboardingStep;

    // Step 1 → 2: When businessAddress and cacNumber are provided
    if (newStep === 1 && merged.businessAddress && merged.cacNumber) {
      newStep = 2;
    }

    // Step 2 → 3: When bankCode, bankAccountNo, and bankAccountName are provided
    if (
      newStep === 2 &&
      merged.bankCode &&
      merged.bankAccountNo &&
      merged.bankAccountName
    ) {
      newStep = 3;
    }

    // Step 3 complete: Set verification = PENDING
    if (newStep === 3 && existing.onboardingStep < 3) {
      updateData.verification = VerificationStatus.PENDING;
    }

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
}
