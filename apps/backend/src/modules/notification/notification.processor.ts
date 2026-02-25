import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { NOTIFICATION_QUEUE } from '../../queue/queue.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';
import { NotificationChannel } from '@hardware-os/shared';

@Processor(NOTIFICATION_QUEUE, {
  concurrency: 5,
  limiter: { max: 10, duration: 1000 },
})
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private smsService: SmsService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { userId, type, title, body, channels, metadata } = job.data;
    let targetUserId = userId;

    this.logger.log(`Processing notification: ${type} for user ${userId}`);

    // Resolve merchant ID to user ID if needed
    if (metadata && metadata.isMerchantId) {
      const merchant = await this.prisma.merchantProfile.findUnique({
        where: { id: userId },
      });
      if (!merchant) {
        this.logger.warn(`Merchant ${userId} not found, skipping notification`);
        return;
      }
      targetUserId = merchant.userId;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      this.logger.warn(`User ${targetUserId} not found, skipping notification`);
      return;
    }

    for (const channel of channels) {
      try {
        if (channel === NotificationChannel.IN_APP) {
          await this.prisma.notification.create({
            data: {
              userId: targetUserId,
              type,
              title,
              body,
              channel,
              metadata,
            },
          });
          this.logger.log(`In-app notification sent to ${targetUserId}`);
        } else if (channel === NotificationChannel.EMAIL) {
          await this.emailService.sendEmail(user.email, title, body);
          this.logger.log(`Email notification sent to ${user.email}`);
        } else if (channel === NotificationChannel.SMS && user.phone) {
          try {
            await this.smsService.sendSms(user.phone, body);
          } catch (smsError) {
             this.logger.warn(`Failed to dispatch SMS, moving to next channel. Warning: ${smsError}`);
          }
        }
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        this.logger.error(
          `Failed to send ${channel} notification to ${targetUserId}: ${errMsg}`,
        );
        throw error; // Re-throw so BullMQ can retry
      }
    }
  }
}
