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
        const urlString =
          configService.get<string>("redis.url") || "redis://127.0.0.1:6379";
        const parsedUrl = new URL(urlString);
        return new Redis({
          host: parsedUrl.hostname,
          port: parseInt(parsedUrl.port, 10) || 6379,
          password: parsedUrl.password || undefined,
          username: parsedUrl.username || undefined,
          tls:
            parsedUrl.protocol === "rediss:"
              ? { rejectUnauthorized: false }
              : undefined,
          family: 0,
        });
      },
      inject: [ConfigService],
    },
    RedisService,
  ],
  exports: ["REDIS_CLIENT", RedisService],
})
export class RedisModule {}
