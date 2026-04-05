import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { PAYOUT_QUEUE } from "../../queue/queue.constants";
import { PayoutService } from "./payout.service";
import { Logger } from "@nestjs/common";

@Processor(PAYOUT_QUEUE, {
  drainDelay: 60000,
  stalledInterval: 300000,
  lockDuration: 60000,
})
export class PayoutProcessor extends WorkerHost {
  private readonly logger = new Logger(PayoutProcessor.name);

  constructor(private readonly payoutService: PayoutService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    if (job.name === "process-payout") {
      const { orderId } = job.data;
      this.logger.log(`Processing payout for order ${orderId}`);
      try {
        await this.payoutService.initiatePayout(orderId);
      } catch (e) {
        this.logger.error(`Payout job failed for order ${orderId}`, e);
        throw e; // To trigger retry or dead letter
      }
    }
  }
}
