import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { RFQ_EXPIRY_QUEUE } from '../../queue/queue.constants';
import { RFQService } from './rfq.service';

@Processor(RFQ_EXPIRY_QUEUE)
export class RFQExpiryProcessor extends WorkerHost {
  constructor(private readonly rfqService: RFQService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    await this.rfqService.expireStaleRFQs();
  }
}
