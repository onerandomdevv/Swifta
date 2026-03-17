import { Module } from "@nestjs/common";
import { UssdController } from "./ussd.controller";
import { UssdService } from "./ussd.service";
import { PrismaModule } from "../../prisma/prisma.module";
import { PaymentModule } from "../payment/payment.module";
import { NotificationModule } from "../notification/notification.module";

@Module({
  imports: [PrismaModule, PaymentModule, NotificationModule],
  controllers: [UssdController],
  providers: [UssdService],
})
export class UssdModule {}
