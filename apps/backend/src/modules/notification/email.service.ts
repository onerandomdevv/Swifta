import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  constructor(private config: ConfigService) {}

  async sendEmail(to: string, subject: string, html: string) {
      // Stub for Resend
      console.log(`Sending email to ${to}: ${subject}`);
      return { id: 'stub-email-id' };
  }
}
