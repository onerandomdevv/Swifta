import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/** Minimum completed orders required for BNPL eligibility */
const MIN_COMPLETED_ORDERS = 5;
/** Minimum total spend in kobo (₦500,000) for BNPL eligibility */
const MIN_TOTAL_SPEND_KOBO = BigInt(50000000);

@Injectable()
export class BnplService {
  constructor(private readonly prisma: PrismaService) {}

  async checkEligibility(buyerId: string) {
    // Check buyer's order history: count completed orders, total spend, any disputes
    const orders = await this.prisma.order.findMany({
      where: { buyerId, status: 'COMPLETED' },
    });
    
    const disputes = await this.prisma.order.count({
      where: { buyerId, disputeStatus: { not: 'NONE' } }
    });

    const completedOrdersCount = orders.length;
    let totalSpendKobo = BigInt(0);
    for (const order of orders) {
      totalSpendKobo += order.totalAmountKobo;
    }

    if (completedOrdersCount >= MIN_COMPLETED_ORDERS && disputes === 0 && totalSpendKobo >= MIN_TOTAL_SPEND_KOBO) {
      return { 
        eligible: true, 
        maxAmountKobo: (totalSpendKobo / BigInt(2)).toString(), 
        reason: "Based on your order history" 
      };
    }

    return { 
      eligible: false, 
      reason: "Complete more orders to unlock Pay Later", 
      ordersNeeded: Math.max(0, MIN_COMPLETED_ORDERS - completedOrdersCount)
    };
  }

  async joinWaitlist(buyerId: string, email: string, phone?: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: buyerId },
      });

      if (!user) {
        throw new Error("User not found");
      }

      const existing = await this.prisma.bnplWaitlist.findUnique({
        where: { userId: buyerId },
      });

      if (existing) {
        return {
          message:
            "You're already on the waitlist! We'll notify you when Pay Later launches.",
        };
      }

      await this.prisma.bnplWaitlist.create({
        data: {
          userId: buyerId,
          email,
          phone,
        },
      });

      return {
        message:
          "You've been added to the waitlist! You'll be notified when Pay Later launches.",
      };
    } catch (error) {
      // In case of any race condition/error, return the standard message
      return {
        message:
          "You're already on the waitlist! We'll notify you when Pay Later launches.",
      };
    }
  }
}
