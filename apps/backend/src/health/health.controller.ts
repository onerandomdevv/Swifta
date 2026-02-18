import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Controller('health')
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  @Get()
  async check() {
    let dbStatus = false;
    let redisStatus = false;

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = true;
    } catch (e) {}

    try {
      await this.redis.set('health_check', 'ok', 5);
      redisStatus = true;
    } catch (e) {}

    return {
      status: 'ok',
      db: dbStatus,
      redis: redisStatus,
      timestamp: new Date().toISOString(),
    };
  }
}
