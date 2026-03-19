import { Module, forwardRef } from "@nestjs/common";
import { DvaController } from "./dva.controller";
import { DvaService } from "./dva.service";
import { PrismaModule } from "../../prisma/prisma.module";
import { PaymentModule } from "../payment/payment.module";

@Module({
  imports: [PrismaModule, forwardRef(() => PaymentModule)],
  controllers: [DvaController],
  providers: [DvaService],
  exports: [DvaService],
})
export class DvaModule {}
