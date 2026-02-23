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

  async getAllMerchants() {
    return this.prisma.merchantProfile.findMany({
      where: {
        verification: 'VERIFIED'
      },
      select: {
        id: true,
        businessName: true,
        verification: true
      },
      orderBy: {
        businessName: 'asc'
      }
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

    // Step 4 → 5: Bank details complete (bankCode, bankAccountNo, bankAccountName)
    if (
      newStep === 4 &&
      merged.bankCode &&
      merged.bankAccountNo &&
      merged.bankAccountName
    ) {
      newStep = 5;
    }

    // Step 5 reached: Set verification = PENDING (review & submit step)
    if (newStep === 5 && existing.onboardingStep < 5) {
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
