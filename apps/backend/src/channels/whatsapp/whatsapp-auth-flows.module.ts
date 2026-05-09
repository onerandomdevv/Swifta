import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { EmailModule } from "../../modules/email/email.module";
import { PaystackModule } from "../../integrations/paystack/paystack.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { RedisModule } from "../../redis/redis.module";
import { WhatsAppAuthService } from "./whatsapp-auth.service";
import { WhatsAppBuyerAuthService } from "./whatsapp-buyer-auth.service";
import { WhatsAppOnboardingService } from "./whatsapp-onboarding.service";
import { WhatsAppSharedModule } from "./whatsapp-shared.module";

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    RedisModule,
    EmailModule,
    PaystackModule,
    WhatsAppSharedModule,
  ],
  providers: [
    WhatsAppAuthService,
    WhatsAppBuyerAuthService,
    WhatsAppOnboardingService,
  ],
  exports: [
    WhatsAppAuthService,
    WhatsAppBuyerAuthService,
    WhatsAppOnboardingService,
  ],
})
export class WhatsAppAuthFlowsModule {}
