import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../../prisma/prisma.service";
import { VerificationTier } from "@swifta/shared";

@Injectable()
export class MerchantVerifiedGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const merchantId = request.merchantId;

    if (!merchantId) {
      return true; // Not a merchant context or handled by roles guard
    }

    const merchant = await this.prisma.merchantProfile.findUnique({
      where: { id: merchantId },
    });

    if (
      !merchant ||
      merchant.verificationTier !== (VerificationTier.TIER_3 as any)
    ) {
      throw new ForbiddenException("Merchant account not verified");
    }

    return true;
  }
}
