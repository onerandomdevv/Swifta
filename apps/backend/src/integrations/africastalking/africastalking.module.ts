import { Module } from "@nestjs/common";
import { AfricasTalkingClient } from "./africastalking.client";

@Module({
  providers: [AfricasTalkingClient],
  exports: [AfricasTalkingClient],
})
export class AfricasTalkingModule {}
