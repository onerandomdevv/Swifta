import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  constructor(private config: ConfigService) {}

  async sendEmail(to: string, subject: string, html: string) {
      // Stub for Resend
      return { id: 'stub-email-id' };
  }
}
