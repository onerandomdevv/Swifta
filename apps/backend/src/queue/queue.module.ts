import { Module, Global, Logger } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { ConfigService } from "@nestjs/config";
import {
  NOTIFICATION_QUEUE,
  REORDER_REMINDER_QUEUE,
  WHATSAPP_QUEUE,
  PAYOUT_QUEUE,
  LOGISTICS_QUEUE,
  AUTO_CONFIRM_QUEUE,
  REVIEW_QUEUE,
  CHECKOUT_REMINDER_QUEUE,
} from "./queue.constants";
import { AutoConfirmProcessor } from "./auto-confirm.processor";
import { LogisticsProcessor } from "./logistics.processor";
import { CheckoutReminderProcessor } from "./checkout-reminder.processor";

function sanitizeRedisUrl(url: string | undefined): string | undefined {
  if (!url) return url;
  let cleanUrl = url.trim();
  if (cleanUrl.startsWith("REDIS_URL=")) {
    cleanUrl = cleanUrl.substring("REDIS_URL=".length);
  }
  if (cleanUrl.startsWith('"') && cleanUrl.endsWith('"')) {
    cleanUrl = cleanUrl.substring(1, cleanUrl.length - 1);
  }
  if (cleanUrl.startsWith("'") && cleanUrl.endsWith("'")) {
    cleanUrl = cleanUrl.substring(1, cleanUrl.length - 1);
  }
  return cleanUrl.trim();
}

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const rawUrl = configService.get<string>("redis.url");
        const redisUrlString = sanitizeRedisUrl(rawUrl);

        if (!redisUrlString) {
          Logger.warn(
            "REDIS_URL not found for BullMQ, falling back to localhost",
          );
          return {
            connection: {
              host: "127.0.0.1",
              port: 6379,
              family: 0,
              enableReadyCheck: false,
              maxRetriesPerRequest: null,
            },
            prefix: "{bull}",
          };
        }

        try {
          const redisUrl = new URL(redisUrlString);
          return {
            connection: {
              host: redisUrl.hostname,
              port: parseInt(redisUrl.port, 10) || 6379,
              password: redisUrl.password || undefined,
              username: redisUrl.username || undefined,
              tls:
                redisUrl.protocol === "rediss:"
                  ? { rejectUnauthorized: false }
                  : undefined,
              family: 0,
              enableReadyCheck: false,
              maxRetriesPerRequest: null,
            },
            prefix: "{bull}",
          };
        } catch (error: any) {
          Logger.error(
            `BullMQ failed to parse REDIS_URL prefix: ${redisUrlString.substring(0, 15)}...`,
          );
          throw new Error(
            `Invalid REDIS_URL for QueueModule: ${error.message}`,
          );
        }
      },
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: NOTIFICATION_QUEUE },
      { name: REORDER_REMINDER_QUEUE },
      { name: WHATSAPP_QUEUE },
      { name: PAYOUT_QUEUE },
      { name: LOGISTICS_QUEUE },
      { name: AUTO_CONFIRM_QUEUE },
      { name: REVIEW_QUEUE },
      { name: CHECKOUT_REMINDER_QUEUE },
    ),
  ],
  providers: [
    AutoConfirmProcessor,
    LogisticsProcessor,
    CheckoutReminderProcessor,
  ],
  exports: [BullModule],
})
export class QueueModule {}
