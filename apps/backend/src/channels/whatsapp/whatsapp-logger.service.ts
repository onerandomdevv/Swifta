import { Injectable, Logger } from "@nestjs/common";
import { RedisService } from "../../redis/redis.service";

/**
 * Specialized logger for WhatsApp-specific metrics and observability.
 * Tracks intent parsing, vision API performance, and session life-cycles.
 */
@Injectable()
export class WhatsAppLoggerService {
  private readonly logger = new Logger("WhatsAppMetrics");
  private readonly METRICS_PREFIX = "wa_metrics:";

  constructor(private readonly redis: RedisService) {}

  async logIntent(intent: string, success: boolean, durationMs: number) {
    const key = `${this.METRICS_PREFIX}intent:${intent}`;
    await this.redis.hIncrBy(key, success ? "success" : "failure", 1);
    await this.redis.hIncrBy(key, "total_duration", durationMs);
    await this.redis.hIncrBy(key, "count", 1);

    this.logger.debug(
      `Intent: ${intent} | Success: ${success} | Duration: ${durationMs}ms`,
    );
  }

  async logVision(feature: string, success: boolean, durationMs: number) {
    const key = `${this.METRICS_PREFIX}vision:${feature}`;
    await this.redis.hIncrBy(key, success ? "success" : "failure", 1);
    await this.redis.hIncrBy(key, "total_duration", durationMs);
    await this.redis.hIncrBy(key, "count", 1);

    this.logger.log(
      `Vision API [${feature}] | Success: ${success} | Duration: ${durationMs}ms`,
    );
  }

  async logSessionEvent(type: string, userId: string, event: string) {
    this.logger.log(
      `Session [${type}] for ${this.maskPhone(userId)}: ${event}`,
    );
    // Optional: store session drop-off points in Redis
    const key = `${this.METRICS_PREFIX}sessions:${type}:dropoffs`;
    await this.redis.hIncrBy(key, event, 1);
  }

  private maskPhone(phone: any): string {
    if (phone == null || typeof phone !== "string") {
      return "****";
    }
    if (phone.length <= 4) return "****";
    return `****${phone.slice(-4)}`;
  }

  async getMetrics(category: string, subCategory: string) {
    const key = `${this.METRICS_PREFIX}${category}:${subCategory}`;
    return this.redis.hGetAll(key);
  }
}
