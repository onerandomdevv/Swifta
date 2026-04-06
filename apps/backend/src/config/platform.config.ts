import { Logger } from "@nestjs/common";

const logger = new Logger("PlatformConfig");

const parseEnvInt = (key: string, defaultValue: number): number => {
  const val = process.env[key];
  if (!val) return defaultValue;
  const parsed = parseInt(val, 10);
  if (isNaN(parsed) || parsed <= 0) {
    logger.warn(
      `Invalid value for ${key}: "${val}". Falling back to ${defaultValue}`,
    );
    return defaultValue;
  }
  return parsed;
};

// 1. Parse base timers
const autoConfirmationHours = parseEnvInt("AUTO_CONFIRMATION_HOURS", 72);
const defaultFirst = Math.floor(autoConfirmationHours / 3);
const defaultFinal = Math.floor((autoConfirmationHours * 2) / 3);

let autoConfirmReminderFirstHours = parseEnvInt(
  "AUTO_CONFIRM_REMINDER_FIRST_HOURS",
  defaultFirst,
);
let autoConfirmReminderFinalHours = parseEnvInt(
  "AUTO_CONFIRM_REMINDER_FINAL_HOURS",
  defaultFinal,
);
const autoConfirmDisputeWindowHours = parseEnvInt(
  "AUTO_CONFIRM_DISPUTE_WINDOW_HOURS",
  48,
);

// 2. Validate Invariants
// Ensure reminders are sequential and within the window
if (autoConfirmReminderFirstHours >= autoConfirmReminderFinalHours) {
  logger.warn(
    `Configuration error: First reminder (${autoConfirmReminderFirstHours}h) must be less than final reminder (${autoConfirmReminderFinalHours}h). Clamping first reminder.`,
  );
  autoConfirmReminderFirstHours = Math.floor(autoConfirmReminderFinalHours / 2);
}

if (autoConfirmReminderFinalHours >= autoConfirmationHours) {
  logger.warn(
    `Configuration error: Final reminder (${autoConfirmReminderFinalHours}h) must be less than auto-confirmation window (${autoConfirmationHours}h). Clamping reminders.`,
  );
  autoConfirmReminderFinalHours = Math.floor((autoConfirmationHours * 2) / 3);
  autoConfirmReminderFirstHours = Math.floor(autoConfirmationHours / 3);
}

// Ensure dispute window is logically sound
if (autoConfirmDisputeWindowHours > autoConfirmationHours) {
  logger.warn(
    `Configuration error: Dispute window (${autoConfirmDisputeWindowHours}h) is unusually long compared to auto-confirm (${autoConfirmationHours}h).`,
  );
}

export const PlatformConfig = {
  fees: {
    escrowPercent: parseFloat(process.env.PLATFORM_FEE_ESCROW || "2"),
    directTier2Percent: parseFloat(
      process.env.PLATFORM_FEE_DIRECT_TIER2 || "1.5",
    ),
    directTier3Percent: parseFloat(
      process.env.PLATFORM_FEE_DIRECT_TIER3 || "1",
    ),
    tradeFinancingCommission: parseFloat(
      process.env.TRADE_FINANCING_COMMISSION_PERCENTAGE || "3",
    ),
  },
  timers: {
    autoConfirmationHours,
    autoConfirmReminderFirstHours,
    autoConfirmReminderFinalHours,
    autoConfirmDisputeWindowHours,
    escrowWindowHours: parseEnvInt("ESCROW_WINDOW_HOURS", 24),
    otpExpiryEmailMinutes: parseEnvInt("OTP_EXPIRY_EMAIL_MINUTES", 10),
    otpExpiryAuthMinutes: parseEnvInt("OTP_EXPIRY_AUTH_MINUTES", 15),
    otpExpiryWhatsappMinutes: parseEnvInt("OTP_EXPIRY_WHATSAPP_MINUTES", 5),
    onboardingSessionTtl: parseEnvInt("ONBOARDING_SESSION_TTL_SECONDS", 3600),
  },
  getPlatformFeePercent(tier: string, paymentMethod: string): number {
    if (paymentMethod === "DIRECT") {
      switch (tier) {
        case "TIER_3":
          return this.fees.directTier3Percent;
        case "TIER_2":
          return this.fees.directTier2Percent;
        default:
          return this.fees.escrowPercent;
      }
    }
    return this.fees.escrowPercent;
  },
  calculateFeeKobo(
    subtotalKobo: bigint,
    tier: string,
    paymentMethod: string,
  ): bigint {
    const percent = this.getPlatformFeePercent(tier, paymentMethod);
    // Convert percentage to basis points (e.g., 1.5% -> 150 basis points)
    // 1.5% = 1.5 / 100 = 150 / 10000
    const basisPoints = BigInt(Math.round(percent * 100));
    return (subtotalKobo * basisPoints) / 10000n;
  },
};
