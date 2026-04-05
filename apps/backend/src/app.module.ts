import {
  Module,
  MiddlewareConsumer,
  RequestMethod,
  Logger,
} from "@nestjs/common";
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
import whatsappConfig from "./config/whatsapp.config";
import { envValidationSchema } from "./common/config/env.validation";

import { PrismaModule } from "./prisma/prisma.module";
import { RedisModule } from "./redis/redis.module";
import { QueueModule } from "./queue/queue.module";
import { HealthModule } from "./health/health.module";

import { AuthModule } from "./modules/auth/auth.module";
import { MerchantModule } from "./modules/merchant/merchant.module";
import { ProductModule } from "./modules/product/product.module";
import { PaymentModule } from "./modules/payment/payment.module";
import { InventoryModule } from "./modules/inventory/inventory.module";
import { NotificationModule } from "./modules/notification/notification.module";
import { EmailModule } from "./modules/email/email.module";
import { UploadModule } from "./modules/upload/upload.module";
import { AdminModule } from "./modules/admin/admin.module";
import { WhatsAppModule } from "./modules/whatsapp/whatsapp.module";
import { PayoutModule } from "./modules/payout/payout.module";
import { TradeFinancingModule } from "./modules/trade-financing/trade-financing.module";
import { LogisticsModule } from "./modules/logistics/logistics.module";
import { SupplierModule } from "./modules/supplier/supplier.module";
import { CategoryModule } from "./modules/category/category.module";
import { ReviewModule } from "./modules/review/review.module";
import { BuyerModule } from "./modules/buyer/buyer.module";
import { CartModule } from "./modules/cart/cart.module";
import { WishlistModule } from "./modules/wishlist/wishlist.module";
import { UssdModule } from "./modules/ussd/ussd.module";
import { DvaModule } from "./modules/dva/dva.module";
import { WaitlistModule } from "./modules/waitlist/waitlist.module";

import { LoggerModule } from "./common/logger/logger.module";

import { MerchantContextMiddleware } from "./common/middleware/merchant-context.middleware";

import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";

function sanitizeRedisUrl(url: string | undefined): string | undefined {
  if (!url) return url;
  let cleanUrl = url.trim();
  if (cleanUrl.startsWith("REDIS_URL=")) {
    cleanUrl = cleanUrl.substring("REDIS_URL=".length);
  }
  if (cleanUrl.startsWith('"') && cleanUrl.endsWith('"')) {
    cleanUrl = cleanUrl.substring(1, cleanUrl.length - 1);
  }
  if (cleanUrl.startsWith("'") && cleanUrl.endsWith("'")) {
    cleanUrl = cleanUrl.substring(1, cleanUrl.length - 1);
  }
  return cleanUrl.trim();
}

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
        whatsappConfig,
      ],
      validationSchema: envValidationSchema,
    }),
    LoggerModule,
    ScheduleModule.forRoot(),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const rawUrl = configService.get<string>("redis.url");
        const urlString = sanitizeRedisUrl(rawUrl);

        if (!urlString) {
          Logger.warn(
            "REDIS_URL not found for CacheModule, falling back to localhost",
          );
          const store = await redisStore({
            host: "127.0.0.1",
            port: 6379,
            family: 0,
            ttl: 60 * 1000,
            enableReadyCheck: false,
          });
          return { store };
        }

        try {
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
            enableReadyCheck: false,
          });
          return { store };
        } catch (error: any) {
          Logger.error(
            `CacheModule failed to parse REDIS_URL prefix: ${urlString.substring(0, 15)}...`,
          );
          throw new Error(
            `Invalid REDIS_URL for CacheModule: ${error.message}`,
          );
        }
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
    PaymentModule,
    InventoryModule,
    NotificationModule,
    EmailModule,
    UploadModule,
    AdminModule,
    WhatsAppModule,
    PayoutModule,
    TradeFinancingModule,
    LogisticsModule,
    SupplierModule,
    CategoryModule,
    ReviewModule,
    BuyerModule,
    CartModule,
    WishlistModule,
    UssdModule,
    DvaModule,
    WaitlistModule,
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
