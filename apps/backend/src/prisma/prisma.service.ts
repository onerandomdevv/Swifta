import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    super({ adapter });
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
}
