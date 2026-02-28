import { Module, Global } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { ConfigService } from "@nestjs/config";
import {
  NOTIFICATION_QUEUE,
  RFQ_EXPIRY_QUEUE,
  REORDER_REMINDER_QUEUE,
} from "./queue.constants";

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const redisUrlString =
          configService.get<string>("redis.url") || "redis://127.0.0.1:6379";
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
        };
      },
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: NOTIFICATION_QUEUE },
      { name: RFQ_EXPIRY_QUEUE },
      { name: REORDER_REMINDER_QUEUE },
    ),
  ],
  exports: [BullModule],
})
export class QueueModule {}
