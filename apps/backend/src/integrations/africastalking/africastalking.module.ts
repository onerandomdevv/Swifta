import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AfricasTalkingClient } from "./africastalking.client";

@Module({
  imports: [ConfigModule],
  providers: [AfricasTalkingClient],
  exports: [AfricasTalkingClient],
})
export class AfricasTalkingModule {}
