import { Module, forwardRef } from "@nestjs/common";
import { PayoutService } from "./payout.service";
import { PayoutProcessor } from "./payout.processor";
import { PaymentModule } from "../payment/payment.module";
import { NotificationModule } from "../notification/notification.module";
import { LedgerModule } from "../ledger/ledger.module";

@Module({
  imports: [forwardRef(() => PaymentModule), NotificationModule, LedgerModule],
  providers: [PayoutService, PayoutProcessor],
  exports: [PayoutService],
})
export class PayoutModule {}
