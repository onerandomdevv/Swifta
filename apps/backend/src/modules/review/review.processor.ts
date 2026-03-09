import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { ReviewService } from "./review.service";
import { WhatsAppService } from "../whatsapp/whatsapp.service";
import { REVIEW_QUEUE } from "../../queue/queue.constants";
import { PrismaService } from "../../prisma/prisma.service";

@Processor(REVIEW_QUEUE, {
  drainDelay: 60000,
  stalledInterval: 300000,
  lockDuration: 60000,
  metrics: null,
})
export class ReviewPromptProcessor extends WorkerHost {
  private readonly logger = new Logger(ReviewPromptProcessor.name);

  constructor(
    private reviewService: ReviewService,
    private whatsappService: WhatsAppService,
    private prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    try {
      const { orderId, buyerId } = job.data;

      // 1. Check if order still exists and is completed/delivered
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { review: true, merchantProfile: true, product: true },
      });

      if (!order) {
        this.logger.warn(`Order ${orderId} not found for review prompt`);
        return;
      }

      // 2. Check if already reviewed (via web dashboard)
      if (order.review) {
        this.logger.log(`Order ${orderId} already reviewed, skipping prompt`);
        return;
      }

      // 3. Send WhatsApp prompt
      const productName = order.product?.name || "your order";
      const merchantName =
        order.merchantProfile?.businessName || "the merchant";

      await this.whatsappService.sendReviewPrompt(
        buyerId,
        orderId,
        merchantName,
        productName,
      );

      this.logger.log(`Review prompt sent for order ${orderId}`);
    } catch (error) {
      this.logger.error(
        `Review prompt job failed: ${error instanceof Error ? error.message : error}`,
      );
      throw error; // Rethrow to allow BullMQ to retry
    }
  }
}
