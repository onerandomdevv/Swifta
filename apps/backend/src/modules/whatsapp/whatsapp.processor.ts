import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { WhatsAppService } from './whatsapp.service';
import { WHATSAPP_QUEUE } from '../../queue/queue.constants';

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
        case 'process-message': {
          const { phone, messageText, messageId } = job.data;
          await this.whatsAppService.processMessage(phone, messageText, messageId);
          break;
        }

        case 'send-rfq-notification': {
          const { merchantId, rfqData } = job.data;
          await this.whatsAppService.sendRfqPushNotification(merchantId, rfqData);
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
