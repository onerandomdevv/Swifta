import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class BuyerDashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats(userId: string) {
    const [rfqs, orders] = await Promise.all([
      this.prisma.rfq.findMany({
        where: { buyerId: userId },
        select: {
          status: true,
        },
      }),
      this.prisma.order.findMany({
        where: { buyerId: userId },
        select: {
          status: true,
          totalAmountKobo: true,
        },
      }),
    ]);

    // Pending Quotes (Action Required): An RFQ where the merchant has provided a Quote.
    const pendingQuotesCount = rfqs.filter((r) => r.status === "QUOTED").length;

    // Active Orders: Orders that are not COMPLETED or CANCELLED, but have been initialized/paid.
    const activeOrdersCount = orders.filter(
      (o) => o.status !== "COMPLETED" && o.status !== "CANCELLED",
    ).length;

    // Total Spending (Escrow Locked): PAID or DISPATCHED
    const escrowLocked = orders
      .filter((o) => o.status === "PAID" || o.status === "DISPATCHED")
      .reduce((sum, o) => sum + BigInt(o.totalAmountKobo || 0), 0n);

    // Total Orders (All Time)
    const totalOrdersCount = orders.length;

    return {
      activeOrdersCount,
      pendingQuotesCount,
      totalOrdersCount,
      totalSpendingKobo: escrowLocked.toString(),
      recentOrders: orders.slice(0, 5), // Optional: could add more details if needed
    };
  }
}
