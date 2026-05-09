import { Module } from "@nestjs/common";
import { ResendClient } from "./resend.client";

@Module({
  providers: [ResendClient],
  exports: [ResendClient],
})
export class ResendModule {}
