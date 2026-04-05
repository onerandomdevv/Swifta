import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { Logger } from "@nestjs/common";
import { LOGISTICS_QUEUE } from "./queue.constants";
import { LogisticsService } from "../modules/logistics/logistics.service";

@Processor(LOGISTICS_QUEUE, {
  drainDelay: 60000,
  stalledInterval: 300000,
  lockDuration: 60000,
})
export class LogisticsProcessor extends WorkerHost {
  private readonly logger = new Logger(LogisticsProcessor.name);

  constructor(private readonly logisticsService: LogisticsService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);

    try {
      if (job.name === "book-pickup") {
        if (
          !job.data ||
          typeof job.data.orderId !== "string" ||
          !job.data.orderId.trim()
        ) {
          this.logger.error(
            `Job ${job.id} (book-pickup) has invalid or missing orderId. job.data=${JSON.stringify(job.data)}. Skipping.`,
          );
          return;
        }
        await this.logisticsService.bookPickup(job.data.orderId);
      }
    } catch (error) {
      this.logger.error(
        `Failed to process logistics job ${job.id}: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }
}
