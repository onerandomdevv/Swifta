import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { WhatsAppService } from "./whatsapp.service";
import { WHATSAPP_QUEUE } from "../../queue/queue.constants";

/**
 * BullMQ processor for the WhatsApp queue.
 *
 * Job types:
 *  - process-message: Incoming WhatsApp message to handle
 *  - send-rfq-notification: Proactive RFQ push notification
 */
@Processor(WHATSAPP_QUEUE)
export class WhatsAppProcessor extends WorkerHost {
  private readonly logger = new Logger(WhatsAppProcessor.name);

  constructor(private whatsAppService: WhatsAppService) {
    super();
  }

  async process(job: Job): Promise<void> {
    try {
      switch (job.name) {
        case "process-message": {
          const { phone, messageText, messageId, interactiveReply } = job.data;
          await this.whatsAppService.processMessage(
            phone,
            messageText,
            messageId,
            interactiveReply,
          );
          break;
        }

        case "send-rfq-notification": {
          const { merchantId, rfqData } = job.data;
          await this.whatsAppService.sendRfqPushNotification(
            merchantId,
            rfqData,
          );
          break;
        }

        case "send-direct-order-notification": {
          const { merchantId, orderData } = job.data;
          await this.whatsAppService.sendDirectOrderNotification(
            merchantId,
            orderData,
          );
          break;
        }

        case "send-delivery-confirmed-notification": {
          const { merchantId, payoutData } = job.data;
          await this.whatsAppService.sendDeliveryConfirmedNotification(
            merchantId,
            payoutData,
          );
          break;
        }

        case "send-payout-completed-notification": {
          const { merchantId, payoutData } = job.data;
          await this.whatsAppService.sendPayoutCompletedNotification(
            merchantId,
            payoutData,
          );
          break;
        }

        case "send-payout-failed-notification": {
          const { merchantId, payoutData } = job.data;
          await this.whatsAppService.sendPayoutFailedNotification(
            merchantId,
            payoutData,
          );
          break;
        }

        default:
          this.logger.warn(`Unknown WhatsApp job type: ${job.name}`);
      }
    } catch (error) {
      this.logger.error(
        `WhatsApp job ${job.name} failed: ${error instanceof Error ? error.message : error}`,
      );
      // Don't rethrow — failed message sends should not retry infinitely
    }
  }
}
