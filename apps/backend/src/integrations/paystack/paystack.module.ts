import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { PaystackClient } from "./paystack.client";

@Module({
  imports: [ConfigModule],
  providers: [PaystackClient],
  exports: [PaystackClient],
})
export class PaystackModule {}
