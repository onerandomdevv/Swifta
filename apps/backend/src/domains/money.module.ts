import { Module } from "@nestjs/common";

import { DvaModule } from "../modules/dva/dva.module";
import { LedgerModule } from "../modules/ledger/ledger.module";
import { PaymentModule } from "../modules/payment/payment.module";
import { PayoutModule } from "../modules/payout/payout.module";
import { TradeFinancingModule } from "../modules/trade-financing/trade-financing.module";

@Module({
  imports: [
    LedgerModule,
    PaymentModule,
    PayoutModule,
    DvaModule,
    TradeFinancingModule,
  ],
})
export class MoneyDomainModule {}
