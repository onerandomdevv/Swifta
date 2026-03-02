import { Module, Global } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { ConfigService } from "@nestjs/config";
<<<<<<< HEAD
import { NOTIFICATION_QUEUE, RFQ_EXPIRY_QUEUE } from "./queue.constants";
=======
import {
  NOTIFICATION_QUEUE,
  RFQ_EXPIRY_QUEUE,
  REORDER_REMINDER_QUEUE,
} from "./queue.constants";
>>>>>>> ba9be81e5710e24268f6232eb89d61f9d0b946ac

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
<<<<<<< HEAD
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
            tls: redisUrl.protocol === "rediss:" ? {} : undefined,
          },
        };
      },
=======
      useFactory: (configService: ConfigService) => ({
        connection: {
          url: configService.get("redis.url"),
        },
      }),
>>>>>>> ba9be81e5710e24268f6232eb89d61f9d0b946ac
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
