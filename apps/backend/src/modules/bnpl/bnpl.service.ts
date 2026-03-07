import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

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

    // Conditions: 5+ completed orders, 0 disputes, total spend > ₦500k (50,000,000 kobo)
    if (completedOrdersCount >= 5 && disputes === 0 && totalSpendKobo >= BigInt(50000000)) {
      return { 
        eligible: true, 
        maxAmountKobo: (totalSpendKobo / BigInt(2)).toString(), 
        reason: "Based on your order history" 
      };
    }

    return { 
      eligible: false, 
      reason: "Complete more orders to unlock Pay Later", 
      ordersNeeded: Math.max(0, 5 - completedOrdersCount)
    };
  }

  async joinWaitlist(buyerId: string, email: string, phone?: string) {
    // Check if already in waitlist
    const existing = await this.prisma.bnplWaitlist.findFirst({
      where: { userId: buyerId }
    });
    
    if (existing) {
       return { message: "You've been added to the waitlist! You'll be notified when Pay Later launches." };
    }

    await this.prisma.bnplWaitlist.create({
      data: {
        userId: buyerId,
        email,
        phone,
      }
    });
    
    return { message: "You've been added to the waitlist! You'll be notified when Pay Later launches." };
  }
}
