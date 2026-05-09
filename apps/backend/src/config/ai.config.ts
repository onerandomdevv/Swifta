import { registerAs } from "@nestjs/config";

export default registerAs("ai", () => ({
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  geminiVisionModel: process.env.GEMINI_VISION_MODEL || "gemini-1.5-flash",
  googleCloudApiKey: process.env.GOOGLE_CLOUD_API_KEY,
}));
