import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { PrismaService } from "../../prisma/prisma.service";
import { EmailService } from "../email/email.service";
import { WhatsAppInteractiveService } from "./whatsapp-interactive.service";
import {
  ONBOARDING_SESSION_TTL,
  NIGERIAN_BANKS,
  OnboardingStep,
} from "./whatsapp.constants";

/**
 * WhatsApp-Only Onboarding Service
 *
 * Handles full account creation for both buyers and merchants
 * entirely via WhatsApp conversation. Uses Meta Interactive Messages
 * (Reply Buttons and List Messages) for structured input.
 *
 * Flow:
 *  Unknown phone → Welcome buttons → Role selection → Data collection → Account creation
 */
@Injectable()
export class WhatsAppOnboardingService {
  private readonly logger = new Logger(WhatsAppOnboardingService.name);
  private readonly paystackSecretKey: string;

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private interactiveService: WhatsAppInteractiveService,
    private configService: ConfigService,
  ) {
    this.paystackSecretKey =
      this.configService.get<string>("PAYSTACK_SECRET_KEY") || "";
  }

  private maskIdentifier(identifier: string): string {
    if (!identifier) return "";
    if (identifier.includes("@")) {
      const [local, domain] = identifier.split("@");
      return `${local.substring(0, 2)}***@${domain}`;
    }
    return identifier.length > 4
      ? `****${identifier.substring(identifier.length - 4)}`
      : "****";
  }

  // =======================================================================
  // Main entry point
  // =======================================================================
  async handleOnboarding(
    phone: string,
    messageText?: string,
    interactiveReply?: { type: string; id: string; title: string },
  ): Promise<void> {
    try {
      // 1. Check for existing onboarding session
      const session = await this.prisma.onboardingSession.findUnique({
        where: { phone },
      });

      if (!session) {
        // Handle interactive replies from welcome/learn-more messages
        if (interactiveReply) {
          if (
            interactiveReply.id === "onboard_buyer" ||
            interactiveReply.id === "onboard_merchant"
          ) {
            await this.startOnboarding(phone, interactiveReply.id);
            return;
          }
          if (interactiveReply.id === "learn_more") {
            await this.handleLearnMore(phone);
            return;
          }
        }

        // Handle text fallback for role selection
        if (messageText) {
          const lower = messageText.toLowerCase().trim();
          if (
            lower === "buy" ||
            lower === "buyer" ||
            lower.includes("buy product")
          ) {
            await this.startOnboarding(phone, "onboard_buyer");
            return;
          }
          if (
            lower === "sell" ||
            lower === "seller" ||
            lower === "merchant" ||
            lower.includes("sell product")
          ) {
            await this.startOnboarding(phone, "onboard_merchant");
            return;
          }
        }

        // No session, no recognized intent → show welcome
        await this.sendWelcome(phone);
        return;
      }

      // 2. Session exists — check expiry
      if (new Date() > session.expiresAt) {
        await this.prisma.onboardingSession.delete({
          where: { id: session.id },
        });
        await this.sendWelcome(phone);
        return;
      }

      // 3. Route to the correct step handler
      const step = session.step as OnboardingStep;
      const data = (session.data as Record<string, any>) || {};

      if (session.userType === "BUYER") {
        await this.handleBuyerStep(
          phone,
          session.id,
          step,
          data,
          messageText,
          interactiveReply,
        );
      } else if (session.userType === "MERCHANT") {
        await this.handleMerchantStep(
          phone,
          session.id,
          step,
          data,
          messageText,
          interactiveReply,
        );
      }
    } catch (error) {
      this.logger.error(
        `Onboarding error for ${this.maskIdentifier(phone)}: ${error instanceof Error ? error.message : error}`,
      );
      await this.interactiveService.sendTextMessage(
        phone,
        "Something went wrong. Please try again by sending any message.",
      );
    }
  }

  // =======================================================================
  // Welcome & Learn More
  // =======================================================================
  private async sendWelcome(phone: string): Promise<void> {
    await this.interactiveService.sendReplyButtons(
      phone,
      "Welcome to SwiftTrade! 🔗\n\nNigeria's WhatsApp marketplace — buy and sell anything with payment protection.\n\n✅ Escrow-protected payments\n📦 Tracked delivery\n💰 Instant merchant payouts\n\nHow would you like to use SwiftTrade?",
      [
        { id: "onboard_buyer", title: "Buy Products" },
        { id: "onboard_merchant", title: "Sell Products" },
        { id: "learn_more", title: "Learn More" },
      ],
    );
  }

  private async handleLearnMore(phone: string): Promise<void> {
    await this.interactiveService.sendReplyButtons(
      phone,
      "SwiftTrade is a marketplace where you can buy and sell products securely through WhatsApp.\n\n🔒 Payments are protected — your money is held safely until you receive your goods\n🚚 Track your deliveries in real-time\n⭐ Buy from verified, rated merchants\n💰 Merchants get paid instantly to their bank\n\nReady to get started?",
      [
        { id: "onboard_buyer", title: "Sign Up to Buy" },
        { id: "onboard_merchant", title: "Sign Up to Sell" },
      ],
    );
  }

  // =======================================================================
  // Start Onboarding (create session)
  // =======================================================================
  private async startOnboarding(phone: string, roleId: string): Promise<void> {
    const userType = roleId === "onboard_buyer" ? "BUYER" : "MERCHANT";
    const firstStep =
      userType === "BUYER"
        ? OnboardingStep.BUYER_TYPE
        : OnboardingStep.MERCHANT_BUSINESS_NAME;

    await this.prisma.onboardingSession.upsert({
      where: { phone },
      update: {
        userType,
        step: firstStep,
        data: {},
        expiresAt: new Date(Date.now() + ONBOARDING_SESSION_TTL * 1000),
      },
      create: {
        phone,
        userType,
        step: firstStep,
        data: {},
        expiresAt: new Date(Date.now() + ONBOARDING_SESSION_TTL * 1000),
      },
    });

    if (userType === "BUYER") {
      await this.interactiveService.sendReplyButtons(
        phone,
        "Welcome to SwiftTrade! 🔗 Let's set up your buyer account.\n\nAre you buying for a business or as an individual?",
        [
          { id: "buyer_type_business", title: "Business" },
          { id: "buyer_type_individual", title: "Individual" },
        ],
      );
    } else {
      await this.interactiveService.sendTextMessage(
        phone,
        "Great! Let's set up your merchant account.\n\nWhat's your business name?",
      );
    }
  }

  // =======================================================================
  // Buyer Flow
  // =======================================================================
  private async handleBuyerStep(
    phone: string,
    sessionId: string,
    step: OnboardingStep,
    data: Record<string, any>,
    messageText?: string,
    interactiveReply?: { type: string; id: string; title: string },
  ): Promise<void> {
    switch (step) {
      case OnboardingStep.BUYER_TYPE:
        await this.handleBuyerType(phone, sessionId, data, interactiveReply);
        break;
      case OnboardingStep.BUYER_BUSINESS_NAME:
        await this.handleBuyerBusinessName(phone, sessionId, data, messageText);
        break;
      case OnboardingStep.BUYER_NAME:
        await this.handleBuyerName(phone, sessionId, data, messageText);
        break;
      case OnboardingStep.BUYER_EMAIL:
        await this.handleBuyerEmail(phone, sessionId, data, messageText);
        break;
      case OnboardingStep.BUYER_OTP:
        await this.handleBuyerOtp(
          phone,
          sessionId,
          data,
          messageText,
          interactiveReply,
        );
        break;
      default:
        await this.interactiveService.sendTextMessage(
          phone,
          "Something went wrong with your registration. Please try again.",
        );
        await this.prisma.onboardingSession.delete({
          where: { id: sessionId },
        });
        await this.sendWelcome(phone);
    }
  }

  private async handleBuyerType(
    phone: string,
    sessionId: string,
    data: Record<string, any>,
    interactiveReply?: { type: string; id: string; title: string },
  ): Promise<void> {
    if (!interactiveReply) {
      await this.interactiveService.sendReplyButtons(
        phone,
        "Please select your buyer type:",
        [
          { id: "buyer_type_business", title: "Business" },
          { id: "buyer_type_individual", title: "Individual" },
        ],
      );
      return;
    }

    const buyerType =
      interactiveReply.id === "buyer_type_business" ? "BUSINESS" : "CONSUMER";

    if (buyerType === "BUSINESS") {
      await this.updateSession(sessionId, OnboardingStep.BUYER_BUSINESS_NAME, {
        ...data,
        buyerType,
      });
      await this.interactiveService.sendTextMessage(
        phone,
        "What's your business name?",
      );
    } else {
      await this.updateSession(sessionId, OnboardingStep.BUYER_NAME, {
        ...data,
        buyerType,
      });
      await this.interactiveService.sendTextMessage(
        phone,
        "Great! What's your full name?",
      );
    }
  }

  private async handleBuyerBusinessName(
    phone: string,
    sessionId: string,
    data: Record<string, any>,
    messageText?: string,
  ): Promise<void> {
    if (!messageText || messageText.trim().length < 2) {
      await this.interactiveService.sendTextMessage(
        phone,
        "Please enter a valid business name (at least 2 characters).",
      );
      return;
    }

    await this.updateSession(sessionId, OnboardingStep.BUYER_NAME, {
      ...data,
      businessName: messageText.trim(),
    });

    await this.interactiveService.sendTextMessage(
      phone,
      "Thanks! And what's your full name?",
    );
  }

  private async handleBuyerName(
    phone: string,
    sessionId: string,
    data: Record<string, any>,
    messageText?: string,
  ): Promise<void> {
    if (!messageText || messageText.trim().length < 2) {
      await this.interactiveService.sendTextMessage(
        phone,
        "Please enter your full name (at least 2 characters).",
      );
      return;
    }

    const fullName = messageText.trim();
    const parts = fullName.split(" ");
    const firstName = parts[0];
    const lastName = parts.slice(1).join(" ") || "";

    await this.updateSession(sessionId, OnboardingStep.BUYER_EMAIL, {
      ...data,
      firstName,
      lastName,
      fullName,
    });

    await this.interactiveService.sendTextMessage(
      phone,
      `Thanks, ${firstName}! What's your email address? We'll send you a verification code.`,
    );
  }

  private async handleBuyerEmail(
    phone: string,
    sessionId: string,
    data: Record<string, any>,
    messageText?: string,
  ): Promise<void> {
    if (!messageText) {
      await this.interactiveService.sendTextMessage(
        phone,
        "Please enter your email address.",
      );
      return;
    }

    const email = messageText.toLowerCase().trim();
    if (!email.includes("@") || !email.includes(".")) {
      await this.interactiveService.sendTextMessage(
        phone,
        "That doesn't look like a valid email address. Please try again.",
      );
      return;
    }

    // Check if email is already registered
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      await this.interactiveService.sendTextMessage(
        phone,
        "This email is already registered. If you already have a SwiftTrade account, please visit swifta.store to link your WhatsApp number, or use a different email.",
      );
      return;
    }

    if (data.otpSentAt && Date.now() - data.otpSentAt < 60 * 1000) {
      await this.interactiveService.sendTextMessage(
        phone,
        "Please wait a minute before requesting another code.",
      );
      return;
    }

    // Generate and send OTP
    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = crypto
      .createHmac("sha256", this.paystackSecretKey)
      .update(otp)
      .digest("hex");

    try {
      await this.emailService.sendVerificationOTP(email, otp);
    } catch (error) {
      this.logger.error(
        `Failed to send OTP to ${this.maskIdentifier(email)}: ${error instanceof Error ? error.message : error}`,
      );
      await this.interactiveService.sendTextMessage(
        phone,
        "I couldn't send the verification email right now. Please try again in a moment.",
      );
      return;
    }

    await this.updateSession(sessionId, OnboardingStep.BUYER_OTP, {
      ...data,
      email,
      otpHash,
      otpAttempts: 0,
      otpSentAt: Date.now(),
    });

    await this.interactiveService.sendReplyButtons(
      phone,
      `I've sent a 6-digit code to ${email}. Please reply with the code.`,
      [{ id: "resend_otp", title: "Resend Code" }],
    );
  }

  private async handleBuyerOtp(
    phone: string,
    sessionId: string,
    data: Record<string, any>,
    messageText?: string,
    interactiveReply?: { type: string; id: string; title: string },
  ): Promise<void> {
    if (interactiveReply?.id === "resend_otp") {
      await this.handleBuyerEmail(phone, sessionId, data, data.email);
      return;
    }

    if (!messageText) {
      await this.interactiveService.sendTextMessage(
        phone,
        "Please enter the 6-digit verification code sent to your email.",
      );
      return;
    }

    const otpInput = messageText.trim().replace(/\s/g, "");

    // Check OTP expiry (10 minutes)
    if (data.otpSentAt && Date.now() - data.otpSentAt > 10 * 60 * 1000) {
      await this.prisma.onboardingSession.delete({
        where: { id: sessionId },
      });
      await this.interactiveService.sendTextMessage(
        phone,
        "The verification code has expired. Please start again by sending any message.",
      );
      return;
    }

    const inputHash = crypto
      .createHmac("sha256", this.paystackSecretKey)
      .update(otpInput)
      .digest("hex");

    if (inputHash !== data.otpHash) {
      const attempts = (data.otpAttempts || 0) + 1;
      if (attempts >= 3) {
        await this.prisma.onboardingSession.delete({
          where: { id: sessionId },
        });
        await this.interactiveService.sendTextMessage(
          phone,
          "Too many incorrect attempts. Please visit swifta.store to register instead, or try again later.",
        );
        return;
      }

      await this.updateSession(sessionId, OnboardingStep.BUYER_OTP, {
        ...data,
        otpAttempts: attempts,
      });

      await this.interactiveService.sendTextMessage(
        phone,
        `That code doesn't match. You have ${3 - attempts} attempt(s) remaining. Please check your email and try again.`,
      );
      return;
    }

    // OTP verified — create account
    await this.createBuyerAccount(phone, sessionId, data);
  }

  private async createBuyerAccount(
    phone: string,
    sessionId: string,
    data: Record<string, any>,
  ): Promise<void> {
    try {
      // Generate a random password (user can reset via web later)
      const randomPassword =
        Math.random().toString(36).slice(-12) +
        Math.random().toString(36).slice(-4);
      const passwordHash = await bcrypt.hash(randomPassword, 10);

      // Format phone to +234... format
      const formattedPhone = phone.startsWith("234") ? `+${phone}` : phone;

      // Create User + BuyerProfile + WhatsAppBuyerLink in a transaction
      await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: data.email,
            phone: formattedPhone,
            firstName: data.firstName,
            lastName: data.lastName || "",
            passwordHash,
            role: "BUYER",
            emailVerified: true,
            buyerProfile: {
              create: {
                buyerType: data.buyerType || "BUSINESS",
                businessName: data.businessName || null,
              },
            },
          },
        });

        await tx.whatsAppBuyerLink.create({
          data: {
            phone,
            buyerId: user.id,
            isActive: true,
          },
        });

        // Delete the onboarding session
        await tx.onboardingSession.delete({
          where: { id: sessionId },
        });
      });

      // Send welcome with List Message
      const welcomeMsg =
        `You're all set, ${data.firstName}! 🎉\n\n` +
        `🔐 *SwiftTrade Identity*: Your account is linked to this phone number. ` +
        `You don't need a password to log in via WhatsApp.\n\n` +
        `You can now search for products, buy securely, and track deliveries right here. What would you like to do?`;

      await this.interactiveService.sendListMessage(
        phone,
        welcomeMsg,
        "Get Started",
        [
          {
            title: "Quick Actions",
            rows: [
              {
                id: "search_products",
                title: "Search Products",
                description: "Find what you need",
              },
              {
                id: "browse_categories",
                title: "Browse Categories",
                description: "Explore by category",
              },
              {
                id: "help",
                title: "Help",
                description: "Learn how SwiftTrade works",
              },
            ],
          },
        ],
      );

      this.logger.log(
        `Buyer account created via WhatsApp: ${this.maskIdentifier(data.email)}, phone: ${this.maskIdentifier(phone)}`,
      );
    } catch (error: any) {
      if (error.code === "P2002") {
        await this.prisma.onboardingSession.delete({
          where: { id: sessionId },
        });
        await this.interactiveService.sendTextMessage(
          phone,
          "This email or phone number is already registered to another account. Please use different details or visit swifta.store.",
        );
        return;
      }
      this.logger.error(
        `Failed to create buyer account for ${this.maskIdentifier(phone)}: ${error instanceof Error ? error.message : error}`,
      );
      await this.interactiveService.sendTextMessage(
        phone,
        "Something went wrong creating your account. Please try again or visit swifta.store to register.",
      );
    }
  }

  // =======================================================================
  // Merchant Flow
  // =======================================================================
  private async handleMerchantStep(
    phone: string,
    sessionId: string,
    step: OnboardingStep,
    data: Record<string, any>,
    messageText?: string,
    interactiveReply?: { type: string; id: string; title: string },
  ): Promise<void> {
    switch (step) {
      case OnboardingStep.MERCHANT_BUSINESS_NAME:
        await this.handleMerchantBusinessName(
          phone,
          sessionId,
          data,
          messageText,
        );
        break;
      case OnboardingStep.MERCHANT_NAME:
        await this.handleMerchantName(phone, sessionId, data, messageText);
        break;
      case OnboardingStep.MERCHANT_EMAIL:
        await this.handleMerchantEmail(phone, sessionId, data, messageText);
        break;
      case OnboardingStep.MERCHANT_OTP:
        await this.handleMerchantOtp(
          phone,
          sessionId,
          data,
          messageText,
          interactiveReply,
        );
        break;
      case OnboardingStep.MERCHANT_BANK_SELECT:
        await this.handleMerchantBankSelect(
          phone,
          sessionId,
          data,
          messageText,
          interactiveReply,
        );
        break;
      case OnboardingStep.MERCHANT_BANK_NAME:
        await this.handleMerchantBankName(phone, sessionId, data, messageText);
        break;
      case OnboardingStep.MERCHANT_ACCOUNT_NUMBER:
        await this.handleMerchantAccountNumber(
          phone,
          sessionId,
          data,
          messageText,
        );
        break;
      case OnboardingStep.MERCHANT_BANK_CONFIRM:
        await this.handleMerchantBankConfirm(
          phone,
          sessionId,
          data,
          messageText,
          interactiveReply,
        );
        break;
      default:
        await this.interactiveService.sendTextMessage(
          phone,
          "Something went wrong with your registration. Please try again.",
        );
        await this.prisma.onboardingSession.delete({
          where: { id: sessionId },
        });
        await this.sendWelcome(phone);
    }
  }

  private async handleMerchantBusinessName(
    phone: string,
    sessionId: string,
    data: Record<string, any>,
    messageText?: string,
  ): Promise<void> {
    if (!messageText || messageText.trim().length < 2) {
      await this.interactiveService.sendTextMessage(
        phone,
        "Please enter your business name (at least 2 characters).",
      );
      return;
    }

    await this.updateSession(sessionId, OnboardingStep.MERCHANT_NAME, {
      ...data,
      businessName: messageText.trim(),
    });

    await this.interactiveService.sendTextMessage(phone, "And your full name?");
  }

  private async handleMerchantName(
    phone: string,
    sessionId: string,
    data: Record<string, any>,
    messageText?: string,
  ): Promise<void> {
    if (!messageText || messageText.trim().length < 2) {
      await this.interactiveService.sendTextMessage(
        phone,
        "Please enter your full name (at least 2 characters).",
      );
      return;
    }

    const fullName = messageText.trim();
    const parts = fullName.split(" ");

    await this.updateSession(sessionId, OnboardingStep.MERCHANT_EMAIL, {
      ...data,
      firstName: parts[0],
      lastName: parts.slice(1).join(" ") || "",
    });

    await this.interactiveService.sendTextMessage(
      phone,
      `Thanks, ${parts[0]}! What's your email address? We'll send you a verification code.`,
    );
  }

  private async handleMerchantEmail(
    phone: string,
    sessionId: string,
    data: Record<string, any>,
    messageText?: string,
  ): Promise<void> {
    if (!messageText) {
      await this.interactiveService.sendTextMessage(
        phone,
        "Please enter your email address.",
      );
      return;
    }

    const email = messageText.toLowerCase().trim();
    if (!email.includes("@") || !email.includes(".")) {
      await this.interactiveService.sendTextMessage(
        phone,
        "That doesn't look like a valid email address. Please try again.",
      );
      return;
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      await this.interactiveService.sendTextMessage(
        phone,
        "This email is already registered. If you already have a SwiftTrade account, please visit swifta.store to link your WhatsApp number, or use a different email.",
      );
      return;
    }

    if (data.otpSentAt && Date.now() - data.otpSentAt < 60 * 1000) {
      await this.interactiveService.sendTextMessage(
        phone,
        "Please wait a minute before requesting another code.",
      );
      return;
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = crypto
      .createHmac("sha256", this.paystackSecretKey)
      .update(otp)
      .digest("hex");

    try {
      await this.emailService.sendVerificationOTP(email, otp);
    } catch (error) {
      this.logger.error(
        `Failed to send OTP to ${this.maskIdentifier(email)}: ${error instanceof Error ? error.message : error}`,
      );
      await this.interactiveService.sendTextMessage(
        phone,
        "I couldn't send the verification email right now. Please try again in a moment.",
      );
      return;
    }

    await this.updateSession(sessionId, OnboardingStep.MERCHANT_OTP, {
      ...data,
      email,
      otpHash,
      otpAttempts: 0,
      otpSentAt: Date.now(),
    });

    await this.interactiveService.sendReplyButtons(
      phone,
      `I've sent a 6-digit code to ${email}. Please reply with the code.`,
      [{ id: "resend_otp", title: "Resend Code" }],
    );
  }

  private async handleMerchantOtp(
    phone: string,
    sessionId: string,
    data: Record<string, any>,
    messageText?: string,
    interactiveReply?: { type: string; id: string; title: string },
  ): Promise<void> {
    if (interactiveReply?.id === "resend_otp") {
      await this.handleMerchantEmail(phone, sessionId, data, data.email);
      return;
    }

    if (!messageText) {
      await this.interactiveService.sendTextMessage(
        phone,
        "Please enter the 6-digit verification code sent to your email.",
      );
      return;
    }

    const otpInput = messageText.trim().replace(/\s/g, "");

    if (data.otpSentAt && Date.now() - data.otpSentAt > 10 * 60 * 1000) {
      await this.prisma.onboardingSession.delete({
        where: { id: sessionId },
      });
      await this.interactiveService.sendTextMessage(
        phone,
        "The verification code has expired. Please start again by sending any message.",
      );
      return;
    }

    const inputHash = crypto
      .createHmac("sha256", this.paystackSecretKey)
      .update(otpInput)
      .digest("hex");

    if (inputHash !== data.otpHash) {
      const attempts = (data.otpAttempts || 0) + 1;
      if (attempts >= 3) {
        await this.prisma.onboardingSession.delete({
          where: { id: sessionId },
        });
        await this.interactiveService.sendTextMessage(
          phone,
          "Too many incorrect attempts. Please visit swifta.store to register instead, or try again later.",
        );
        return;
      }

      await this.updateSession(sessionId, OnboardingStep.MERCHANT_OTP, {
        ...data,
        otpAttempts: attempts,
      });

      await this.interactiveService.sendTextMessage(
        phone,
        `That code doesn't match. You have ${3 - attempts} attempt(s) remaining. Please check your email and try again.`,
      );
      return;
    }

    // OTP verified — proceed to bank selection
    await this.updateSession(sessionId, OnboardingStep.MERCHANT_BANK_SELECT, {
      ...data,
      otpHash: undefined,
      otpAttempts: undefined,
    });

    await this.interactiveService.sendListMessage(
      phone,
      "Email verified! Now let's set up your payouts. Select your bank:",
      "Select Bank",
      [
        {
          title: "Popular Banks",
          rows: NIGERIAN_BANKS.map((bank) => ({
            id: `bank_${bank.code}`,
            title: bank.name,
            description: bank.description,
          })),
        },
      ],
    );
  }

  private async handleMerchantBankSelect(
    phone: string,
    sessionId: string,
    data: Record<string, any>,
    messageText?: string,
    interactiveReply?: { type: string; id: string; title: string },
  ): Promise<void> {
    let bankCode: string | undefined;
    let bankName: string | undefined;

    if (interactiveReply && interactiveReply.id.startsWith("bank_")) {
      const code = interactiveReply.id.replace("bank_", "");

      if (code === "other") {
        // User wants to type their bank name
        await this.updateSession(
          sessionId,
          OnboardingStep.MERCHANT_BANK_NAME,
          data,
        );
        await this.interactiveService.sendTextMessage(
          phone,
          "Please type the name of your bank.",
        );
        return;
      }

      bankCode = code;
      bankName = interactiveReply.title;
    } else if (messageText) {
      // Text fallback — try to match to a bank
      const match = NIGERIAN_BANKS.find(
        (b) =>
          b.name.toLowerCase().includes(messageText.toLowerCase()) ||
          messageText.toLowerCase().includes(b.name.toLowerCase()),
      );
      if (match) {
        bankCode = match.code;
        bankName = match.name;
      } else {
        // Unrecognized bank — ask to type name
        await this.updateSession(
          sessionId,
          OnboardingStep.MERCHANT_BANK_NAME,
          data,
        );
        await this.interactiveService.sendTextMessage(
          phone,
          "I didn't recognize that bank. Please type the full name of your bank.",
        );
        return;
      }
    }

    if (!bankCode || !bankName) {
      await this.interactiveService.sendListMessage(
        phone,
        "Please select your bank from the list:",
        "Select Bank",
        [
          {
            title: "Popular Banks",
            rows: NIGERIAN_BANKS.map((bank) => ({
              id: `bank_${bank.code}`,
              title: bank.name,
              description: bank.description,
            })),
          },
        ],
      );
      return;
    }

    await this.updateSession(
      sessionId,
      OnboardingStep.MERCHANT_ACCOUNT_NUMBER,
      {
        ...data,
        bankCode,
        bankName,
      },
    );

    await this.interactiveService.sendTextMessage(
      phone,
      "What's your 10-digit account number?",
    );
  }

  private async handleMerchantBankName(
    phone: string,
    sessionId: string,
    data: Record<string, any>,
    messageText?: string,
  ): Promise<void> {
    if (!messageText || messageText.trim().length < 2) {
      await this.interactiveService.sendTextMessage(
        phone,
        "Please type the name of your bank.",
      );
      return;
    }

    // Try to find bank in Paystack's list
    const bankInfo = await this.searchPaystackBank(messageText.trim());

    if (!bankInfo) {
      await this.interactiveService.sendTextMessage(
        phone,
        "I couldn't find that bank. Please check the spelling and try again, or select from the list.",
      );
      // Re-show the list
      await this.updateSession(
        sessionId,
        OnboardingStep.MERCHANT_BANK_SELECT,
        data,
      );
      await this.interactiveService.sendListMessage(
        phone,
        "Select your bank:",
        "Select Bank",
        [
          {
            title: "Popular Banks",
            rows: NIGERIAN_BANKS.map((bank) => ({
              id: `bank_${bank.code}`,
              title: bank.name,
              description: bank.description,
            })),
          },
        ],
      );
      return;
    }

    await this.updateSession(
      sessionId,
      OnboardingStep.MERCHANT_ACCOUNT_NUMBER,
      {
        ...data,
        bankCode: bankInfo.code,
        bankName: bankInfo.name,
      },
    );

    await this.interactiveService.sendTextMessage(
      phone,
      `Found: ${bankInfo.name}. What's your 10-digit account number?`,
    );
  }

  private async handleMerchantAccountNumber(
    phone: string,
    sessionId: string,
    data: Record<string, any>,
    messageText?: string,
  ): Promise<void> {
    if (!messageText) {
      await this.interactiveService.sendTextMessage(
        phone,
        "Please enter your 10-digit account number.",
      );
      return;
    }

    const accountNumber = messageText.trim().replace(/\s/g, "");

    if (!/^\d{10}$/.test(accountNumber)) {
      await this.interactiveService.sendTextMessage(
        phone,
        "That doesn't look like a valid 10-digit account number. Please try again.",
      );
      return;
    }

    // Resolve account via Paystack
    await this.interactiveService.sendTextMessage(
      phone,
      "Verifying your account details...",
    );

    const resolved = await this.resolvePaystackAccount(
      data.bankCode,
      accountNumber,
    );

    if (!resolved) {
      await this.interactiveService.sendTextMessage(
        phone,
        "I couldn't verify that account number. Please check the details and try again.",
      );
      return;
    }

    await this.updateSession(sessionId, OnboardingStep.MERCHANT_BANK_CONFIRM, {
      ...data,
      accountNumber,
      accountName: resolved.account_name,
    });

    await this.interactiveService.sendReplyButtons(
      phone,
      `I found this account:\n\n🏦 ${data.bankName}\n👤 ${resolved.account_name}\n\nIs this correct?`,
      [
        { id: "bank_confirm", title: "Yes, that's correct" },
        { id: "bank_retry", title: "No, try again" },
      ],
    );
  }

  private async handleMerchantBankConfirm(
    phone: string,
    sessionId: string,
    data: Record<string, any>,
    messageText?: string,
    interactiveReply?: { type: string; id: string; title: string },
  ): Promise<void> {
    let confirmed = false;

    if (interactiveReply) {
      confirmed = interactiveReply.id === "bank_confirm";
    } else if (messageText) {
      const lower = messageText.toLowerCase().trim();
      confirmed = lower === "yes" || lower === "correct" || lower === "confirm";
    }

    if (!confirmed) {
      // Go back to bank selection
      await this.updateSession(sessionId, OnboardingStep.MERCHANT_BANK_SELECT, {
        ...data,
        bankCode: undefined,
        bankName: undefined,
        accountNumber: undefined,
        accountName: undefined,
      });

      await this.interactiveService.sendListMessage(
        phone,
        "No problem. Let's try again. Select your bank:",
        "Select Bank",
        [
          {
            title: "Popular Banks",
            rows: NIGERIAN_BANKS.map((bank) => ({
              id: `bank_${bank.code}`,
              title: bank.name,
              description: bank.description,
            })),
          },
        ],
      );
      return;
    }

    // Confirmed — create merchant account
    await this.createMerchantAccount(phone, sessionId, data);
  }

  private async createMerchantAccount(
    phone: string,
    sessionId: string,
    data: Record<string, any>,
  ): Promise<void> {
    try {
      const randomPassword =
        Math.random().toString(36).slice(-12) +
        Math.random().toString(36).slice(-4);
      const passwordHash = await bcrypt.hash(randomPassword, 10);

      const formattedPhone = phone.startsWith("234") ? `+${phone}` : phone;

      await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: data.email,
            phone: formattedPhone,
            firstName: data.firstName,
            lastName: data.lastName || "",
            passwordHash,
            role: "MERCHANT",
            emailVerified: true,
            merchantProfile: {
              create: {
                businessName: data.businessName,
                bankCode: data.bankCode,
                bankAccountNumber: data.accountNumber,
                settlementAccountName: data.accountName,
                verificationTier: "BASIC",
              },
            },
          },
        });

        await tx.whatsAppLink.create({
          data: {
            phone,
            userId: user.id,
            isActive: true,
          },
        });

        await tx.onboardingSession.delete({
          where: { id: sessionId },
        });
      });

      // Send welcome with List Message
      const welcomeMsg =
        `Your merchant account is live, ${data.firstName}! 🎉\n\n` +
        `🔐 *Identity Notice*: Your merchant account is linked to this phone number. ` +
        `No password is needed for WhatsApp operations.\n\n` +
        `Business: ${data.businessName}\nPayouts to: ${data.bankName} — ${data.accountName}\n\n` +
        `What would you like to do first?`;

      await this.interactiveService.sendListMessage(
        phone,
        welcomeMsg,
        "Get Started",
        [
          {
            title: "Quick Actions",
            rows: [
              {
                id: "add_product",
                title: "Add a Product",
                description: "List your first product",
              },
              {
                id: "sales_summary",
                title: "Today's Sales",
                description: "Check your revenue",
              },
              {
                id: "my_orders",
                title: "My Orders",
                description: "View and manage orders",
              },
              {
                id: "show_menu",
                title: "Full Menu",
                description: "See all available commands",
              },
            ],
          },
        ],
      );

      this.logger.log(
        `Merchant account created via WhatsApp: ${this.maskIdentifier(data.email)}, business: ${this.maskIdentifier(data.businessName)}, phone: ${this.maskIdentifier(phone)}`,
      );
    } catch (error: any) {
      if (error.code === "P2002") {
        await this.prisma.onboardingSession.delete({
          where: { id: sessionId },
        });
        await this.interactiveService.sendTextMessage(
          phone,
          "This email or phone number is already registered to another account. Please use different details or visit swifta.store.",
        );
        return;
      }
      this.logger.error(
        `Failed to create merchant account for ${this.maskIdentifier(phone)}: ${error instanceof Error ? error.message : error}`,
      );
      await this.interactiveService.sendTextMessage(
        phone,
        "Something went wrong creating your account. Please try again or visit swifta.store to register.",
      );
    }
  }

  // =======================================================================
  // Paystack Helpers
  // =======================================================================
  private async resolvePaystackAccount(
    bankCode: string,
    accountNumber: string,
  ): Promise<{ account_name: string; account_number: string } | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(
        `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
        {
          headers: {
            Authorization: `Bearer ${this.paystackSecretKey}`,
          },
          signal: controller.signal as RequestInit["signal"],
        },
      );

      clearTimeout(timeout);

      if (!response.ok) {
        return null;
      }

      const result = await response.json();
      if (result.status && result.data) {
        return result.data;
      }
      return null;
    } catch (error) {
      clearTimeout(timeout);
      this.logger.error(
        `Paystack resolve error: ${error instanceof Error ? error.message : error}`,
      );
      return null;
    }
  }

  private async searchPaystackBank(
    bankName: string,
  ): Promise<{ code: string; name: string } | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch("https://api.paystack.co/bank", {
        headers: {
          Authorization: `Bearer ${this.paystackSecretKey}`,
        },
        signal: controller.signal as RequestInit["signal"],
      });

      clearTimeout(timeout);

      if (!response.ok) return null;

      const result = await response.json();
      if (!result.status || !result.data) return null;

      const lower = bankName.toLowerCase();
      const match = result.data.find(
        (bank: any) =>
          bank.name.toLowerCase().includes(lower) ||
          lower.includes(bank.name.toLowerCase()),
      );

      return match ? { code: match.code, name: match.name } : null;
    } catch (error) {
      clearTimeout(timeout);
      this.logger.error(
        `Paystack bank list error: ${error instanceof Error ? error.message : error}`,
      );
      return null;
    }
  }

  // =======================================================================
  // Session helpers
  // =======================================================================
  private async updateSession(
    sessionId: string,
    step: OnboardingStep,
    data: Record<string, any>,
  ): Promise<void> {
    await this.prisma.onboardingSession.update({
      where: { id: sessionId },
      data: {
        step,
        data: data as any,
        expiresAt: new Date(Date.now() + ONBOARDING_SESSION_TTL * 1000),
      },
    });
  }
}
