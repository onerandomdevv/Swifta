import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationTriggerService } from '../notification/notification-trigger.service';
import { getReorderWindowDays } from './reorder.constants';
import { RFQ_EXPIRY_HOURS } from '@hardware-os/shared';

@Injectable()
export class ReorderService {
  private readonly logger = new Logger(ReorderService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationTriggerService,
  ) {}

  async createReminder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        quote: {
          include: {
            rfq: {
              include: { product: true },
            },
          },
        },
        merchantProfile: { select: { businessName: true } },
      },
    });

    if (!order?.quote?.rfq?.product) {
      this.logger.log(`Order ${orderId} has no linked product, skipping reorder reminder`);
      return;
    }

    const product = order.quote.rfq.product;
    const windowDays = getReorderWindowDays(product.categoryTag);
    const remindAt = new Date();
    remindAt.setDate(remindAt.getDate() + windowDays);

    // Check if reminder already exists for this order
    const existing = await this.prisma.reorderReminder.findUnique({
      where: { orderId },
    });
    if (existing) {
      this.logger.log(`Reorder reminder already exists for order ${orderId}`);
      return;
    }

    await this.prisma.reorderReminder.create({
      data: {
        orderId,
        buyerId: order.buyerId,
        merchantId: order.merchantId,
        productCategory: product.categoryTag,
        productName: product.name,
        originalQuantity: order.quote.rfq.quantity,
        remindAt,
      },
    });

    this.logger.log(`Reorder reminder created for order ${orderId}, remind at ${remindAt.toISOString()}`);
  }

  async processReminders() {
    const now = new Date();
    const reminders = await this.prisma.reorderReminder.findMany({
      where: {
        status: 'PENDING',
        remindAt: { lte: now },
      },
      include: {
        user: { select: { firstName: true, lastName: true } },
        merchantProfile: { select: { businessName: true, userId: true } },
        order: true,
      },
    });

    this.logger.log(`Found ${reminders.length} reorder reminders to process`);

    for (const reminder of reminders) {
      try {
        // Check if buyer already created an RFQ for same category+merchant since order
        const existingRFQ = await this.prisma.rfq.findFirst({
          where: {
            buyerId: reminder.buyerId,
            merchantId: reminder.merchantId,
            createdAt: { gt: reminder.order.createdAt },
            product: { categoryTag: reminder.productCategory },
          },
        });

        if (existingRFQ) {
          this.logger.log(`Buyer already reordered for reminder ${reminder.id}, marking as REORDERED`);
          await this.prisma.reorderReminder.update({
            where: { id: reminder.id },
            data: { status: 'REORDERED' },
          });
          continue;
        }

        const daysSinceOrder = Math.floor(
          (now.getTime() - new Date(reminder.order.createdAt).getTime()) / (1000 * 60 * 60 * 24),
        );

        // Notify buyer
        await this.notifications.triggerReorderReminder(reminder.buyerId, {
          reminderId: reminder.id,
          productName: reminder.productName,
          merchantName: reminder.merchantProfile.businessName,
          originalQuantity: reminder.originalQuantity,
          daysSinceOrder,
        });

        // Notify merchant
        await this.notifications.triggerMerchantReorderPrompt(reminder.merchantId, {
          reminderId: reminder.id,
          buyerName: `${reminder.user.firstName} ${reminder.user.lastName}`,
          productName: reminder.productName,
          originalQuantity: reminder.originalQuantity,
          daysSinceOrder,
        });

        await this.prisma.reorderReminder.update({
          where: { id: reminder.id },
          data: { status: 'SENT' },
        });
      } catch (error) {
        this.logger.error(
          `Failed to process reorder reminder ${reminder.id}: ${error instanceof Error ? error.message : error}`,
        );
      }
    }

    return reminders.length;
  }

  async createRFQFromReminder(reminderId: string, buyerId: string) {
    const reminder = await this.prisma.reorderReminder.findUnique({
      where: { id: reminderId },
      include: {
        order: {
          include: {
            quote: { include: { rfq: true } },
          },
        },
      },
    });

    if (!reminder) {
      throw new NotFoundException('Reorder reminder not found');
    }

    if (reminder.buyerId !== buyerId) {
      throw new BadRequestException('Access denied');
    }

    if (reminder.status === 'REORDERED') {
      throw new BadRequestException('This reminder has already been used to create an RFQ');
    }

    const originalRfq = reminder.order.quote?.rfq;
    if (!originalRfq) {
      throw new BadRequestException('Original RFQ data not found');
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 72); // RFQ_EXPIRY_HOURS

    const rfq = await this.prisma.rfq.create({
      data: {
        buyerId,
        merchantId: reminder.merchantId,
        productId: originalRfq.productId,
        quantity: reminder.originalQuantity,
        deliveryAddress: originalRfq.deliveryAddress,
        notes: `Reorder of previous purchase`,
        expiresAt,
      },
    });

    await this.prisma.reorderReminder.update({
      where: { id: reminderId },
      data: { status: 'REORDERED' },
    });

    return rfq;
  }

  async dismiss(reminderId: string, userId: string) {
    const reminder = await this.prisma.reorderReminder.findUnique({
      where: { id: reminderId },
      include: { merchantProfile: { select: { userId: true } } },
    });

    if (!reminder) {
      throw new NotFoundException('Reorder reminder not found');
    }

    // Allow buyer or merchant to dismiss
    if (reminder.buyerId !== userId && reminder.merchantProfile.userId !== userId) {
      throw new BadRequestException('Access denied');
    }

    return this.prisma.reorderReminder.update({
      where: { id: reminderId },
      data: { status: 'DISMISSED' },
    });
  }
}
