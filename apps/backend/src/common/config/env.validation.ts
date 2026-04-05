import * as Joi from "joi";

export const envValidationSchema = Joi.object({
  // Infrastructure
  NODE_ENV: Joi.string()
    .valid("development", "production", "test", "provision")
    .default("development"),
  PORT: Joi.number().default(4000),
  DATABASE_URL: Joi.string().required(),
  REDIS_URL: Joi.string().required(),

  // Security & Auth
  JWT_ACCESS_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),

  // Payments (Paystack)
  PAYSTACK_SECRET_KEY: Joi.string().required(),
  PAYSTACK_PUBLIC_KEY: Joi.string().required(),
  PAYSTACK_WEBHOOK_SECRET: Joi.string().required(),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: Joi.string().required(),
  CLOUDINARY_API_KEY: Joi.string().required(),
  CLOUDINARY_API_SECRET: Joi.string().required(),

  // Email (Resend)
  RESEND_API_KEY: Joi.string().required(),
  EMAIL_FROM: Joi.string().email().default("no-reply@twizrr.com"),

  // Africa's Talking (SMS/USSD)
  AT_USERNAME: Joi.string().required(),
  AT_API_KEY: Joi.string().required(),
  AT_SENDER_ID: Joi.string().default("Twizrr"),

  // AI & Vision
  GOOGLE_CLOUD_API_KEY: Joi.string().required(),
  GEMINI_API_KEY: Joi.string().required(),

  // WhatsApp
  WHATSAPP_BOT_NUMBER: Joi.string().required(),
  WHATSAPP_PHONE_NUMBER_ID: Joi.string().required(),
  WHATSAPP_ACCESS_TOKEN: Joi.string().required(),
  WHATSAPP_VERIFY_TOKEN: Joi.string().required(),
  WHATSAPP_APP_SECRET: Joi.string().required(),

  // Misc
  WAITLIST_NOTIFY_EMAIL: Joi.string().email().optional(),
  ADMIN_BOOTSTRAP_EMAIL: Joi.string().email().default("admin@twizrr.com"),
  ADMIN_BOOTSTRAP_PASSWORD: Joi.string().required(),
});
