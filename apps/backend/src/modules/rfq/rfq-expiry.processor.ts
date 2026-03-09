import { Processor, WorkerHost, OnWorkerEvent } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { Logger } from "@nestjs/common";
import { RFQ_EXPIRY_QUEUE } from "../../queue/queue.constants";
import { RFQService } from "./rfq.service";
import { NotificationTriggerService } from "../notification/notification-trigger.service";

@Processor(RFQ_EXPIRY_QUEUE, {
  drainDelay: 60000,
  stalledInterval: 300000,
  lockDuration: 60000,
  metrics: null,
})
export class RFQExpiryProcessor extends WorkerHost {
  private readonly logger = new Logger(RFQExpiryProcessor.name);

  constructor(
    @InjectQueue(RFQ_EXPIRY_QUEUE) private readonly expiryQueue: Queue,
    private readonly rfqService: RFQService,
    private readonly notifications: NotificationTriggerService,
  ) {
    super();
  }

  async onModuleInit() {
    try {
      // Register repeatable job: run every hour
      await this.expiryQueue.add(
        "expire-stale-rfqs",
        {},
        {
          repeat: { pattern: "0 * * * *" }, // Every hour at minute 0
          removeOnComplete: true,
          removeOnFail: false,
        },
      );
      this.logger.log("RFQ expiry cron job registered (every hour)");
    } catch (error) {
      this.logger.error(
        `Failed to register RFQ expiry cron job: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log("Running RFQ expiry check...");

    const expiredBuyerIds = await this.rfqService.expireStaleRFQs();

    // Trigger notification for each affected buyer
    for (const buyerId of expiredBuyerIds) {
      await this.notifications.triggerRFQExpired(buyerId, "");
    }

    this.logger.log(`Expired ${expiredBuyerIds.length} stale RFQs`);
  }
}
