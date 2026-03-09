import { Module, forwardRef } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "../../prisma/prisma.module";
import { RedisModule } from "../../redis/redis.module";
import { QueueModule } from "../../queue/queue.module";
import { OrderModule } from "../order/order.module";
import { RFQModule } from "../rfq/rfq.module";
import { QuoteModule } from "../quote/quote.module";
import { ProductModule } from "../product/product.module";
import { TradeFinancingModule } from "../trade-financing/trade-financing.module";
import { EmailModule } from "../email/email.module";
import { ReviewModule } from "../review/review.module";
import { SupplierModule } from "../supplier/supplier.module";
import { WhatsAppController } from "./whatsapp.controller";
import { WhatsAppService } from "./whatsapp.service";
import { WhatsAppAuthService } from "./whatsapp-auth.service";
import { WhatsAppIntentService } from "./whatsapp-intent.service";
import { WhatsAppBuyerService } from "./whatsapp-buyer.service";
import { WhatsAppBuyerAuthService } from "./whatsapp-buyer-auth.service";
import { WhatsAppBuyerIntentService } from "./whatsapp-buyer-intent.service";
import { WhatsAppSupplierService } from "./whatsapp-supplier.service";
import { WhatsAppSupplierIntentService } from "./whatsapp-supplier-intent.service";
import { WhatsAppOnboardingService } from "./whatsapp-onboarding.service";
import { WhatsAppInteractiveService } from "./whatsapp-interactive.service";
import { WhatsAppProcessor } from "./whatsapp.processor";
import { ImageSearchService } from "./image-search.service";

/**
 * WhatsApp Bot Module
 *
 * Integrates with Meta's WhatsApp Business Cloud API to provide
 * merchants with a conversational interface to SwiftTrade.
 *
 * Dependencies:
 *  - PrismaModule: database access (WhatsAppLink, products, orders, etc.)
 *  - RedisModule: session state for linking flow + message dedup
 *  - QueueModule: BullMQ for async message processing
 *  - OrderModule, RFQModule, QuoteModule, ProductModule: existing services
 *  - EmailModule: OTP delivery for phone linking
 *  - ConfigModule: WhatsApp API credentials
 *
 * Note: InventoryModule is @Global() so no explicit import needed.
 * Note: NotificationModule is @Global() so no explicit import needed.
 */
@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    RedisModule,
    QueueModule,
    forwardRef(() => OrderModule),
    RFQModule,
    QuoteModule,
    ProductModule,
    TradeFinancingModule,
    EmailModule,
    forwardRef(() => ReviewModule),
    forwardRef(() => SupplierModule),
  ],
  controllers: [WhatsAppController],
  providers: [
    WhatsAppService,
    WhatsAppAuthService,
    WhatsAppIntentService,
    WhatsAppBuyerService,
    WhatsAppBuyerAuthService,
    WhatsAppBuyerIntentService,
    WhatsAppSupplierService,
    WhatsAppSupplierIntentService,
    WhatsAppOnboardingService,
    WhatsAppInteractiveService,
    WhatsAppProcessor,
    ImageSearchService,
  ],
  exports: [WhatsAppService],
})
export class WhatsAppModule {}
