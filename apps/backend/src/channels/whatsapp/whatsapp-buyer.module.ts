import { Module, forwardRef } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { DvaModule } from "../../modules/dva/dva.module";
import { OrderModule } from "../../modules/order/order.module";
import { ProductModule } from "../../modules/product/product.module";
import { ReviewModule } from "../../modules/review/review.module";
import { UploadModule } from "../../modules/upload/upload.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { RedisModule } from "../../redis/redis.module";
import { WhatsAppAuthFlowsModule } from "./whatsapp-auth-flows.module";
import { WhatsAppBuyerService } from "./whatsapp-buyer.service";
import { WhatsAppSharedModule } from "./whatsapp-shared.module";

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    RedisModule,
    forwardRef(() => OrderModule),
    ProductModule,
    forwardRef(() => ReviewModule),
    DvaModule,
    UploadModule,
    WhatsAppSharedModule,
    WhatsAppAuthFlowsModule,
  ],
  providers: [WhatsAppBuyerService],
  exports: [WhatsAppBuyerService],
})
export class WhatsAppBuyerModule {}
