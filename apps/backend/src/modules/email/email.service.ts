import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;
  private readonly logger = new Logger(EmailService.name);
  private fromEmail: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.resend = new Resend(apiKey);
    this.fromEmail = this.configService.get<string>('EMAIL_FROM') || 'onboarding@resend.dev';
  }

  async sendPasswordResetEmail(to: string, resetToken: string, frontendUrl: string): Promise<void> {
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
    const subject = 'Reset your Hardware OS Password';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0f172a; text-align: center;">Password Reset Request</h2>
        <p style="color: #334155; font-size: 16px; line-height: 1.5;">
          Hello,
        </p>
        <p style="color: #334155; font-size: 16px; line-height: 1.5;">
          We received a request to reset your password for your Hardware OS account. If you didn't make this request, you can safely ignore this email.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
            Reset Your Password
          </a>
        </div>
        <p style="color: #64748b; font-size: 14px; margin-top: 40px; text-align: center;">
          This link will expire in 15 minutes.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">
          If you're having trouble clicking the button, copy and paste the URL below into your web browser:
          <br />
          <a href="${resetUrl}" style="color: #3b82f6;">${resetUrl}</a>
        </p>
      </div>
    `;

    try {
      const { data, error } = await this.resend.emails.send({
        from: `Hardware OS <${this.fromEmail}>`,
        to: [to],
        subject,
        html,
      });

      if (error) {
        this.logger.error(`Failed to send password reset email to ${to}: ${error.message}`);
        throw new Error('Email delivery failed');
      }

      this.logger.log(`Successfully sent password reset email to ${to} (ID: ${data?.id})`);
    } catch (err: any) {
      this.logger.error(`Error sending email via Resend: ${err.message}`);
    }
  }

  async sendVerificationEmail(to: string, otp: string): Promise<void> {
    const subject = 'Verify your Hardware OS Account';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center;">
        <h2 style="color: #0f172a;">Verify Your Email</h2>
        <p style="color: #334155; font-size: 16px; line-height: 1.5;">
          Please use the following 6-digit verification code to complete your registration:
        </p>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 30px auto; max-width: 200px;">
          <h1 style="color: #0f172a; letter-spacing: 4px; margin: 0;">${otp}</h1>
        </div>
        <p style="color: #64748b; font-size: 14px;">
          This code will expire in 10 minutes.
        </p>
      </div>
    `;

    try {
      const { data, error } = await this.resend.emails.send({
        from: `Hardware OS <${this.fromEmail}>`,
        to: [to],
        subject,
        html,
      });

      if (error) {
        this.logger.error(`Failed to send verification OTP to ${to}: ${error.message}`);
        throw new Error('Email delivery failed');
      }

      this.logger.log(`Successfully sent OTP to ${to} (ID: ${data?.id})`);
    } catch (err: any) {
      this.logger.error(`Error sending OTP via Resend: ${err.message}`);
    }
  }
}
