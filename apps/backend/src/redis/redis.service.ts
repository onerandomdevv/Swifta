import { Injectable, Inject } from "@nestjs/common";
import Redis from "ioredis";

@Injectable()
export class RedisService {
  constructor(@Inject("REDIS_CLIENT") private readonly redis: Redis) {}

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async set(
    key: string,
    value: string,
    ttl?: number,
    nx?: boolean,
  ): Promise<boolean> {
    const args: any[] = [key, value];
    if (ttl) {
      args.push("EX", ttl);
    }
    if (nx) {
      args.push("NX");
    }

    const res = await (this.redis.set as any)(...args);
    return res === "OK";
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async exists(key: string): Promise<number> {
    return this.redis.exists(key);
  }

  async hIncrBy(
    key: string,
    field: string,
    increment: number,
  ): Promise<number> {
    return this.redis.hincrby(key, field, increment);
  }

  async hGetAll(key: string): Promise<Record<string, string>> {
    return this.redis.hgetall(key);
  }

  async keys(pattern: string): Promise<string[]> {
    return this.redis.keys(pattern);
  }
}
