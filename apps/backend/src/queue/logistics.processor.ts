import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { Logger } from "@nestjs/common";
import { LOGISTICS_QUEUE } from "./queue.constants";
import { LogisticsService } from "../modules/logistics/logistics.service";

@Processor(LOGISTICS_QUEUE)
export class LogisticsProcessor extends WorkerHost {
  private readonly logger = new Logger(LogisticsProcessor.name);

  constructor(private readonly logisticsService: LogisticsService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);

    try {
      if (job.name === "book-pickup") {
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
