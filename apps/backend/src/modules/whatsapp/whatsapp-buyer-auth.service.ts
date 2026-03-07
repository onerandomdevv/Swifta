import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { RedisService } from "../../redis/redis.service";
import { EmailService } from "../email/email.service";
import {
  SessionState,
  WA_SESSION_PREFIX,
  WA_OTP_PREFIX,
  SESSION_TTL,
  OTP_TTL,
  EMAIL_NOT_FOUND,
  INVALID_OTP,
  OTP_EXPIRED,
} from "./whatsapp.constants";

const BUYER_WELCOME_MESSAGE = `Welcome to SwiftTrade Buyer Bot! 🛒

To start placing orders natively right here on WhatsApp, please reply with your registered email address to link your buyer profile.`;

const BUYER_LINK_SUCCESS = (buyerName: string) =>
  `You're all set, ${buyerName}! 🎉\n\nYou can now tell me what you want to buy, or say "track my order" if you have any active deliveries.`;

const BUYER_ALREADY_LINKED = `This phone number is already linked to a SwiftTrade buyer account.`;

interface SessionData {
  state: SessionState;
  data: Record<string, any>;
}

@Injectable()
export class WhatsAppBuyerAuthService {
  private readonly logger = new Logger(WhatsAppBuyerAuthService.name);

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
    private emailService: EmailService,
  ) {}

  /**
   * Check if a phone number is linked to a buyer.
   * Returns the buyerId if linked & active, null otherwise.
   */
  async resolvePhone(phone: string): Promise<string | null> {
    try {
      const link = await this.prisma.whatsAppBuyerLink.findUnique({
        where: { phone },
        select: { buyerId: true, isActive: true },
      });
      return link?.isActive ? link.buyerId : null;
    } catch (error) {
      this.logger.error(
        `Error resolving phone ${phone}: ${error instanceof Error ? error.message : error}`,
      );
      return null;
    }
  }

  /**
   * Handle unlinked buyer
   */
  async handleLinkingFlow(phone: string, messageText: string): Promise<string> {
    const sessionKey = `${WA_SESSION_PREFIX}buyer_${phone}`;

    try {
      const sessionRaw = await this.redisService.get(sessionKey);

      if (!sessionRaw) {
        const session: SessionData = {
          state: SessionState.AWAITING_EMAIL,
          data: {},
        };
        await this.redisService.set(
          sessionKey,
          JSON.stringify(session),
          SESSION_TTL,
        );
        return BUYER_WELCOME_MESSAGE;
      }

      const session: SessionData = JSON.parse(sessionRaw);

      switch (session.state) {
        case SessionState.AWAITING_EMAIL:
          return this.handleEmailStep(phone, messageText, sessionKey);
        case SessionState.AWAITING_OTP:
          return this.handleOtpStep(phone, messageText, sessionKey, session);
        default:
          await this.redisService.del(sessionKey);
          return BUYER_WELCOME_MESSAGE;
      }
    } catch (error) {
      this.logger.error(
        `Error in linking flow for ${phone}: ${error instanceof Error ? error.message : error}`,
      );
      await this.redisService.del(sessionKey);
      return BUYER_WELCOME_MESSAGE;
    }
  }

  private async handleEmailStep(
    phone: string,
    email: string,
    sessionKey: string,
  ): Promise<string> {
    const emailLower = email.toLowerCase().trim();
    if (!emailLower.includes("@") || !emailLower.includes(".")) {
      return "That doesn't look like a valid email address. Please reply with your registered email.";
    }

    // Look up the buyer
    const user = await this.prisma.user.findUnique({
      where: { email: emailLower },
      select: {
        id: true,
        role: true,
        firstName: true,
      },
    });

    if (!user || user.role !== "BUYER") {
      return EMAIL_NOT_FOUND;
    }

    // Check existing phone links
    const existingLink = await this.prisma.whatsAppBuyerLink.findUnique({
      where: { buyerId: user.id },
    });
    if (existingLink && existingLink.phone !== phone) {
      return BUYER_ALREADY_LINKED;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpKey = `${WA_OTP_PREFIX}buyer_${phone}`;
    await this.redisService.set(otpKey, otp, OTP_TTL);

    try {
      await this.emailService.sendVerificationOTP(emailLower, otp);
    } catch (error) {
      this.logger.error(
        `Failed to send OTP to ${emailLower}: ${error instanceof Error ? error.message : error}`,
      );
      return "I couldn't send the email. Please try again in a moment.";
    }

    const session: SessionData = {
      state: SessionState.AWAITING_OTP,
      data: {
        email: emailLower,
        buyerId: user.id,
        buyerName: user.firstName,
      },
    };
    await this.redisService.set(
      sessionKey,
      JSON.stringify(session),
      SESSION_TTL,
    );

    const maskedEmail = this.maskEmail(emailLower);
    return `I've sent a 6-digit verification code to ${maskedEmail}. Please reply with the code.`;
  }

  private async handleOtpStep(
    phone: string,
    otpInput: string,
    sessionKey: string,
    session: SessionData,
  ): Promise<string> {
    const otpKey = `${WA_OTP_PREFIX}buyer_${phone}`;
    const storedOtp = await this.redisService.get(otpKey);

    if (!storedOtp) {
      await this.redisService.del(sessionKey);
      return OTP_EXPIRED;
    }

    const otpClean = otpInput.trim().replace(/\s/g, "");

    if (otpClean !== storedOtp) {
      return INVALID_OTP;
    }

    try {
      await this.prisma.whatsAppBuyerLink.upsert({
        where: { phone },
        update: {
          buyerId: session.data.buyerId,
          isActive: true,
          linkedAt: new Date(),
        },
        create: {
          phone,
          buyerId: session.data.buyerId,
          isActive: true,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to create WhatsAppBuyerLink for ${phone}: ${error instanceof Error ? error.message : error}`,
      );
      await this.redisService.del(sessionKey);
      return "Something went wrong. Please try again.";
    }

    await this.redisService.del(sessionKey);
    await this.redisService.del(otpKey);

    this.logger.log(
      `Buyer WhatsApp linked: phone=${phone}, buyerId=${session.data.buyerId}`,
    );
    return BUYER_LINK_SUCCESS(session.data.buyerName || "Buyer");
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split("@");
    if (local.length <= 2) return `${local[0]}***@${domain}`;
    return `${local[0]}${local[1]}***@${domain}`;
  }
}
