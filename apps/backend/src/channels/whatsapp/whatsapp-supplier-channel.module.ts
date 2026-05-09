import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { PrismaModule } from "../../prisma/prisma.module";
import { RedisModule } from "../../redis/redis.module";
import { WhatsAppSharedModule } from "./whatsapp-shared.module";
import { WhatsAppSupplierService } from "./whatsapp-supplier.service";

@Module({
  imports: [ConfigModule, PrismaModule, RedisModule, WhatsAppSharedModule],
  providers: [WhatsAppSupplierService],
  exports: [WhatsAppSupplierService],
})
export class WhatsAppSupplierChannelModule {}
