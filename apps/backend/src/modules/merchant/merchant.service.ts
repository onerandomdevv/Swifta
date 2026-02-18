import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateMerchantDto } from './dto/update-merchant.dto';

@Injectable()
export class MerchantService {
  constructor(private prisma: PrismaService) {}

  async getProfile(merchantId: string) {
    const merchant = await this.prisma.merchantProfile.findUnique({
      where: { id: merchantId },
    });
    if (!merchant) throw new NotFoundException('Merchant not found');
    return merchant;
  }

  async getPublicProfile(merchantId: string) {
    const merchant = await this.prisma.merchantProfile.findUnique({
      where: { id: merchantId },
      select: {
        id: true,
        businessName: true,
        verification: true,
        // bgImgUrl: false, // Field does not exist in schema
        // Exclude sensitive fields
      }
    });
    if (!merchant) throw new NotFoundException('Merchant not found');
    return merchant;
  }

  async updateProfile(merchantId: string, dto: UpdateMerchantDto) {
    return this.prisma.merchantProfile.update({
      where: { id: merchantId },
      data: {
        ...dto,
      },
    });
  }

  async updateOnboardingStep(merchantId: string, step: number) {
    return this.prisma.merchantProfile.update({
        where: { id: merchantId },
        data: { onboardingStep: step }
    });
  }
}
