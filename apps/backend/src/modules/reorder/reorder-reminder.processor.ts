import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { Logger } from "@nestjs/common";
import { REORDER_REMINDER_QUEUE } from "../../queue/queue.constants";
import { ReorderService } from "./reorder.service";

@Processor(REORDER_REMINDER_QUEUE, {
  drainDelay: 60000,
  stalledInterval: 300000,
  lockDuration: 60000,
  metrics: null,
})
export class ReorderReminderProcessor extends WorkerHost {
  private readonly logger = new Logger(ReorderReminderProcessor.name);

  constructor(
    @InjectQueue(REORDER_REMINDER_QUEUE) private readonly reorderQueue: Queue,
    private readonly reorderService: ReorderService,
  ) {
    super();
  }

  async onModuleInit() {
    try {
      await this.reorderQueue.add(
        "process-reorder-reminders",
        {},
        {
          repeat: { pattern: "0 8 * * *" }, // Daily at 8 AM
          removeOnComplete: true,
          removeOnFail: false,
        },
      );
      this.logger.log("Reorder reminder cron job registered (daily at 8 AM)");
    } catch (error) {
      this.logger.error(
        `Failed to register reorder reminder cron job: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  async process(_job: Job<any, any, string>): Promise<any> {
    this.logger.log("Running reorder reminder check...");
    const count = await this.reorderService.processReminders();
    this.logger.log(`Processed ${count} reorder reminders`);
  }
}
