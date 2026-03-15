import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { OrderStatus, UserRole } from "@swifta/shared";
import * as bcrypt from "bcrypt";
import { RedisService } from "../../redis/redis.service";
import { AuditLogService } from "./audit-log.service";
import { VerificationService } from "../verification/verification.service";

import { NotificationTriggerService } from "../notification/notification-trigger.service";

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private notifications: NotificationTriggerService,
    private auditLog: AuditLogService,
    private verificationService: VerificationService,
  ) {}

  async getPlatformStats() {
    // Parallelize these independent global queries for speed
    const [
      totalMerchants,
      verifiedMerchants,
      pendingVerificationCount,
      totalBuyers,
      totalOrders,
      totalRevenueKobo,
    ] = await Promise.all([
      this.prisma.merchantProfile.count(),
      this.prisma.merchantProfile.count({
        where: { verificationTier: { in: ["VERIFIED", "TRUSTED"] } },
      }),
      this.prisma.merchantProfile.count({
        where: {
          verificationRequests: { some: { status: "PENDING" } },
        },
      }),
      this.prisma.user.count({ where: { role: "BUYER" } }),
      this.prisma.order.count(),
      this.prisma.payment.aggregate({
        _sum: { amountKobo: true },
        where: { status: "SUCCESS", direction: "INFLOW" },
      }),
    ]);

    return {
      totalMerchants,
      verifiedMerchants,
      pendingMerchants: pendingVerificationCount,
      totalBuyers,
      totalUsers: totalMerchants + totalBuyers,
      totalOrders,
      totalRevenueKobo: totalRevenueKobo._sum.amountKobo || BigInt(0),
    };
  }

  async verifyMerchant(merchantId: string, adminId: string) {
    // 1. Find the merchant
    const merchant = await this.prisma.merchantProfile.findUnique({
      where: { id: merchantId },
      include: {
        verificationRequests: {
          where: { status: "PENDING" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!merchant) {
      throw new NotFoundException("Merchant profile not found");
    }

    // 2. Locate the pending request
    const pendingRequest = merchant.verificationRequests[0];
    if (!pendingRequest) {
      // Fallback: If no pending request, just update the tier directly (legacy/manual flow)
      return this.prisma.merchantProfile.update({
        where: { id: merchantId },
        data: { verificationTier: "VERIFIED", verifiedAt: new Date() },
      });
    }

    // 3. Use VerificationService to perform atomic transition
    return this.verificationService.reviewRequest(pendingRequest.id, adminId, {
      decision: "APPROVED",
    });
  }

  async rejectMerchant(merchantId: string, reason?: string, adminId?: string) {
    const merchant = await this.prisma.merchantProfile.findUnique({
      where: { id: merchantId },
    });

    if (!merchant) {
      throw new NotFoundException("Merchant profile not found");
    }

    const updated = await this.prisma.merchantProfile.update({
      where: { id: merchantId },
      data: { updatedAt: new Date() },
    });

    await this.notifications.triggerMerchantRejected(merchant.userId, reason);

    if (adminId) {
      await this.auditLog.log(
        adminId,
        "REJECT_MERCHANT",
        "MerchantProfile",
        merchantId,
        { reason },
      );
    }

    return updated;
  }

  async getPendingMerchants() {
    // Fetch all merchants who have at least one verification request
    const merchants = await this.prisma.merchantProfile.findMany({
      where: {
        verificationRequests: {
          some: {},
        },
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        verificationRequests: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Filter to only merchants whose LATEST request is PENDING or REJECTED
    return merchants.filter((m) => {
      const latest = m.verificationRequests[0];
      return (
        latest && (latest.status === "PENDING" || latest.status === "REJECTED")
      );
    });
  }

  async getAllOrders() {
    return this.prisma.order.findMany({
      include: {
        merchantProfile: {
          select: { businessName: true },
        },
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
        product: { select: { name: true, unit: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async forceResolveOrder(
    orderId: string,
    status: OrderStatus,
    adminUserId: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status },
      });

      await tx.orderEvent.create({
        data: {
          orderId,
          fromStatus: order.status,
          toStatus: status,
          triggeredBy: adminUserId,
          metadata: {
            description: "Order manually overridden by System Administrator",
          },
        },
      });

      return updatedOrder;
    });
  }

  async deleteProduct(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException("Product not found in the Catalogue");
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });
  }

  async getAllProducts() {
    return this.prisma.product.findMany({
      include: {
        merchantProfile: {
          select: { businessName: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getGlobalAnalytics() {
    const [totalOrders] = await Promise.all([
      this.prisma.order.count(),
    ]);

    // Financial calculations
    const gmvAggregate = await this.prisma.order.aggregate({
      where: {
        status: { in: ["PAID", "DISPATCHED", "DELIVERED"] },
      },
      _sum: { totalAmountKobo: true },
    });

    const escrowAggregate = await this.prisma.order.aggregate({
      where: {
        status: { in: ["PAID", "DISPATCHED"] },
      },
      _sum: { totalAmountKobo: true },
    });

    // Market Intelligence: Top Requested Categories via Orders
    const topCategoriesRaw = await this.prisma.order.findMany({
      select: {
        product: {
          select: { categoryTag: true },
        },
      },
    });

    // Reduce into category counts
    const categoryCounts: Record<string, number> = {};
    topCategoriesRaw.forEach((order) => {
      const tag = order.product?.categoryTag || "Unknown";
      categoryCounts[tag] = (categoryCounts[tag] || 0) + 1;
    });

    const topCategories = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));

    return {
      funnel: {
        totalOrders,
      },
      financials: {
        gmvKobo: Number(gmvAggregate._sum.totalAmountKobo || 0),
        escrowLiabilityKobo: Number(escrowAggregate._sum.totalAmountKobo || 0),
      },
      market: {
        topCategories,
      },
    };
  }

  async getSystemAlerts() {
    const alerts = [];

    // Check 1: Stuck Escrow
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const stuckOrders = await this.prisma.order.count({
      where: {
        status: OrderStatus.PAID,
        updatedAt: { lt: fortyEightHoursAgo },
      },
    });

    if (stuckOrders > 0) {
      alerts.push({
        id: "escrow-timeout",
        type: "CRITICAL",
        title: "Escrow Timeout Warning",
        message: `${stuckOrders} orders have been stuck in PAID for over 48 hours without dispatch.`,
        actionLink: "/admin/orders?filter=stuck",
      });
    }

    // Check 2: Verification Choke
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const chokeSize = await this.prisma.merchantProfile.count({
      where: {
        verificationRequests: {
          some: {
            status: "PENDING",
            createdAt: { lt: twentyFourHoursAgo },
          },
        },
      },
    });

    if (chokeSize > 0) {
      alerts.push({
        id: "verification-choke",
        type: "WARNING",
        title: "Verification Queue Bloat",
        message: `${chokeSize} merchants have been waiting > 24 hours for approval.`,
        actionLink: "/admin/merchants",
      });
    }

    // Check 3: Pending Payout Requests
    const pendingPayouts = await this.prisma.payoutRequest.count({
      where: {
        status: "PENDING",
        createdAt: { lt: twentyFourHoursAgo },
      },
    });

    if (pendingPayouts > 0) {
      alerts.push({
        id: "payout-delay",
        type: "WARNING",
        title: "Delayed Payout Processing",
        message: `${pendingPayouts} payout requests have been waiting > 24 hours for processing.`,
        actionLink: "/admin/payouts",
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
        merchantProfile: { select: { businessName: true } },
        user: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Generate CSV String
    const headers = [
      "Order ID",
      "Date",
      "Merchant",
      "Buyer",
      "Total Kobo",
      "Delivery Kobo",
      "Status",
    ];
    const rows = orders.map((o) => [
      o.id,
      o.createdAt.toISOString(),
      `"${o.merchantProfile?.businessName}"`,
      `"${[o.user?.firstName, o.user?.lastName].filter(Boolean).join(" ")}"`,
      o.totalAmountKobo.toString(),
      o.deliveryFeeKobo.toString(),
      o.status,
    ]);

    const csvContent = [headers.join(",")]
      .concat(rows.map((row) => row.join(",")))
      .join("\n");

    return csvContent;
  }

  async broadcastMessage(message: string) {
    const verifiedMerchants = await this.prisma.merchantProfile.findMany({
      where: { verificationTier: { in: ["VERIFIED", "TRUSTED"] } },
      include: { user: true },
    });

    const phoneNumbers = verifiedMerchants
      .map((m) => m.user?.phone)
      .filter(Boolean);

    // MOCK: Integration with Email / In-App Notification API
    this.logger.log(
      `[BROADCAST QUEUE] Transmitting message to ${phoneNumbers.length} merchants.`,
    );
    this.logger.log(`[PAYLOAD]: ${message}`);

    return {
      success: true,
      deliveredTo: phoneNumbers.length,
      message: "Broadcast initiated successfully",
    };
  }

  async getAllUsers() {
    return this.prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        middleName: true,
        lastName: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        merchantProfile: {
          select: { verificationTier: true },
        },
        adminProfile: {
          select: { approvalStatus: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async promoteToAdmin(
    userId: string,
    targetRole: UserRole,
    requestingAdminId: string,
  ) {
    if (userId === requestingAdminId) {
      throw new BadRequestException("You cannot modify your own role.");
    }

    if (
      ![UserRole.SUPER_ADMIN, UserRole.OPERATOR, UserRole.SUPPORT].includes(
        targetRole,
      )
    ) {
      throw new BadRequestException(
        "Invalid target role. Must be SUPER_ADMIN, OPERATOR, or SUPPORT.",
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { adminProfile: true },
    });
    if (!user) throw new NotFoundException("User not found.");

    return this.prisma.$transaction(async (tx) => {
      // 1. Update the User role
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { role: targetRole },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      });

      // 2. Map logical role to integer access level
      const accessLevelText =
        targetRole === UserRole.SUPER_ADMIN
          ? "HIGH"
          : targetRole === UserRole.OPERATOR
            ? "MEDIUM"
            : "LOW";

      // 3. Upsert the AdminProfile to attach the new staff schema
      await tx.adminProfile.upsert({
        where: { userId: userId },
        update: {
          accessLevel: accessLevelText,
          department: "Internal Operations",
        },
        create: {
          userId: userId,
          accessLevel: accessLevelText,
          department: "Internal Operations",
        },
      });

      this.logger.log(
        `User ${updatedUser.email} granted role ${targetRole} by admin ${requestingAdminId}`,
      );
      return updatedUser;
    });
  }

  async deleteUser(userId: string, requestingAdminId: string) {
    if (userId === requestingAdminId) {
      throw new NotFoundException("You cannot delete your own account.");
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found.");
    if (user.role === UserRole.SUPER_ADMIN) {
      throw new NotFoundException(
        "Cannot delete another admin. Demote them first.",
      );
    }

    // Soft delete the user
    await this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    });

    this.logger.warn(
      `User ${user.email} (${userId}) soft-deleted by admin ${requestingAdminId}`,
    );
    return { success: true, message: `User ${user.email} has been removed.` };
  }

  async changePassword(
    adminUserId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: adminUserId },
    });
    if (!user) throw new NotFoundException("Admin user not found.");

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new BadRequestException("Current password is incorrect.");
    }

    // Hash new password and update
    const SALT_ROUNDS = 10;
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await this.prisma.user.update({
      where: { id: adminUserId },
      data: { passwordHash },
    });

    // Invalidate refresh tokens for this user globally
    await this.redis.del(`refresh_token:${adminUserId}`);

    this.logger.log(`Admin ${user.email} changed their password.`);
    return { success: true, message: "Password updated successfully." };
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
        user: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    });
    return tokens;
  }

  async createAccessToken(
    role: UserRole,
    plainToken: string,
    adminUserId: string,
  ) {
    if (![UserRole.OPERATOR, UserRole.SUPPORT].includes(role)) {
      throw new BadRequestException(
        "Access tokens can only be created for OPERATOR or SUPPORT roles.",
      );
    }

    const admin = await this.prisma.user.findUnique({
      where: { id: adminUserId },
    });
    if (!admin) throw new NotFoundException("Admin user not found.");

    const SALT_ROUNDS = 10;
    const tokenHash = await bcrypt.hash(plainToken, SALT_ROUNDS);

    // Deactivate any existing active tokens for this role
    await this.prisma.staffAccessToken.updateMany({
      where: { role, isActive: true },
      data: { isActive: false },
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
      },
    });

    this.logger.log(
      `New access token created for role ${role} by admin ${adminUserId}`,
    );
    return token;
  }

  async revokeAccessToken(tokenId: string, adminUserId: string) {
    const token = await this.prisma.staffAccessToken.findUnique({
      where: { id: tokenId },
    });
    if (!token) throw new NotFoundException("Access token not found.");

    await this.prisma.staffAccessToken.update({
      where: { id: tokenId },
      data: { isActive: false },
    });

    this.logger.warn(
      `Access token ${tokenId} (${token.role}) revoked by admin ${adminUserId}`,
    );
    return {
      success: true,
      message: `${token.role} access token has been revoked.`,
    };
  }

  async verifyStaffToken(
    userId: string,
    userRole: UserRole,
    plainToken: string,
  ) {
    const activeToken = await this.prisma.staffAccessToken.findFirst({
      where: { role: userRole, isActive: true },
    });

    if (!activeToken) {
      throw new BadRequestException(
        "No active access token exists for your role. Contact your Super Admin.",
      );
    }

    const isValid = await bcrypt.compare(plainToken, activeToken.tokenHash);
    if (!isValid) {
      throw new BadRequestException(
        "Invalid access token. Please try again or contact your Super Admin.",
      );
    }

    return { verified: true };
  }

  async getPendingStaff() {
    return this.prisma.user.findMany({
      where: {
        adminProfile: { approvalStatus: "PENDING" },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
        adminProfile: {
          select: { approvalStatus: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async approveStaff(staffId: string, adminId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: staffId },
      include: { adminProfile: true },
    });

    if (!user || !user.adminProfile) {
      throw new NotFoundException("Staff profile not found.");
    }

    if (user.adminProfile.approvalStatus !== "PENDING") {
      throw new BadRequestException(
        `Staff status is ${user.adminProfile.approvalStatus}, only PENDING can be approved.`,
      );
    }

    await this.prisma.adminProfile.update({
      where: { userId: staffId },
      data: { approvalStatus: "APPROVED" },
    });

    await this.auditLog.log(adminId, "APPROVE_STAFF", "AdminProfile", staffId);

    this.logger.log(`Staff ${staffId} approved by admin ${adminId}`);
    return { success: true, message: "Staff member approved successfully." };
  }

  // ─── Payout Management ───

  async getPendingPayouts() {
    // Also including PROCESSING for visibility, or we can just fetch all non-PROCESSED
    return this.prisma.payoutRequest.findMany({
      where: {
        status: {
          in: ["PENDING", "PROCESSING"],
        },
      },
      include: {
        merchantProfile: {
          select: {
            businessName: true,
            user: {
              select: { email: true, phone: true },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async processPayout(payoutId: string, adminUserId: string) {
    const result = await this.prisma.payoutRequest.updateMany({
      where: {
        id: payoutId,
        status: { not: "PROCESSED" },
      },
      data: {
        status: "PROCESSED",
        processedAt: new Date(),
      },
    });

    if (result.count === 0) {
      throw new BadRequestException(
        "Payout request not found or already processed.",
      );
    }

    await this.auditLog.log(
      adminUserId,
      "PROCESS_PAYOUT",
      "PayoutRequest",
      payoutId,
    );

    this.logger.log(
      `Payout request ${payoutId} manually marked as PROCESSED by admin ${adminUserId}`,
    );

    return {
      success: true,
      message: "Payout marked as processed successfully.",
      payout: {
        id: payoutId,
        status: "PROCESSED",
      },
    };
  }

  async toggleMerchantFlag(
    merchantId: string,
    flag: "cacVerified" | "addressVerified" | "bankVerified",
    value: boolean,
    adminId?: string,
  ) {
    const merchant = await this.prisma.merchantProfile.findUnique({
      where: { id: merchantId },
    });

    if (!merchant) {
      throw new NotFoundException("Merchant profile not found");
    }

    const updated = await this.prisma.merchantProfile.update({
      where: { id: merchantId },
      data: { [flag]: value },
    });

    if (adminId) {
      await this.auditLog.log(
        adminId,
        "TOGGLE_MERCHANT_FLAG",
        "MerchantProfile",
        merchantId,
        { flag, value },
      );
    }

    return updated;
  }

  // ─── Staff Suspend / Reactivate ───

  async suspendStaff(staffId: string, adminId: string) {
    // Prevent self-suspend
    if (staffId === adminId) {
      throw new BadRequestException("You cannot suspend your own account.");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: staffId },
      include: { adminProfile: true },
    });

    if (!user || !user.adminProfile) {
      throw new NotFoundException("Staff profile not found.");
    }

    // Prevent suspending SUPER_ADMIN
    if (user.role === "SUPER_ADMIN") {
      throw new BadRequestException("Cannot suspend a Super Admin.");
    }

    // Only allow suspending APPROVED staff (prevents PENDING -> SUSPENDED -> APPROVED bypass)
    if (user.adminProfile.approvalStatus !== "APPROVED") {
      throw new BadRequestException(
        `Staff status is ${user.adminProfile.approvalStatus}, only APPROVED staff can be suspended.`,
      );
    }

    await this.prisma.adminProfile.update({
      where: { userId: staffId },
      data: { approvalStatus: "SUSPENDED" },
    });

    // Revoke refresh token so existing sessions are invalidated
    try {
      await this.redis.del(`refresh_token:${staffId}`);
      this.logger.log(`Refresh token revoked for suspended staff ${staffId}`);
    } catch (err) {
      this.logger.error(
        `Failed to revoke refresh token for ${staffId}: ${err}`,
      );
    }

    await this.auditLog.log(adminId, "SUSPEND_STAFF", "AdminProfile", staffId);

    this.logger.log(`Staff ${staffId} suspended by admin ${adminId}`);
    return { success: true, message: "Staff member has been suspended." };
  }

  async reactivateStaff(staffId: string, adminId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: staffId },
      include: { adminProfile: true },
    });

    if (!user || !user.adminProfile) {
      throw new NotFoundException("Staff profile not found.");
    }

    if (user.adminProfile.approvalStatus !== "SUSPENDED") {
      throw new BadRequestException(
        `Staff status is ${user.adminProfile.approvalStatus}, only SUSPENDED can be reactivated.`,
      );
    }

    await this.prisma.adminProfile.update({
      where: { userId: staffId },
      data: { approvalStatus: "APPROVED" },
    });

    await this.auditLog.log(
      adminId,
      "REACTIVATE_STAFF",
      "AdminProfile",
      staffId,
    );

    this.logger.log(`Staff ${staffId} reactivated by admin ${adminId}`);
    return { success: true, message: "Staff member has been reactivated." };
  }

  // ─── Supplier Management (E: Admin-Invite-Only Onboarding) ───

  async createSupplierAccount(
    dto: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      password: string;
      companyName: string;
      companyAddress: string;
      cacNumber?: string;
    },
    adminId: string,
  ) {
    // Validate unique email and phone
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { phone: dto.phone }] },
    });
    if (existing) {
      throw new BadRequestException(
        "An account with this email or phone already exists.",
      );
    }

    const SALT_ROUNDS = 10;
    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: dto.email,
          phone: dto.phone,
          passwordHash,
          role: "SUPPLIER",
          firstName: dto.firstName,
          lastName: dto.lastName,
          emailVerified: true, // Admin-created accounts are pre-verified
        },
      });

      await tx.supplierProfile.create({
        data: {
          userId: newUser.id,
          companyName: dto.companyName,
          companyAddress: dto.companyAddress,
          cacNumber: dto.cacNumber,
          isVerified: false, // Admin must explicitly verify after reviewing docs
        },
      });

      return newUser;
    });

    await this.auditLog.log(adminId, "CREATE_SUPPLIER", "User", user.id, {
      email: dto.email,
      companyName: dto.companyName,
    });

    this.logger.log(
      `Supplier account created by admin ${adminId}: ${dto.email} (${dto.companyName})`,
    );

    return {
      success: true,
      userId: user.id,
      email: user.email,
      message:
        "Supplier account created. They can now log in and list products.",
    };
  }

  async listSuppliers(isVerified?: boolean) {
    return this.prisma.supplierProfile.findMany({
      where: isVerified !== undefined ? { isVerified } : {},
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            firstName: true,
            lastName: true,
            createdAt: true,
          },
        },
        _count: {
          select: { products: true, orders: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async verifySupplier(supplierId: string, adminId: string) {
    const profile = await this.prisma.supplierProfile.findUnique({
      where: { id: supplierId },
    });
    if (!profile) {
      throw new NotFoundException("Supplier profile not found.");
    }

    await this.prisma.supplierProfile.update({
      where: { id: supplierId },
      data: { isVerified: true },
    });

    await this.auditLog.log(
      adminId,
      "VERIFY_SUPPLIER",
      "SupplierProfile",
      supplierId,
    );

    this.logger.log(
      `Supplier ${supplierId} (${profile.companyName}) verified by admin ${adminId}`,
    );

    return {
      success: true,
      message: `${profile.companyName} has been verified and can now be seen in the merchant catalogue.`,
    };
  }
}
