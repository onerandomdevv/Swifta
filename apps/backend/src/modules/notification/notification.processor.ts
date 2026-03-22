import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { Logger } from "@nestjs/common";
import {
  NOTIFICATION_QUEUE,
  WHATSAPP_QUEUE,
} from "../../queue/queue.constants";
import { PrismaService } from "../../prisma/prisma.service";
import { EmailService } from "../email/email.service";
import { SmsService } from "./sms.service";
import { NotificationChannel } from "@swifta/shared";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";

@Processor(NOTIFICATION_QUEUE, {
  concurrency: 5,
  limiter: { max: 10, duration: 1000 },
  drainDelay: 60000,
  stalledInterval: 300000,
  lockDuration: 60000,
  metrics: null,
})
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private smsService: SmsService,
    @InjectQueue(WHATSAPP_QUEUE) private whatsappQueue: Queue,
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
          switch (type) {
            case "WELCOME":
              await this.emailService.sendWelcomeEmail(
                user.email,
                user.firstName,
                user.role,
              );
              break;
            case "EMAIL_VERIFICATION":
              if (!metadata?.otp) {
                this.logger.error(
                  `Missing metadata.otp for EMAIL_VERIFICATION (user=${targetUserId})`,
                );
                continue;
              }
              await this.emailService.sendVerificationOTP(
                user.email,
                metadata.otp,
              );
              break;
            case "PAYMENT_CONFIRMED":
              if (!metadata?.reference || !metadata?.amountKobo) {
                this.logger.error(
                  `Missing metadata for PAYMENT_CONFIRMED (user=${targetUserId})`,
                );
                continue;
              }
              try {
                await this.emailService.sendPaymentConfirmedNotification(
                  user.email,
                  metadata.reference,
                  BigInt(metadata.amountKobo),
                  !!metadata.isMerchantId,
                );
              } catch (convErr) {
                this.logger.error(
                  `Invalid amountKobo for PAYMENT_CONFIRMED (user=${targetUserId}, value=${metadata.amountKobo}): ${convErr}`,
                );
                continue;
              }
              break;
            case "ORDER_DISPATCHED":
              if (!metadata?.reference || !metadata?.otp) {
                this.logger.error(
                  `Missing metadata for ORDER_DISPATCHED (user=${targetUserId})`,
                );
                continue;
              }
              await this.emailService.sendOrderDispatchedNotification(
                user.email,
                metadata.reference,
                metadata.otp,
              );
              break;
            case "DELIVERY_CONFIRMED":
              if (!metadata?.reference || !metadata?.amountKobo) {
                this.logger.error(
                  `Missing metadata for DELIVERY_CONFIRMED (user=${targetUserId})`,
                );
                continue;
              }
              try {
                await this.emailService.sendDeliveryConfirmedNotification(
                  user.email,
                  metadata.reference,
                  BigInt(metadata.amountKobo),
                );
              } catch (convErr) {
                this.logger.error(
                  `Invalid amountKobo for DELIVERY_CONFIRMED (user=${targetUserId}, value=${metadata.amountKobo}): ${convErr}`,
                );
                continue;
              }
              break;
            case "PASSWORD_RESET":
              if (!metadata?.resetToken || !metadata?.frontendUrl) {
                this.logger.error(
                  `Missing metadata for PASSWORD_RESET (user=${targetUserId})`,
                );
                continue;
              }
              await this.emailService.sendPasswordResetEmail(
                user.email,
                metadata.resetToken,
                metadata.frontendUrl,
              );
              break;
            default:
              await this.emailService.sendEmail(user.email, title, body);
          }
          this.logger.log(`Email notification (${type}) sent to ${user.email}`);
        } else if (channel === NotificationChannel.SMS && user.phone) {
          try {
            await this.smsService.sendSms(user.phone, body);
          } catch (smsError) {
            this.logger.warn(
              `Failed to dispatch SMS, moving to next channel. Warning: ${smsError}`,
            );
          }
        } else if (channel === NotificationChannel.WHATSAPP && user.phone) {
          try {
            switch (type) {
              case "PAYMENT_CONFIRMED":
              case "DIRECT_PURCHASE_CONFIRMED":
                await this.whatsappQueue.add(
                  "send-payment-confirmed-notification",
                  { phone: user.phone, orderData: metadata },
                  { attempts: 2, removeOnComplete: true, removeOnFail: true },
                );
                break;
              case "ORDER_DISPATCHED":
                await this.whatsappQueue.add(
                  "send-order-dispatched-notification",
                  { phone: user.phone, orderData: metadata },
                  { attempts: 2, removeOnComplete: true, removeOnFail: true },
                );
                break;
              default:
                await this.whatsappQueue.add(
                  "send-text-message",
                  { phone: user.phone, text: body },
                  { attempts: 2, removeOnComplete: true, removeOnFail: true },
                );
                break;
            }
            this.logger.log(
              `WhatsApp notification (${type}) queued for ${user.phone}`,
            );
          } catch (waError) {
            this.logger.warn(
              `Failed to dispatch WhatsApp job, moving to next channel. Warning: ${waError}`,
            );
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
