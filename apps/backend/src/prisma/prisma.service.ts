import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super();
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
