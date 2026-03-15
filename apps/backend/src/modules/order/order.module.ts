import { Module, forwardRef } from "@nestjs/common";
import { OrderService } from "./order.service";
import { InvoiceService } from "./invoice.service";
import { OrderController } from "./order.controller";
import { PrismaModule } from "../../prisma/prisma.module";
import { NotificationModule } from "../notification/notification.module";
import { InventoryModule } from "../inventory/inventory.module";
import { PaymentModule } from "../payment/payment.module";
import { ReorderModule } from "../reorder/reorder.module";
import { VerificationModule } from "../verification/verification.module";
import { LogisticsModule } from "../logistics/logistics.module";
import { WhatsAppModule } from "../whatsapp/whatsapp.module";

@Module({
  imports: [
    PrismaModule,
    NotificationModule,
    InventoryModule,
    forwardRef(() => PaymentModule),
    ReorderModule,
    VerificationModule,
    forwardRef(() => LogisticsModule),
    forwardRef(() => WhatsAppModule),
  ],
  controllers: [OrderController],
  providers: [OrderService, InvoiceService],
  exports: [OrderService],
})
export class OrderModule {}
