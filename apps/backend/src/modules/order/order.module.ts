import { Module, forwardRef } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';
import { InventoryModule } from '../inventory/inventory.module';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [
    PrismaModule,
    NotificationModule,
    InventoryModule,
    forwardRef(() => PaymentModule),
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
