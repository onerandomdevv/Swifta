import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly pool: Pool;

  constructor() {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
    });
    const adapter = new PrismaPg(pool);
    super({ adapter });
    this.pool = pool;
  }

  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    this.logger.log("Connecting to database...");
    try {
      await this.$connect();
      this.logger.log("Successfully connected to database!");
    } catch (err) {
      this.logger.error("Failed to connect to database", err);
      throw err;
    }
  }

  async onModuleDestroy() {
    this.logger.log("Closing database connection pool...");
    await this.pool.end();
  }
}
