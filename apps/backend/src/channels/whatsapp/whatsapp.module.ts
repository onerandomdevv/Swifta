import { Module, forwardRef } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "../../prisma/prisma.module";
import { RedisModule } from "../../redis/redis.module";
import { QueueModule } from "../../queue/queue.module";
import { OrderModule } from "../../modules/order/order.module";
import { ProductModule } from "../../modules/product/product.module";
import { TradeFinancingModule } from "../../modules/trade-financing/trade-financing.module";
import { EmailModule } from "../../modules/email/email.module";
import { ReviewModule } from "../../modules/review/review.module";
import { SupplierModule } from "../../modules/supplier/supplier.module";
import { WhatsAppController } from "./whatsapp.controller";
import { WhatsAppService } from "./whatsapp.service";
import { WhatsAppProcessor } from "./whatsapp.processor";
import { WhatsAppAuthFlowsModule } from "./whatsapp-auth-flows.module";
import { WhatsAppBuyerModule } from "./whatsapp-buyer.module";
import { WhatsAppSharedModule } from "./whatsapp-shared.module";
import { WhatsAppSupplierChannelModule } from "./whatsapp-supplier-channel.module";

/**
 * WhatsApp Bot Module
 *
 * Integrates with Meta's WhatsApp Business Cloud API to provide
 * merchants with a conversational interface to twizrr.
 *
 * Dependencies:
 *  - PrismaModule: database access (WhatsAppLink, products, orders, etc.)
 *  - RedisModule: session state for linking flow + message dedup
 *  - QueueModule: BullMQ for async message processing
 *  - OrderModule, ProductModule: existing services
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
    forwardRef(() => QueueModule),
    forwardRef(() => OrderModule),
    ProductModule,
    TradeFinancingModule,
    EmailModule,
    forwardRef(() => ReviewModule),
    forwardRef(() => SupplierModule),
    WhatsAppSharedModule,
    WhatsAppAuthFlowsModule,
    WhatsAppBuyerModule,
    WhatsAppSupplierChannelModule,
  ],
  controllers: [WhatsAppController],
  providers: [WhatsAppService, WhatsAppProcessor],
  exports: [WhatsAppService],
})
export class WhatsAppModule {}
