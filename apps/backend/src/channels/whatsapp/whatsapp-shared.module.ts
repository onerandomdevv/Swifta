import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { PrismaModule } from "../../prisma/prisma.module";
import { RedisModule } from "../../redis/redis.module";
import { AiModule } from "../../integrations/ai/ai.module";
import { CloudinaryModule } from "../../integrations/cloudinary/cloudinary.module";
import { MetaWhatsAppModule } from "../../integrations/meta-whatsapp/meta-whatsapp.module";
import { ImageSearchService } from "./image-search.service";
import { WhatsAppBuyerIntentService } from "./whatsapp-buyer-intent.service";
import { WhatsAppInteractiveService } from "./whatsapp-interactive.service";
import { WhatsAppIntentService } from "./whatsapp-intent.service";
import { WhatsAppLoggerService } from "./whatsapp-logger.service";
import { WhatsAppSupplierIntentService } from "./whatsapp-supplier-intent.service";

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    RedisModule,
    AiModule,
    CloudinaryModule,
    MetaWhatsAppModule,
  ],
  providers: [
    WhatsAppInteractiveService,
    WhatsAppIntentService,
    WhatsAppBuyerIntentService,
    WhatsAppSupplierIntentService,
    ImageSearchService,
    WhatsAppLoggerService,
  ],
  exports: [
    WhatsAppInteractiveService,
    WhatsAppIntentService,
    WhatsAppBuyerIntentService,
    WhatsAppSupplierIntentService,
    ImageSearchService,
    WhatsAppLoggerService,
    AiModule,
    CloudinaryModule,
    MetaWhatsAppModule,
  ],
})
export class WhatsAppSharedModule {}
