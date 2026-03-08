import { Module } from "@nestjs/common";
import { SupplierController } from "./supplier.controller";
import { SupplierService } from "./supplier.service";

import { PaymentModule } from "../payment/payment.module";
import { WhatsAppModule } from "../whatsapp/whatsapp.module";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PaymentModule, WhatsAppModule, PrismaModule],
  controllers: [SupplierController],
  providers: [SupplierService],
  exports: [SupplierService],
})
export class SupplierModule {}
