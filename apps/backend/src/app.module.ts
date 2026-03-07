import { Module, MiddlewareConsumer, RequestMethod } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ServeStaticModule } from "@nestjs/serve-static";
import { ScheduleModule } from "@nestjs/schedule";
import { CacheModule } from "@nestjs/cache-manager";
import { redisStore } from "cache-manager-ioredis-yet";
import { join } from "path";

import configuration from "./config/app.config";
import databaseConfig from "./config/database.config";
import redisConfig from "./config/redis.config";
import jwtConfig from "./config/jwt.config";
import paystackConfig from "./config/paystack.config";
import africastalkingConfig from "./config/africastalking.config";

import { PrismaModule } from "./prisma/prisma.module";
import { RedisModule } from "./redis/redis.module";
import { QueueModule } from "./queue/queue.module";
import { HealthModule } from "./health/health.module";

import { AuthModule } from "./modules/auth/auth.module";
import { MerchantModule } from "./modules/merchant/merchant.module";
import { ProductModule } from "./modules/product/product.module";
import { RFQModule } from "./modules/rfq/rfq.module";
import { QuoteModule } from "./modules/quote/quote.module";
import { OrderModule } from "./modules/order/order.module";
import { PaymentModule } from "./modules/payment/payment.module";
import { InventoryModule } from "./modules/inventory/inventory.module";
import { NotificationModule } from "./modules/notification/notification.module";
import { EmailModule } from "./modules/email/email.module";
import { UploadModule } from "./modules/upload/upload.module";
import { AdminModule } from "./modules/admin/admin.module";
import { WhatsAppModule } from "./modules/whatsapp/whatsapp.module";
import { PayoutModule } from "./modules/payout/payout.module";
import { BnplModule } from "./modules/bnpl/bnpl.module";
import { LogisticsModule } from "./modules/logistics/logistics.module";
import { SupplierModule } from "./modules/supplier/supplier.module";

import { LoggerModule } from "./common/logger/logger.module";

import { MerchantContextMiddleware } from "./common/middleware/merchant-context.middleware";

import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        configuration,
        databaseConfig,
        redisConfig,
        jwtConfig,
        paystackConfig,
        africastalkingConfig,
      ],
    }),
    LoggerModule,
    ScheduleModule.forRoot(),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const urlString =
          configService.get<string>("redis.url") || "redis://127.0.0.1:6379";
        const parsedUrl = new URL(urlString);
        const store = await redisStore({
          host: parsedUrl.hostname,
          port: parseInt(parsedUrl.port, 10) || 6379,
          password: parsedUrl.password || undefined,
          username: parsedUrl.username || undefined,
          tls:
            parsedUrl.protocol === "rediss:"
              ? { rejectUnauthorized: false }
              : undefined,
          family: 0,
          ttl: 60 * 1000,
        });
        return { store };
      },
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "..", "..", "uploads"),
      serveRoot: "/uploads",
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 60,
      },
    ]),
    PrismaModule,
    RedisModule,
    QueueModule,
    HealthModule,
    AuthModule,
    MerchantModule,
    ProductModule,
    RFQModule,
    QuoteModule,
    OrderModule,
    PaymentModule,
    InventoryModule,
    NotificationModule,
    EmailModule,
    UploadModule,
    AdminModule,
    WhatsAppModule,
    PayoutModule,
    BnplModule,
    LogisticsModule,
    SupplierModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(MerchantContextMiddleware)
      .forRoutes({ path: "*", method: RequestMethod.ALL });
  }
}
