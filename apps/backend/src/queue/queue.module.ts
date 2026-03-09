import { Module, Global } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { ConfigService } from "@nestjs/config";
import {
  NOTIFICATION_QUEUE,
  RFQ_EXPIRY_QUEUE,
  REORDER_REMINDER_QUEUE,
  WHATSAPP_QUEUE,
  PAYOUT_QUEUE,
  LOGISTICS_QUEUE,
  AUTO_CONFIRM_QUEUE,
  REVIEW_QUEUE,
} from "./queue.constants";

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const redisUrlString = configService.get<string>("redis.url");

        if (!redisUrlString) {
          console.warn(
            "REDIS_URL not found for BullMQ, falling back to localhost",
          );
          return {
            connection: { host: "127.0.0.1", port: 6379, family: 0 },
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
            },
            prefix: "{bull}",
          };
        } catch (error: any) {
          console.error(
            `BullMQ failed to parse REDIS_URL: ${redisUrlString.substring(0, 10)}...`,
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
      { name: RFQ_EXPIRY_QUEUE },
      { name: REORDER_REMINDER_QUEUE },
      { name: WHATSAPP_QUEUE },
      { name: PAYOUT_QUEUE },
      { name: LOGISTICS_QUEUE },
      { name: AUTO_CONFIRM_QUEUE },
      { name: REVIEW_QUEUE },
    ),
  ],
  exports: [BullModule],
})
export class QueueModule {}
