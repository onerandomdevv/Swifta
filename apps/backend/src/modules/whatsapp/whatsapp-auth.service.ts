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
  WELCOME_MESSAGE,
  LINK_OTP_SENT,
  LINK_SUCCESS,
  ALREADY_LINKED,
  EMAIL_NOT_FOUND,
  INVALID_OTP,
  OTP_EXPIRED,
} from "./whatsapp.constants";

interface SessionData {
  state: SessionState;
  data: Record<string, any>;
}

/**
 * Handles phone-number → merchant-account linking via WhatsApp.
 *
 * Flow:
 * 1. Unknown phone → prompt for email
 * 2. Email received → look up merchant, send OTP to email
 * 3. OTP received → verify, create WhatsAppLink
 */
@Injectable()
export class WhatsAppAuthService {
  private readonly logger = new Logger(WhatsAppAuthService.name);

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
    private emailService: EmailService,
  ) {}

  /**
   * Check if a phone number is linked to a merchant.
   * Returns the merchantId if linked & active, null otherwise.
   */
  async resolvePhone(phone: string): Promise<string | null> {
    try {
      const link = await (this.prisma.whatsAppLink as any).findUnique({
        where: { phone },
        select: { userId: true, isActive: true },
      });
      return link?.isActive ? link.userId : null;
    } catch (error) {
      this.logger.error(
        `Error resolving phone ${phone}: ${error instanceof Error ? error.message : error}`,
      );
      return null;
    }
  }

  /**
   * Handle a message from an unlinked phone number.
   * Manages the multi-step linking flow via Redis session state.
   *
   * @returns The response message to send back to the user
   */
  async handleLinkingFlow(phone: string, messageText: string): Promise<string> {
    const sessionKey = `${WA_SESSION_PREFIX}${phone}`;

    try {
      // Check for existing session
      const sessionRaw = await this.redisService.get(sessionKey);

      if (!sessionRaw) {
        // No session — start the linking flow
        const session: SessionData = {
          state: SessionState.AWAITING_EMAIL,
          data: {},
        };
        await this.redisService.set(
          sessionKey,
          JSON.stringify(session),
          SESSION_TTL,
        );
        return WELCOME_MESSAGE;
      }

      const session: SessionData = JSON.parse(sessionRaw);

      switch (session.state) {
        case SessionState.AWAITING_EMAIL:
          return this.handleEmailStep(phone, messageText, sessionKey);

        case SessionState.AWAITING_OTP:
          return this.handleOtpStep(phone, messageText, sessionKey, session);

        default:
          // Corrupt session — restart
          await this.redisService.del(sessionKey);
          return WELCOME_MESSAGE;
      }
    } catch (error) {
      this.logger.error(
        `Error in linking flow for ${phone}: ${error instanceof Error ? error.message : error}`,
      );
      await this.redisService.del(sessionKey);
      return WELCOME_MESSAGE;
    }
  }

  // -----------------------------------------------------------------------
  // Step: Email validation
  // -----------------------------------------------------------------------
  private async handleEmailStep(
    phone: string,
    email: string,
    sessionKey: string,
  ): Promise<string> {
    // Basic email format check
    const emailLower = email.toLowerCase().trim();
    if (!emailLower.includes("@") || !emailLower.includes(".")) {
      return "That doesn't look like a valid email address. Please reply with your registered email.";
    }

    const user = await this.prisma.user.findUnique({
      where: { email: emailLower },
      select: {
        id: true,
        role: true,
        firstName: true,
      },
    });

    if (!user || (user.role !== "MERCHANT" && user.role !== "SUPPLIER")) {
      return EMAIL_NOT_FOUND;
    }

    // Check if this user is already linked to a different phone
    const existingLink = await (this.prisma.whatsAppLink as any).findUnique({
      where: { userId: user.id },
    });
    if (existingLink && existingLink.phone !== phone) {
      return ALREADY_LINKED;
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpKey = `${WA_OTP_PREFIX}${phone}`;
    await this.redisService.set(otpKey, otp, OTP_TTL);

    // Send OTP to merchant's email
    try {
      await this.emailService.sendVerificationOTP(emailLower, otp);
    } catch (error) {
      this.logger.error(
        `Failed to send OTP email to ${emailLower}: ${error instanceof Error ? error.message : error}`,
      );
      return "I couldn't send the verification email right now. Please try again in a moment.";
    }

    // Update session to AWAITING_OTP
    const session: SessionData = {
      state: SessionState.AWAITING_OTP,
      data: {
        email: emailLower,
        userId: user.id,
        userName: user.firstName,
        role: user.role,
      },
    };
    await this.redisService.set(
      sessionKey,
      JSON.stringify(session),
      SESSION_TTL,
    );

    // Mask email for display
    const maskedEmail = this.maskEmail(emailLower);
    return LINK_OTP_SENT(maskedEmail);
  }

  // -----------------------------------------------------------------------
  // Step: OTP verification
  // -----------------------------------------------------------------------
  private async handleOtpStep(
    phone: string,
    otpInput: string,
    sessionKey: string,
    session: SessionData,
  ): Promise<string> {
    const otpKey = `${WA_OTP_PREFIX}${phone}`;
    const storedOtp = await this.redisService.get(otpKey);

    if (!storedOtp) {
      // OTP expired — restart flow
      await this.redisService.del(sessionKey);
      return OTP_EXPIRED;
    }

    const otpClean = otpInput.trim().replace(/\s/g, "");

    if (otpClean !== storedOtp) {
      return INVALID_OTP;
    }

    // OTP matches — create WhatsAppLink
    try {
      await (this.prisma.whatsAppLink as any).upsert({
        where: { phone },
        update: {
          userId: session.data.userId,
          isActive: true,
          linkedAt: new Date(),
        },
        create: {
          phone,
          userId: session.data.userId,
          isActive: true,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to create WhatsAppLink for ${phone}: ${error instanceof Error ? error.message : error}`,
      );
      await this.redisService.del(sessionKey);
      return "Something went wrong linking your account. Please try again.";
    }

    // Clean up session & OTP
    await this.redisService.del(sessionKey);
    await this.redisService.del(otpKey);

    this.logger.log(
      `WhatsApp linked: phone=${phone}, userId=${session.data.userId}, role=${session.data.role}`,
    );
    return LINK_SUCCESS(session.data.userName || "there");
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------
  private maskEmail(email: string): string {
    const [local, domain] = email.split("@");
    if (local.length <= 2) return `${local[0]}***@${domain}`;
    return `${local[0]}${local[1]}***@${domain}`;
  }
}
