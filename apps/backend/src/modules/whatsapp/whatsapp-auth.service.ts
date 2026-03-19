import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
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
  ROLE_SELECTED_MESSAGE,
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

// Helper to mask phone numbers — only show last 4 digits
function maskPhone(phone: string): string {
  if (phone.length <= 4) return "****";
  return `****${phone.slice(-4)}`;
}

// Helper to mask email
function maskEmail(email: string): string {
  if (!email) return "";
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}${local[1]}***@${domain}`;
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
    private configService: ConfigService,
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
      const link = await this.prisma.whatsAppLink.findUnique({
        where: { phone },
        include: {
          user: {
            include: { merchantProfile: { select: { id: true } } },
          },
        },
      });

      if (!link || !link.isActive) return null;

      // Return merchantId if available, otherwise userId
      return link.user.merchantProfile?.id || link.userId;
    } catch (error) {
      this.logger.error(
        `Error resolving phone ${maskPhone(phone)}: ${error instanceof Error ? error.message : error}`,
      );
      return null;
    }
  }

  /**
   * Check if a phone number is linked to a supplier.
   * Returns the supplierId if linked & active, null otherwise.
   */
  async resolveSupplierPhone(phone: string): Promise<string | null> {
    try {
      const link = await this.prisma.whatsAppSupplierLink.findUnique({
        where: { phone },
        select: { supplierId: true, isActive: true },
      });
      return link?.isActive ? link.supplierId : null;
    } catch (error) {
      this.logger.error(
        `Error resolving supplier phone ${maskPhone(phone)}: ${error instanceof Error ? error.message : error}`,
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
          state: SessionState.AWAITING_ROLE,
          data: {},
        };
        await this.redisService.set(
          sessionKey,
          JSON.stringify(session),
          SESSION_TTL,
        );
        return (
          this.configService.get("whatsapp.welcomeMessage") || WELCOME_MESSAGE
        );
      }

      const session: SessionData = JSON.parse(sessionRaw);

      switch (session.state) {
        case SessionState.AWAITING_ROLE:
          return this.handleRoleStep(phone, messageText, sessionKey, session);

        case SessionState.AWAITING_EMAIL:
          return this.handleEmailStep(phone, messageText, sessionKey);

        case SessionState.AWAITING_OTP:
          return this.handleOtpStep(phone, messageText, sessionKey, session);

        default:
          // Corrupt session — restart
          await this.redisService.del(sessionKey);
          return (
            this.configService.get<string>("whatsapp.welcomeMessage") ||
            WELCOME_MESSAGE
          );
      }
    } catch (error) {
      this.logger.error(
        `Error in linking flow for ${maskPhone(phone)}: ${error instanceof Error ? error.message : error}`,
      );
      await this.redisService.del(sessionKey);
      return (
        this.configService.get("whatsapp.welcomeMessage") || WELCOME_MESSAGE
      );
    }
  }

  // -----------------------------------------------------------------------
  // Step: Role selection
  // -----------------------------------------------------------------------
  private async handleRoleStep(
    phone: string,
    messageText: string,
    sessionKey: string,
    session: SessionData,
  ): Promise<string> {
    const text = messageText.trim();
    if (text === "1") {
      session.data.selectedRole = "BUYER";
    } else if (text === "2") {
      session.data.selectedRole = "MERCHANT";
    } else {
      return "Please reply with 1 for Buyer or 2 for Merchant.";
    }

    session.state = SessionState.AWAITING_EMAIL;
    await this.redisService.set(
      sessionKey,
      JSON.stringify(session),
      SESSION_TTL,
    );

    return ROLE_SELECTED_MESSAGE;
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

    if (!user) {
      return EMAIL_NOT_FOUND;
    }

    const actualRole = user.role;

    // Validate role context - suppliers can link even if not explicitly chosen
    if (
      actualRole !== "MERCHANT" &&
      actualRole !== "BUYER" &&
      actualRole !== "SUPPLIER"
    ) {
      return EMAIL_NOT_FOUND;
    }

    // Check if this user is already linked to a different phone based on their role
    let isLinked = false;
    let supplierId: string | undefined;

    if (actualRole === "MERCHANT") {
      const link = await this.prisma.whatsAppLink.findUnique({
        where: { userId: user.id },
      });
      if (link && link.phone !== phone) isLinked = true;
    } else if (actualRole === "BUYER") {
      const link = await this.prisma.whatsAppBuyerLink.findUnique({
        where: { buyerId: user.id },
      });
      if (link && link.phone !== phone) isLinked = true;
    } else if (actualRole === "SUPPLIER") {
      const profile = await this.prisma.supplierProfile.findUnique({
        where: { userId: user.id },
      });
      if (!profile) return EMAIL_NOT_FOUND;
      supplierId = profile.id; // Save for OTP step
      const link = await this.prisma.whatsAppSupplierLink.findUnique({
        where: { supplierId: profile.id },
      });
      if (link && link.phone !== phone) isLinked = true;
    }

    if (isLinked) {
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
        `Failed to send OTP email to ${maskEmail(emailLower)}: ${error instanceof Error ? error.message : error}`,
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
        supplierId,
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

    // OTP matches — create appropriate WhatsAppLink
    try {
      if (session.data.role === "MERCHANT") {
        await this.prisma.whatsAppLink.upsert({
          where: { phone },
          update: { userId: session.data.userId, isActive: true },
          create: { phone, userId: session.data.userId, isActive: true },
        });
      } else if (session.data.role === "BUYER") {
        await this.prisma.whatsAppBuyerLink.upsert({
          where: { phone },
          update: { buyerId: session.data.userId, isActive: true },
          create: { phone, buyerId: session.data.userId, isActive: true },
        });
      } else if (session.data.role === "SUPPLIER" && session.data.supplierId) {
        await this.prisma.whatsAppSupplierLink.upsert({
          where: { phone },
          update: { supplierId: session.data.supplierId, isActive: true },
          create: {
            phone,
            supplierId: session.data.supplierId,
            isActive: true,
          },
        });
      }
    } catch (error) {
      this.logger.error(
        `Failed to create WhatsAppLink for ${maskPhone(phone)}: ${error instanceof Error ? error.message : error}`,
      );
      await this.redisService.del(sessionKey);
      return "Something went wrong linking your account. Please try again.";
    }

    // Clean up session & OTP
    await this.redisService.del(sessionKey);
    await this.redisService.del(otpKey);

    this.logger.log(
      `WhatsApp linked: phone=${maskPhone(phone)}, userId=${session.data.userId}, role=${session.data.role}`,
    );
    return LINK_SUCCESS(session.data.userName || "there", session.data.role);
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
