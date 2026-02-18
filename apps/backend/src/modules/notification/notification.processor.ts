import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { NOTIFICATION_QUEUE } from '../../queue/queue.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from './email.service';
import { NotificationChannel } from '@hardware-os/shared';

@Processor(NOTIFICATION_QUEUE)
export class NotificationProcessor extends WorkerHost {
  constructor(
      private prisma: PrismaService,
      private emailService: EmailService
    ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { userId, type, title, body, channels, metadata } = job.data;
    let targetUserId = userId;

    // Resolve merchant ID to user ID if needed
    if (metadata && metadata.isMerchantId) {
        const merchant = await this.prisma.merchantProfile.findUnique({ where: { id: userId } });
        if (merchant) targetUserId = merchant.userId;
    }

    const user = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) return; // User not found, abort

    for (const channel of channels) {
        if (channel === NotificationChannel.IN_APP) {
            await this.prisma.notification.create({
                data: {
                    userId: targetUserId,
                    type,
                    title,
                    body,
                    channel,
                    metadata
                }
            });
        } else if (channel === NotificationChannel.EMAIL) {
            await this.emailService.sendEmail(user.email, title, body);
        }
    }
  }
}
