import { Module } from '@nestjs/common';
import { RFQService } from './rfq.service';
import { RFQController } from './rfq.controller';
import { RFQExpiryProcessor } from './rfq-expiry.processor';
import { PrismaModule } from '../../prisma/prisma.module';
import { ProductModule } from '../product/product.module';
import { NotificationModule } from '../notification/notification.module';
import { QueueModule } from '../../queue/queue.module';

@Module({
  imports: [PrismaModule, ProductModule, NotificationModule, QueueModule],
  controllers: [RFQController],
  providers: [RFQService, RFQExpiryProcessor],
  exports: [RFQService],
})
export class RFQModule {}
