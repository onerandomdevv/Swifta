import { Global, Module, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RedisService } from "./redis.service";
import Redis from "ioredis";

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

@Global()
@Module({
  providers: [
    {
      provide: "REDIS_CLIENT",
      useFactory: (configService: ConfigService) => {
        const rawUrl = configService.get<string>("redis.url");
        const urlString = sanitizeRedisUrl(rawUrl);

        if (!urlString) {
          Logger.warn(
            "REDIS_URL not found in config, falling back to localhost",
          );
          return new Redis("redis://127.0.0.1:6379", {
            enableReadyCheck: false,
            maxRetriesPerRequest: null,
          });
        }

        try {
          // If it's a full URL, ioredis can handle it directly.
          const isTls = urlString.startsWith("rediss://");

          return new Redis(urlString, {
            tls: isTls ? {} : undefined,
            family: 0,
            maxRetriesPerRequest: null,
            enableReadyCheck: false, // Required for Upstash compatibility
          });
        } catch (error: any) {
          Logger.error(
            `Failed to parse REDIS_URL prefix: ${urlString.substring(0, 15)}...`,
          );
          throw new Error(
            `Invalid REDIS_URL provided in environment variables: ${error.message}`,
          );
        }
      },
      inject: [ConfigService],
    },
    RedisService,
  ],
  exports: ["REDIS_CLIENT", RedisService],
})
export class RedisModule {}
