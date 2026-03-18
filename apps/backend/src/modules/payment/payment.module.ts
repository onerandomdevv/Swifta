import { Module, forwardRef } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { PaymentService } from "./payment.service";
import { PaymentController } from "./payment.controller";
import { PaystackClient } from "./paystack.client";
import { PrismaModule } from "../../prisma/prisma.module";
import { OrderModule } from "../order/order.module";
import { NotificationModule } from "../notification/notification.module";
import { DvaModule } from "../dva/dva.module";
import { ConfigModule } from "@nestjs/config";
import { PAYOUT_QUEUE, LOGISTICS_QUEUE } from "../../queue/queue.constants";

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => OrderModule),
    forwardRef(() => DvaModule),
    NotificationModule,
    ConfigModule,
    BullModule.registerQueue({ name: PAYOUT_QUEUE }),
    BullModule.registerQueue({ name: LOGISTICS_QUEUE }),
  ],
  controllers: [PaymentController],
  providers: [PaymentService, PaystackClient],
  exports: [PaymentService, PaystackClient],
})
export class PaymentModule {}
