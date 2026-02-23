import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { VerificationStatus, OrderStatus, UserRole } from '@hardware-os/shared';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  
  constructor(private prisma: PrismaService) {}

  async getPlatformStats() {
    // Parallelize these independent global queries for speed
    const [
      totalMerchants,
      verifiedMerchants,
      totalBuyers,
      totalOrders,
      totalRevenueKobo
    ] = await Promise.all([
      this.prisma.merchantProfile.count(),
      this.prisma.merchantProfile.count({ where: { verification: 'VERIFIED' } }),
      this.prisma.user.count({ where: { role: 'BUYER' } }),
      this.prisma.order.count(),
      this.prisma.payment.aggregate({
        _sum: { amountKobo: true },
        where: { status: 'SUCCESS', direction: 'INFLOW' }
      })
    ]);

    return {
      totalMerchants,
      verifiedMerchants,
      pendingMerchants: totalMerchants - verifiedMerchants,
      totalBuyers,
      totalUsers: totalMerchants + totalBuyers,
      totalOrders,
      totalRevenueKobo: totalRevenueKobo._sum.amountKobo || BigInt(0),
    };
  }

  async verifyMerchant(merchantId: string) {
    const merchant = await this.prisma.merchantProfile.findUnique({
      where: { id: merchantId }
    });

    if (!merchant) {
      throw new NotFoundException('Merchant profile not found');
    }

    return this.prisma.merchantProfile.update({
      where: { id: merchantId },
      data: { verification: VerificationStatus.VERIFIED },
    });
  }

  async rejectMerchant(merchantId: string) {
    const merchant = await this.prisma.merchantProfile.findUnique({
      where: { id: merchantId }
    });

    if (!merchant) {
      throw new NotFoundException('Merchant profile not found');
    }

    return this.prisma.merchantProfile.update({
      where: { id: merchantId },
      data: { verification: VerificationStatus.REJECTED },
    });
  }

  async getPendingMerchants() {
    return this.prisma.merchantProfile.findMany({
      where: {
        verification: VerificationStatus.UNVERIFIED,
      },
      include: {
        user: {
          select: {
            email: true,
            fullName: true,
            phone: true,
          }
        },
      },
      orderBy: {
        createdAt: 'asc',
      }
    });
  }

  async getAllOrders() {
    return this.prisma.order.findMany({
      include: {
        merchant: {
          select: { businessName: true }
        },
        buyer: {
          select: { fullName: true, email: true }
        },
        quote: {
          include: {
            rfq: {
              select: { 
                 quantity: true, 
                 product: { select: { name: true, unit: true } } 
              }
            }
          }
        },
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async forceResolveOrder(orderId: string, status: any, adminUserId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.prisma.$transaction(async (tx) => {
       const updatedOrder = await tx.order.update({
         where: { id: orderId },
         data: { status }
       });

       await tx.orderEvent.create({
          data: {
             orderId,
             fromStatus: order.status,
             toStatus: status,
             triggeredBy: adminUserId,
             metadata: { description: 'Order manually overridden by System Administrator' },
          }
       });

       return updatedOrder;
    });
  }

  async deleteProduct(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      throw new NotFoundException('Product not found in the Catalogue');
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: {
        isActive: false,
        deletedAt: new Date()
      }
    });
  }

  async getAllProducts() {
    return this.prisma.product.findMany({
      include: {
        merchant: {
          select: { businessName: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getGlobalAnalytics() {
    const [totalRfqs, totalQuotes, totalOrders] = await Promise.all([
      this.prisma.rFQ.count(),
      this.prisma.quote.count(),
      this.prisma.order.count(),
    ]);

    // Financial calculations
    const gmvAggregate = await this.prisma.order.aggregate({
      where: {
        status: { in: ['PAID', 'DISPATCHED', 'DELIVERED'] }
      },
      _sum: { totalAmountKobo: true }
    });

    const escrowAggregate = await this.prisma.order.aggregate({
      where: {
        status: { in: ['PAID', 'DISPATCHED'] }
      },
      _sum: { totalAmountKobo: true }
    });

    // Market Intelligence: Top Requested Categories via RFQs
    const topCategoriesRaw = await this.prisma.rFQ.findMany({
      select: {
        product: {
          select: { categoryTag: true }
        }
      }
    });

    // Reduce into category counts
    const categoryCounts: Record<string, number> = {};
    topCategoriesRaw.forEach(rfq => {
      const tag = rfq.product?.categoryTag || 'Unknown';
      categoryCounts[tag] = (categoryCounts[tag] || 0) + 1;
    });

    const topCategories = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));

    return {
      funnel: {
        totalRfqs,
        totalQuotes,
        totalOrders,
      },
      financials: {
        gmvKobo: Number(gmvAggregate._sum.totalAmountKobo || 0),
        escrowLiabilityKobo: Number(escrowAggregate._sum.totalAmountKobo || 0),
      },
      market: {
        topCategories
      }
    };
  }

  async getSystemAlerts() {
    const alerts = [];
    
    // Check 1: Stuck Escrow
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const stuckOrders = await this.prisma.order.count({
      where: {
        status: OrderStatus.PAID,
        updatedAt: { lt: fortyEightHoursAgo }
      }
    });

    if (stuckOrders > 0) {
      alerts.push({
        id: 'escrow-timeout',
        type: 'CRITICAL',
        title: 'Escrow Timeout Warning',
        message: `${stuckOrders} orders have been stuck in PAID for over 48 hours without dispatch.`,
        actionLink: '/admin/orders?filter=stuck'
      });
    }

    // Check 2: Verification Choke
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const chokeSize = await this.prisma.merchantProfile.count({
      where: {
        verification: VerificationStatus.UNVERIFIED,
        updatedAt: { lt: twentyFourHoursAgo }
      }
    });

    if (chokeSize > 0) {
      alerts.push({
        id: 'verification-choke',
        type: 'WARNING',
        title: 'Verification Queue Bloat',
        message: `${chokeSize} merchants have been waiting > 24 hours for approval.`,
        actionLink: '/admin/merchants'
      });
    }

    return alerts;
  }

  async exportOrders(startDate?: string, endDate?: string) {
    const whereClause: any = { status: OrderStatus.DELIVERED };
    
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate);
      if (endDate) whereClause.createdAt.lte = new Date(endDate);
    }

    const orders = await this.prisma.order.findMany({
      where: whereClause,
      include: {
        merchant: { select: { businessName: true } },
        buyer: { select: { fullName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Generate CSV String
    const headers = ['Order ID', 'Date', 'Merchant', 'Buyer', 'Total Kobo', 'Delivery Kobo', 'Status'];
    const rows = orders.map(o => [
      o.id,
      o.createdAt.toISOString(),
      `"${o.merchant.businessName}"`,
      `"${o.buyer.fullName}"`,
      o.totalAmountKobo.toString(),
      o.deliveryFeeKobo.toString(),
      o.status
    ]);

    const csvContent = [headers.join(',')]
      .concat(rows.map(row => row.join(',')))
      .join('\n');

    return csvContent;
  }

  async broadcastMessage(message: string) {
    const verifiedMerchants = await this.prisma.merchantProfile.findMany({
      where: { verification: VerificationStatus.VERIFIED },
      include: { user: true }
    });

    const phoneNumbers = verifiedMerchants.map(m => m.user?.phone).filter(Boolean);

    // MOCK: Integration with Africa's Talking / WhatsApp API
    this.logger.log(`[BROADCAST QUEUE] Transmitting message to ${phoneNumbers.length} merchants.`);
    this.logger.log(`[PAYLOAD]: ${message}`);

    return {
      success: true,
      deliveredTo: phoneNumbers.length,
      message: 'Broadcast initiated successfully'
    };
  }

  async getAllUsers() {
    return this.prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        email: true,
        phone: true,
        fullName: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async promoteToAdmin(userId: string, requestingAdminId: string) {
    if (userId === requestingAdminId) {
      throw new NotFoundException('You cannot modify your own role.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');

    // Update the role
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { role: UserRole.ADMIN },
      select: { id: true, email: true, fullName: true, role: true }
    });

    this.logger.log(`User ${updatedUser.email} promoted to ADMIN by admin ${requestingAdminId}`);
    return updatedUser;
  }

  async deleteUser(userId: string, requestingAdminId: string) {
    if (userId === requestingAdminId) {
      throw new NotFoundException('You cannot delete your own account.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');
    if (user.role === UserRole.ADMIN) {
      throw new NotFoundException('Cannot delete another admin. Demote them first.');
    }

    // Soft delete the user
    await this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() }
    });

    this.logger.warn(`User ${user.email} (${userId}) soft-deleted by admin ${requestingAdminId}`);
    return { success: true, message: `User ${user.email} has been removed.` };
  }

  async changePassword(adminUserId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: adminUserId } });
    if (!user) throw new NotFoundException('Admin user not found.');

    // Verify current password
    const bcrypt = await import('bcrypt');
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new NotFoundException('Current password is incorrect.');
    }

    // Hash new password and update
    const SALT_ROUNDS = 12;
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await this.prisma.user.update({
      where: { id: adminUserId },
      data: { passwordHash }
    });

    this.logger.log(`Admin ${user.email} changed their password.`);
    return { success: true, message: 'Password updated successfully.' };
  }
}
