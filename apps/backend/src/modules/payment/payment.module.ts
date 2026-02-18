import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PaystackClient } from './paystack.client';
import { PrismaModule } from '../../prisma/prisma.module';
import { OrderModule } from '../order/order.module';
import { NotificationModule } from '../notification/notification.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, OrderModule, NotificationModule, ConfigModule],
  controllers: [PaymentController],
  providers: [PaymentService, PaystackClient],
  exports: [PaymentService],
})
export class PaymentModule {}
