import { Module } from "@nestjs/common";

import { AdminModule } from "../modules/admin/admin.module";
import { AuthModule } from "../modules/auth/auth.module";
import { BuyerModule } from "../modules/buyer/buyer.module";
import { MerchantModule } from "../modules/merchant/merchant.module";
import { SupplierModule } from "../modules/supplier/supplier.module";
import { VerificationModule } from "../modules/verification/verification.module";
import { WaitlistModule } from "../modules/waitlist/waitlist.module";

@Module({
  imports: [
    AuthModule,
    BuyerModule,
    MerchantModule,
    SupplierModule,
    VerificationModule,
    AdminModule,
    WaitlistModule,
  ],
})
export class UsersTrustDomainModule {}
