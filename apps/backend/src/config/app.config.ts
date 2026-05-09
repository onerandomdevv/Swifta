import { registerAs } from "@nestjs/config";

export default registerAs("app", () => ({
  port: parseInt(process.env.PORT || "4000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  // SECURITY: Set ONBOARDING_OTP_SECRET to an independent value in production.
  // Reusing JWT_ACCESS_SECRET is a fallback for development/migration only.
  onboardingOtpSecret:
    process.env.ONBOARDING_OTP_SECRET ||
    (process.env.NODE_ENV === "production"
      ? undefined
      : process.env.JWT_ACCESS_SECRET),
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",")
    : ["http://localhost:3000"],
}));
