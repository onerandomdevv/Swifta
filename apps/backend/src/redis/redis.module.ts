import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RedisService } from "./redis.service";
import Redis from "ioredis";

@Global()
@Module({
  providers: [
    {
      provide: "REDIS_CLIENT",
      useFactory: (configService: ConfigService) => {
        const urlString = configService.get<string>("redis.url");

        if (!urlString) {
          console.warn(
            "REDIS_URL not found in config, falling back to localhost",
          );
          return new Redis("redis://127.0.0.1:6379");
        }

        try {
          // If it's a full URL, ioredis can handle it directly.
          // We still want to enforce family: 0 and potentially TLS.
          const isTls = urlString.startsWith("rediss://");

          return new Redis(urlString, {
            tls: isTls ? { rejectUnauthorized: false } : undefined,
            family: 0, // Force IPv4/IPv6 resolution behavior
            maxRetriesPerRequest: null, // Recommended for BullMQ
          });
        } catch (error: any) {
          console.error(
            `Failed to parse REDIS_URL: ${urlString.substring(0, 10)}...`,
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
