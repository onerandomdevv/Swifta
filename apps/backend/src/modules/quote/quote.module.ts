import { Module } from '@nestjs/common';
import { QuoteService } from './quote.service';
import { QuoteController } from './quote.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { RFQModule } from '../rfq/rfq.module';
import { OrderModule } from '../order/order.module';
import { InventoryModule } from '../inventory/inventory.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [PrismaModule, RFQModule, OrderModule, InventoryModule, NotificationModule],
  controllers: [QuoteController],
  providers: [QuoteService],
  exports: [QuoteService],
})
export class QuoteModule {}
