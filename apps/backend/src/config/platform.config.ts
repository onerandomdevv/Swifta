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
    // 168h = 7 days, 72h = 3 days (default)
    autoConfirmationHours: parseInt(
      process.env.AUTO_CONFIRMATION_HOURS || "72",
    ),
    // Reminder hours (relative to DISPATCHED timestamp).
    // They default to 1/3 and 2/3 of the window if not provided.
    autoConfirmReminderFirstHours: parseInt(
      process.env.AUTO_CONFIRM_REMINDER_FIRST_HOURS ||
        Math.floor(
          parseInt(process.env.AUTO_CONFIRMATION_HOURS || "72") / 3,
        ).toString(),
    ),
    autoConfirmReminderFinalHours: parseInt(
      process.env.AUTO_CONFIRM_REMINDER_FINAL_HOURS ||
        Math.floor(
          (parseInt(process.env.AUTO_CONFIRMATION_HOURS || "72") * 2) / 3,
        ).toString(),
    ),
    autoConfirmDisputeWindowHours: parseInt(
      process.env.AUTO_CONFIRM_DISPUTE_WINDOW_HOURS || "48",
    ),
    escrowWindowHours: parseInt(process.env.ESCROW_WINDOW_HOURS || "24"),
    otpExpiryEmailMinutes: parseInt(
      process.env.OTP_EXPIRY_EMAIL_MINUTES || "10",
    ),
    otpExpiryAuthMinutes: parseInt(process.env.OTP_EXPIRY_AUTH_MINUTES || "15"),
    otpExpiryWhatsappMinutes: parseInt(
      process.env.OTP_EXPIRY_WHATSAPP_MINUTES || "5",
    ),
    onboardingSessionTtl: parseInt(
      process.env.ONBOARDING_SESSION_TTL_SECONDS || "3600",
    ),
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
