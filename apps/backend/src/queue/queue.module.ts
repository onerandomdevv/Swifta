import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { NOTIFICATION_QUEUE, RFQ_EXPIRY_QUEUE } from './queue.constants';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        connection: {
          url: configService.get('redis.url'),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: NOTIFICATION_QUEUE },
      { name: RFQ_EXPIRY_QUEUE },
    ),
  ],
  exports: [BullModule],
})
export class QueueModule {}
