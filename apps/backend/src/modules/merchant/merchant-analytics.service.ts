import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class MerchantAnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getMerchantStats(
    merchantId: string,
    startDate?: string,
    endDate?: string,
  ) {
    if (!merchantId) {
      throw new BadRequestException("Merchant claim is missing");
    }

    const where: any = { merchantId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const orders = await this.prisma.order.findMany({
      where,
      select: {
        status: true,
        totalAmountKobo: true,
      },
    });

    const pipelineValue = orders
      .filter((o) => o.status !== "CANCELLED" && o.status !== "DISPUTE")
      .reduce((sum, o) => sum + BigInt(o.totalAmountKobo || 0), 0n);

    const completedOrders = orders.filter(
      (o) => o.status === "COMPLETED" || o.status === "DELIVERED",
    ).length;

    return {
      pipelineValue: pipelineValue.toString(),
      completedOrders,
      totalOrders: orders.length,
    };
  }
}
