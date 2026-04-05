import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";
import { PlatformConfig } from "../../config/platform.config";

@Injectable()
export class EmailService {
  private resend: Resend;
  private readonly logger = new Logger(EmailService.name);
  private fromEmail: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>("RESEND_API_KEY");
    this.resend = new Resend(apiKey);
    this.fromEmail =
      this.configService.get<string>("EMAIL_FROM") || "onboarding@resend.dev";
  }

  /**
   * Core send method wrapped in try/catch to ensure email failures never break the flow
   */
  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      this.logger.log(`Sending email to ${to}: ${subject}`);

      const { data, error } = await this.resend.emails.send({
        from: `twizrr <${this.fromEmail}>`,
        to: [to],
        subject: `twizrr | ${subject}`,
        html,
      });

      if (error) {
        this.logger.error(
          `Resend API Error: ${error.message} (to: ${to}, subject: ${subject})`,
        );
        throw new Error(`Resend API Error: ${error.message}`);
      }

      this.logger.log(`Email sent successfully: ${data?.id}`);
    } catch (err: any) {
      this.logger.error(
        `Critical error in EmailService.sendEmail: ${err.message}`,
      );
      throw err;
    }
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  private formatNaira(kobo: number | bigint): string {
    const naira = Number(kobo) / 100;
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    })
      .format(naira)
      .replace("NGN", "₦");
  }

  private getLayout(content: string): string {
    return `
      <div style="font-family: 'DM Sans', 'Inter', sans-serif; max-width: 600px; margin: 0 auto; color: #0F2B4C; line-height: 1.6;">
        <div style="padding: 40px 20px; text-align: center; background-color: #0F2B4C; border-radius: 12px 12px 0 0;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: -0.03em; font-weight: 700;"><span style="color:#ffffff">twizrr</span></h1>
        </div>
        <div style="padding: 40px 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
          ${content}
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px; text-align: center;">
            <p>&copy; ${new Date().getFullYear()} twizrr. Built for Lagos trade.</p>
          </div>
        </div>
      </div>
    `;
  }

  async sendWelcomeEmail(
    to: string,
    name: string,
    role: string,
  ): Promise<void> {
    const safeName = this.escapeHtml(name);
    const safeRole = this.escapeHtml(role);
    const content = `
      <h2 style="font-size: 20px; margin-bottom: 20px;">Welcome to twizrr, ${safeName}!</h2>
      <p>We're excited to have you on board as a <strong>${safeRole}</strong>.</p>
      <p>twizrr is digitizing Africa's digital trade network, and you're now part of the movement.</p>
      ${
        role === "MERCHANT"
          ? `<p>Next step: Complete your business profile and start listing your products to receive orders from buyers.</p>`
          : `<p>Next step: Browse our merchant catalogues and start shopping for your favorite products.</p>`
      }
      <div style="margin-top: 30px; text-align: center;">
        <a href="${this.configService.get("FRONTEND_URL")}/dashboard" style="background-color: #0F2B4C; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Go to Dashboard</a>
      </div>
    `;
    await this.sendEmail(to, "Welcome to twizrr", this.getLayout(content));
  }

  async sendVerificationOTP(to: string, otp: string): Promise<void> {
    const safeOtp = this.escapeHtml(otp);
    const content = `
      <h2 style="font-size: 20px; margin-bottom: 20px; text-align: center;">Your Verification Code</h2>
      <p style="text-align: center;">Please use the following code to verify your account. It expires in ${PlatformConfig.timers.otpExpiryEmailMinutes} minutes.</p>
      <div style="background-color: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 12px; padding: 20px; margin: 30px auto; max-width: 200px; text-align: center;">
        <h1 style="font-size: 32px; letter-spacing: 8px; margin: 0; color: #0f172a;">${safeOtp}</h1>
      </div>
    `;
    await this.sendEmail(to, "Your Verification Code", this.getLayout(content));
  }

  async sendPaymentConfirmedNotification(
    to: string,
    reference: string,
    amountKobo: bigint,
    isMerchant: boolean,
  ): Promise<void> {
    const safeReference = this.escapeHtml(reference.slice(0, 8));
    const content = `
      <h2 style="font-size: 20px; margin-bottom: 20px;">Payment Confirmed</h2>
      <p>Payment of <strong>${this.formatNaira(amountKobo)}</strong> has been confirmed for Order <strong>#${safeReference}</strong>.</p>
      ${
        isMerchant
          ? `<p>Please prepare the goods for dispatch. Your payout will be released once delivery is confirmed.</p>`
          : `<p>Your payment is held securely in escrow. The merchant has been notified to dispatch your goods.</p>`
      }
    `;
    await this.sendEmail(
      to,
      `Payment confirmed for Order #${safeReference}`,
      this.getLayout(content),
    );
  }

  async sendOrderDispatchedNotification(
    to: string,
    reference: string,
    otp: string,
  ): Promise<void> {
    const safeReference = this.escapeHtml(reference.slice(0, 8));
    const safeOtp = this.escapeHtml(otp);
    const content = `
      <h2 style="font-size: 20px; margin-bottom: 20px;">Your Order Has Been Dispatched!</h2>
      <p>Order <strong>#${safeReference}</strong> is on its way to your delivery address.</p>
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin: 30px 0;">
        <p style="margin-top: 0; color: #166534; font-weight: bold;">Delivery Verification Code:</p>
        <h1 style="font-size: 32px; letter-spacing: 4px; margin: 10px 0; color: #166534;">${safeOtp}</h1>
        <p style="margin-bottom: 0; font-size: 13px; color: #166534;">IMPORTANT: Only share this code with the driver AFTER you have inspected and received your goods.</p>
      </div>
    `;
    await this.sendEmail(
      to,
      "Your order has been dispatched",
      this.getLayout(content),
    );
  }

  async sendDeliveryConfirmedNotification(
    to: string,
    reference: string,
    amountKobo: bigint,
  ): Promise<void> {
    const safeReference = this.escapeHtml(reference.slice(0, 8));
    const content = `
      <h2 style="font-size: 20px; margin-bottom: 20px;">Delivery Confirmed Success!</h2>
      <p>Delivery of Order <strong>#${safeReference}</strong> has been confirmed.</p>
      <p>The transaction of <strong>${this.formatNaira(amountKobo)}</strong> is now complete.</p>
      <p>Thank you for trading with twizrr!</p>
    `;
    await this.sendEmail(
      to,
      `Order #${safeReference} delivered successfully`,
      this.getLayout(content),
    );
  }

  async sendPasswordResetEmail(
    to: string,
    resetToken: string,
    frontendUrl: string,
  ): Promise<void> {
    const resetUrl = `${frontendUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;
    const content = `
      <h2 style="font-size: 20px; margin-bottom: 20px;">Password Reset Request</h2>
      <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
      <div style="margin-top: 30px; text-align: center;">
        <a href="${resetUrl}" style="background-color: #0F2B4C; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
      </div>
      <p style="margin-top: 30px; font-size: 12px; color: #94a3b8;">This link will expire in ${PlatformConfig.timers.otpExpiryAuthMinutes} minutes.</p>
    `;
    await this.sendEmail(
      to,
      "Reset your twizrr Password",
      this.getLayout(content),
    );
  }

  async sendWaitlistAlert(
    to: string,
    businessName: string,
    email: string,
    phone: string,
  ): Promise<void> {
    const safeName = this.escapeHtml(businessName);
    const safeEmail = this.escapeHtml(email);
    const safePhone = this.escapeHtml(phone);

    const content = `
      <h2 style="font-size: 20px; margin-bottom: 20px;">🚀 New Waitlist Signup!</h2>
      <p>A new merchant has just joined the Twizrr waitlist.</p>
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Business:</strong> ${safeName}</p>
        <p style="margin: 5px 0;"><strong>Email:</strong> ${safeEmail}</p>
        <p style="margin: 5px 0;"><strong>Phone:</strong> ${safePhone}</p>
        <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleString("en-NG")}</p>
      </div>
      <p>Time to reach out and say hi!</p>
    `;
    await this.sendEmail(
      to,
      `New Waitlist Signup: ${safeName}`,
      this.getLayout(content),
    );
  }
}
