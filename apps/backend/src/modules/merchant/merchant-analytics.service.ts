import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class MerchantAnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getMerchantStats(merchantId: string) {
    if (!merchantId) {
      throw new BadRequestException("Merchant claim is missing");
    }

    const [orders, rfqs] = await Promise.all([
      this.prisma.order.findMany({
        where: { merchantId },
        select: {
          status: true,
          totalAmountKobo: true,
          quoteId: true,
        },
      }),
      this.prisma.rfq.findMany({
        where: {
          merchantId,
        },
        select: {
          status: true,
        },
      }),
    ]);

    const pipelineValue = orders
      .filter((o) => o.status !== "CANCELLED" && o.status !== "DISPUTE")
      .reduce((sum, o) => sum + BigInt(o.totalAmountKobo || 0), 0n);

    const completedOrders = orders.filter(
      (o) => o.status === "COMPLETED",
    ).length;
    const completedQuotedOrders = orders.filter(
      (o) => o.status === "COMPLETED" && o.quoteId != null,
    ).length;
    const totalRfqs = rfqs.length;
    const openRfqs = rfqs.filter((r) => r.status === "OPEN").length;
    const quotedRfqs = rfqs.filter((r) => r.status === "QUOTED").length;

    const acceptanceRate =
      totalRfqs > 0 ? Math.round((completedQuotedOrders / totalRfqs) * 100) : 0;

    return {
      pipelineValue: pipelineValue.toString(),
      completedOrders,
      totalRfqs,
      openRfqs,
      quotedRfqs,
      acceptanceRate,
      totalOrders: orders.length,
    };
  }
}
