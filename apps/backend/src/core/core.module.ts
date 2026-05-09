import { CacheModule } from "@nestjs/cache-manager";
import { Module, Logger } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ScheduleModule } from "@nestjs/schedule";
import { ServeStaticModule } from "@nestjs/serve-static";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { redisStore } from "cache-manager-ioredis-yet";
import { join } from "path";

import { envValidationSchema } from "../common/config/env.validation";
import { LoggerModule } from "../common/logger/logger.module";
import africastalkingConfig from "../config/africastalking.config";
import aiConfig from "../config/ai.config";
import configuration from "../config/app.config";
import cloudinaryConfig from "../config/cloudinary.config";
import databaseConfig from "../config/database.config";
import jwtConfig from "../config/jwt.config";
import paystackConfig from "../config/paystack.config";
import resendConfig from "../config/resend.config";
import redisConfig from "../config/redis.config";
import whatsappConfig from "../config/whatsapp.config";
import { HealthModule } from "../health/health.module";
import { PrismaModule } from "../prisma/prisma.module";
import { RedisModule } from "../redis/redis.module";

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
      envFilePath: [".env.local", ".env"],
      load: [
        configuration,
        databaseConfig,
        redisConfig,
        jwtConfig,
        paystackConfig,
        africastalkingConfig,
        whatsappConfig,
        aiConfig,
        cloudinaryConfig,
        resendConfig,
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
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [PrismaModule, RedisModule, HealthModule],
})
export class CoreModule {}
