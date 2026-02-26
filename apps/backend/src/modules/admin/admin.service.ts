import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { VerificationStatus, OrderStatus, UserRole } from '@hardware-os/shared';
import * as bcrypt from 'bcrypt';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

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

    // MOCK: Integration with Email / In-App Notification API
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

  async promoteToAdmin(userId: string, targetRole: UserRole, requestingAdminId: string) {
    if (userId === requestingAdminId) {
      throw new BadRequestException('You cannot modify your own role.');
    }

    if (![UserRole.SUPER_ADMIN, UserRole.OPERATOR, UserRole.SUPPORT].includes(targetRole)) {
      throw new BadRequestException('Invalid target role. Must be SUPER_ADMIN, OPERATOR, or SUPPORT.');
    }

    const user = await this.prisma.user.findUnique({ 
      where: { id: userId },
      include: { adminProfile: true }
    });
    if (!user) throw new NotFoundException('User not found.');

    return this.prisma.$transaction(async (tx) => {
      // 1. Update the User role
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { role: targetRole },
        select: { id: true, email: true, fullName: true, role: true }
      });

      // 2. Map logical role to integer access level
      const accessLevelText = targetRole === UserRole.SUPER_ADMIN ? 'HIGH' : targetRole === UserRole.OPERATOR ? 'MEDIUM' : 'LOW';

      // 3. Upsert the AdminProfile to attach the new staff schema
      await tx.adminProfile.upsert({
        where: { userId: userId },
        update: { 
          accessLevel: accessLevelText, 
          department: 'Internal Operations' 
        },
        create: { 
          userId: userId, 
          accessLevel: accessLevelText, 
          department: 'Internal Operations' 
        }
      });

      this.logger.log(`User ${updatedUser.email} granted role ${targetRole} by admin ${requestingAdminId}`);
      return updatedUser;
    });
  }

  async deleteUser(userId: string, requestingAdminId: string) {
    if (userId === requestingAdminId) {
      throw new NotFoundException('You cannot delete your own account.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');
    if (user.role === UserRole.SUPER_ADMIN) {
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
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect.');
    }

    // Hash new password and update
    const SALT_ROUNDS = 10;
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await this.prisma.user.update({
      where: { id: adminUserId },
      data: { passwordHash }
    });

    // Invalidate refresh tokens for this user globally
    await this.redis.del(`refresh_token:${adminUserId}`);

    this.logger.log(`Admin ${user.email} changed their password.`);
    return { success: true, message: 'Password updated successfully.' };
  }

  // ─── Staff Access Token Management ───

  async getAccessTokens() {
    const tokens = await this.prisma.staffAccessToken.findMany({
      select: {
        id: true,
        role: true,
        label: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        creator: { select: { fullName: true, email: true } }
      },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }]
    });
    return tokens;
  }

  async createAccessToken(role: UserRole, plainToken: string, adminUserId: string) {
    if (![UserRole.OPERATOR, UserRole.SUPPORT].includes(role)) {
      throw new BadRequestException('Access tokens can only be created for OPERATOR or SUPPORT roles.');
    }

    const admin = await this.prisma.user.findUnique({ where: { id: adminUserId } });
    if (!admin) throw new NotFoundException('Admin user not found.');

    const SALT_ROUNDS = 10;
    const tokenHash = await bcrypt.hash(plainToken, SALT_ROUNDS);

    // Deactivate any existing active tokens for this role
    await this.prisma.staffAccessToken.updateMany({
      where: { role, isActive: true },
      data: { isActive: false }
    });

    // Create the new active token
    const token = await this.prisma.staffAccessToken.create({
      data: {
        role,
        tokenHash,
        label: `${role} Token`,
        createdBy: adminUserId,
      },
      select: {
        id: true,
        role: true,
        label: true,
        createdAt: true,
      }
    });

    this.logger.log(`New access token created for role ${role} by admin ${adminUserId}`);
    return token;
  }

  async revokeAccessToken(tokenId: string, adminUserId: string) {
    const token = await this.prisma.staffAccessToken.findUnique({ where: { id: tokenId } });
    if (!token) throw new NotFoundException('Access token not found.');

    await this.prisma.staffAccessToken.update({
      where: { id: tokenId },
      data: { isActive: false }
    });

    this.logger.warn(`Access token ${tokenId} (${token.role}) revoked by admin ${adminUserId}`);
    return { success: true, message: `${token.role} access token has been revoked.` };
  }

  async verifyStaffToken(userId: string, userRole: UserRole, plainToken: string) {
    const activeToken = await this.prisma.staffAccessToken.findFirst({
      where: { role: userRole, isActive: true }
    });

    if (!activeToken) {
      throw new BadRequestException('No active access token exists for your role. Contact your Super Admin.');
    }

    const isValid = await bcrypt.compare(plainToken, activeToken.tokenHash);
    if (!isValid) {
      throw new BadRequestException('Invalid access token. Please try again or contact your Super Admin.');
    }

    return { verified: true };
  }

  async getPendingStaff() {
    return this.prisma.user.findMany({
      where: {
        adminProfile: { approvalStatus: 'PENDING' },
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        createdAt: true,
        adminProfile: {
          select: { approvalStatus: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async approveStaff(staffId: string, adminId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: staffId },
      include: { adminProfile: true }
    });

    if (!user || !user.adminProfile) {
      throw new NotFoundException('Staff profile not found.');
    }

    if (user.adminProfile.approvalStatus !== 'PENDING') {
      throw new BadRequestException(`Staff status is ${user.adminProfile.approvalStatus}, only PENDING can be approved.`);
    }

    await this.prisma.adminProfile.update({
      where: { userId: staffId },
      data: { approvalStatus: 'APPROVED' }
    });

    this.logger.log(`Staff ${staffId} approved by admin ${adminId}`);
    return { success: true, message: 'Staff member approved successfully.' };
  }
}
