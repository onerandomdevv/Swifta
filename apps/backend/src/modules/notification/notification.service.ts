import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async getUserNotifications(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        skip,
        take: +limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.notification.count({ where: { userId } })
    ]);
    return { data, meta: { page, limit, total } };
  }

  async markAsRead(userId: string, id: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== userId) throw new NotFoundException('Notification not found');

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
  }

  async markAllAsRead(userId: string) {
      await this.prisma.notification.updateMany({
          where: { userId, isRead: false },
          data: { isRead: true }
      });
      return { message: 'All marked as read' };
  }
}
