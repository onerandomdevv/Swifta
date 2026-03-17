import { registerAs } from "@nestjs/config";

export default registerAs("whatsapp", () => ({
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
  verifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
  appSecret: process.env.WHATSAPP_APP_SECRET,
  welcomeMessage: process.env.WHATSAPP_WELCOME_MESSAGE,
  merchantSystemPrompt: process.env.WHATSAPP_MERCHANT_SYSTEM_PROMPT,
  buyerSystemPrompt: process.env.WHATSAPP_BUYER_SYSTEM_PROMPT,
  supplierSystemPrompt: process.env.WHATSAPP_SUPPLIER_SYSTEM_PROMPT,
}));
