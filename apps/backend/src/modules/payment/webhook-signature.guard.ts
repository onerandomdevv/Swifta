import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class WebhookSignatureGuard implements CanActivate {
  private readonly logger = new Logger(WebhookSignatureGuard.name);

  constructor(private config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const signature = request.headers['x-paystack-signature'];
    const secret = this.config.get<string>('paystack.webhookSecret');

    if (!signature || !secret) {
      this.logger.warn('Missing webhook signature or secret');
      return false;
    }

    // Use raw body for HMAC to avoid JSON.stringify inconsistencies
    const body = request.rawBody || Buffer.from(JSON.stringify(request.body));

    const hash = crypto
      .createHmac('sha512', secret)
      .update(body)
      .digest('hex');

    const hashBuffer = Buffer.from(hash);
    const signatureBuffer = Buffer.from(signature);

    if (hashBuffer.length !== signatureBuffer.length) {
      this.logger.warn('Invalid webhook signature (length mismatch)');
      return false;
    }

    const isValid = crypto.timingSafeEqual(hashBuffer, signatureBuffer);

    if (!isValid) {
      this.logger.warn('Invalid webhook signature');
    }

    return isValid;
  }
}
