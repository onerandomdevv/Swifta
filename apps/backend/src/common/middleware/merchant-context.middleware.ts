import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@hardware-os/shared';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MerchantContextMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const user = (req as any).user;

    if (user && user.role === UserRole.MERCHANT) {
       const merchant = await this.prisma.merchantProfile.findUnique({
           where: { userId: user.sub }
       });
       if (merchant) {
           (req as any).merchantId = merchant.id;
       }
    }
    next();
  }
}
