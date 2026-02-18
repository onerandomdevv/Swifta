import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class WebhookSignatureGuard implements CanActivate {
  constructor(private config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const signature = request.headers['x-paystack-signature'];
    const secret = this.config.get<string>('paystack.webhookSecret');

    if (!signature || !secret) return false;

    const hash = crypto.createHmac('sha512', secret)
                       .update(JSON.stringify(request.body))
                       .digest('hex');

    return hash === signature;
  }
}
