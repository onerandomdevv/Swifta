import { Controller, Get } from "@nestjs/common";
import {
  HealthCheckService,
  HealthCheck,
  MicroserviceHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from "@nestjs/terminus";
import { PrismaHealthIndicator } from "./indicators/prisma.health";
import { Transport } from "@nestjs/microservices";
import { ConfigService } from "@nestjs/config";

@Controller("health")
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaHealth: PrismaHealthIndicator,
    private microservice: MicroserviceHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private configService: ConfigService,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.prismaHealth.isHealthy("database"),
      () =>
        this.microservice.pingCheck("redis", {
          transport: Transport.REDIS,
          options: {
            url: this.configService.get("redis.url"),
          },
        }),
      () => this.memory.checkHeap("memory_heap", 150 * 1024 * 1024), // 150MB
      () =>
        this.disk.checkStorage("storage", {
          path: "/",
          thresholdPercent: 0.9,
        }), // 90%
    ]);
  }
}
