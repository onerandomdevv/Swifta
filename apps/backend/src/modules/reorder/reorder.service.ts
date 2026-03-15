import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { NotificationTriggerService } from "../notification/notification-trigger.service";
import { getReorderWindowDays } from "./reorder.constants";


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
        product: true,
        merchantProfile: { select: { businessName: true } },
      },
    });

    if (!order?.product) {
      this.logger.log(
        `Order ${orderId} has no linked product, skipping reorder reminder`,
      );
      return;
    }

    const product = order.product;
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
        originalQuantity: order.quantity || 1,
        remindAt,
      },
    });

    this.logger.log(
      `Reorder reminder created for order ${orderId}, remind at ${remindAt.toISOString()}`,
    );
  }

  async processReminders() {
    const now = new Date();
    const reminders = await this.prisma.reorderReminder.findMany({
      where: {
        status: "PENDING",
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
        // Check if buyer already ordered for same category+merchant since order
        const existingOrder = await this.prisma.order.findFirst({
          where: {
            buyerId: reminder.buyerId,
            merchantId: reminder.merchantId,
            createdAt: { gt: reminder.order.createdAt },
            product: { categoryTag: reminder.productCategory },
          },
        });

        if (existingOrder) {
          this.logger.log(
            `Buyer already reordered for reminder ${reminder.id}, marking as REORDERED`,
          );
          await this.prisma.reorderReminder.update({
            where: { id: reminder.id },
            data: { status: "REORDERED" },
          });
          continue;
        }

        const daysSinceOrder = Math.floor(
          (now.getTime() - new Date(reminder.order.createdAt).getTime()) /
            (1000 * 60 * 60 * 24),
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
        await this.notifications.triggerMerchantReorderPrompt(
          reminder.merchantId,
          {
            reminderId: reminder.id,
            buyerName: `${reminder.user.firstName} ${reminder.user.lastName}`,
            productName: reminder.productName,
            originalQuantity: reminder.originalQuantity,
            daysSinceOrder,
          },
        );

        await this.prisma.reorderReminder.update({
          where: { id: reminder.id },
          data: { status: "SENT" },
        });
      } catch (error) {
        this.logger.error(
          `Failed to process reorder reminder ${reminder.id}: ${error instanceof Error ? error.message : error}`,
        );
      }
    }

    return reminders.length;
  }


  async dismiss(reminderId: string, userId: string) {
    const reminder = await this.prisma.reorderReminder.findUnique({
      where: { id: reminderId },
      include: { merchantProfile: { select: { userId: true } } },
    });

    if (!reminder) {
      throw new NotFoundException("Reorder reminder not found");
    }

    // Allow buyer or merchant to dismiss
    if (
      reminder.buyerId !== userId &&
      reminder.merchantProfile.userId !== userId
    ) {
      throw new BadRequestException("Access denied");
    }

    return this.prisma.reorderReminder.update({
      where: { id: reminderId },
      data: { status: "DISMISSED" },
    });
  }
}
