// WhatsApp Bot — Constants, templates & Gemini function declarations
// ---------------------------------------------------------------------------
import { PlatformConfig } from "../../config/platform.config";

/** Professional English menu for linked merchants */
export const MAIN_MENU = `Manage your business efficiently on WhatsApp. Select an option from the menu or state your request.`;

/** Supplier main menu */
export const SUPPLIER_MAIN_MENU = `Supplier Dashboard. Use the menu below to manage your wholesale operations.`;

/** Friendly fallback when AI can't determine intent */
export const FRIENDLY_FALLBACK = `I did not understand that. Select an option from the menu:`;

/** Main menu for buyers */
export const BUYER_MAIN_MENU = `Welcome to the Swifta Buyer Assistant. Select an option to proceed.`;

/** Friendly fallback for buyers */
export const BUYER_FRIENDLY_FALLBACK = `I did not understand that. You can ask:
• "I need 50 bags of cement in Lekki"
• "Where is my order?"
• "Show my purchase history"`;

/** Follow-up when stock update is incomplete */
export const STOCK_UPDATE_FOLLOWUP = `Understood. Which product would you like to update and by how much?

Example: "Add 50 bags of cement" or "Remove 10 iron rods"`;

/** First message for an unlinked phone */
export const WELCOME_MESSAGE =
  process.env.WHATSAPP_WELCOME_MESSAGE ||
  `Welcome to Swifta. Nigeria's digital marketplace for retail and wholesale needs. How would you like to use our platform?`;

export const ROLE_SELECTED_MESSAGE = `To link your account, please reply with your registered email address.`;

/** Sent after looking up the email */
export const LINK_OTP_SENT = (email: string) =>
  `I've sent a 6-digit verification code to ${email}. Please reply with the code.`;

/** Sent when linking succeeds */
export const LINK_SUCCESS = (merchantName: string, role: string) => {
  if (role === "BUYER") {
    return `Account linked. ✅\n\nYou can search for products or track active deliveries.`;
  } else if (role === "SUPPLIER") {
    return `Account linked. ✅\n\n${SUPPLIER_MAIN_MENU}`;
  }
  return `Account linked. ✅\n\n${MAIN_MENU}`;
};

/** Sent when the phone is already linked */
export const ALREADY_LINKED = `This phone number is already linked to a merchant account.`;

/** Errors */
export const EMAIL_NOT_FOUND = `We couldn't find an account associated with that email. Please check the spelling and try again.`;
export const INVALID_OTP = `The code you entered is incorrect. Please check your email and try again.`;
export const OTP_EXPIRED = `Your verification code has expired. Please provide your email again to receive a new one.`;
export const GENERIC_ERROR = `We encountered a problem while processing your request. Please try again or type "menu" to see available options.`;

// ---------------------------------------------------------------------------
// Session states for multi-step flows
// ---------------------------------------------------------------------------
export enum SessionState {
  AWAITING_ROLE = "AWAITING_ROLE",
  AWAITING_EMAIL = "AWAITING_EMAIL",
  AWAITING_OTP = "AWAITING_OTP",
}

// ---------------------------------------------------------------------------
// Number-to-intent quick map (no AI call required)
// ---------------------------------------------------------------------------
export const NUMBER_INTENT_MAP: Record<string, string> = {
  "1": "get_sales_summary",
  "3": "get_inventory",
  "4": "get_recent_orders",
  "5": "update_stock",
  "6": "get_products",
  "7": "update_product_price",
  "8": "get_verification_status",
  "9": "browse_wholesale",
};

// ---------------------------------------------------------------------------
// Gemini system prompt is now managed via .env (WHATSAPP_MERCHANT_SYSTEM_PROMPT)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Gemini function declarations (for function calling)
// ---------------------------------------------------------------------------
export const GEMINI_FUNCTION_DECLARATIONS = [
  {
    name: "get_sales_summary",
    description:
      "Get merchant sales/revenue summary. Triggered by: 'how market', 'my sales', 'how much I sell', 'how business'",
    parameters: {
      type: "object" as const,
      properties: {
        timeframe: {
          type: "string",
          enum: ["today", "this_week", "this_month", "all_time"],
          description: "Time period for summary. Default: today",
        },
      },
    },
  },
  {
    name: "get_inventory",
    description:
      "Get stock levels for all or specific product. Triggered by: 'check my stock', 'wetin dey my store', 'inventory', 'my goods'",
    parameters: {
      type: "object" as const,
      properties: {
        productName: {
          type: "string",
          description: "Optional specific product to check",
        },
      },
    },
  },
  {
    name: "update_stock",
    description:
      "Add or remove inventory stock. Triggered by: 'add 50 bags cement', 'remove 10 rods', 'I just receive 100 iron', 'restock'",
    parameters: {
      type: "object" as const,
      properties: {
        productName: { type: "string", description: "Product name" },
        quantity: { type: "number", description: "Quantity to add or remove" },
        action: {
          type: "string",
          enum: ["add", "remove"],
          description: "Whether to add or remove stock",
        },
      },
      required: ["productName", "quantity", "action"],
    },
  },
  {
    name: "get_products",
    description:
      "List all merchant products. Triggered by: 'my products', 'wetin I dey sell', 'show listings'",
    parameters: { type: "object" as const, properties: {} },
  },
  {
    name: "show_menu",
    description:
      "Show the main menu ONLY when intent is truly unclear or user explicitly asks for help/menu",
    parameters: { type: "object" as const, properties: {} },
  },
  {
    name: "get_recent_orders",
    description:
      "Get recent orders for the merchant. Triggered by: 'my orders', 'show my orders', 'recent orders'",
    parameters: { type: "object" as const, properties: {} },
  },
  {
    name: "dispatch_order",
    description:
      "Dispatch an order. Triggered by: 'dispatch ABC123', 'dispatch'",
    parameters: {
      type: "object" as const,
      properties: {
        orderReference: {
          type: "string",
          description: "Order ID or short reference to dispatch",
        },
      },
      required: ["orderReference"],
    },
  },
  {
    name: "update_order_tracking",
    description:
      "Update the delivery tracking status of an order. Triggered by: 'update order ABC123 in transit', 'order PREPARING', 'update dispatched'",
    parameters: {
      type: "object" as const,
      properties: {
        orderReference: {
          type: "string",
          description: "Order ID or short reference",
        },
        status: {
          type: "string",
          enum: ["PREPARING", "DISPATCHED", "IN_TRANSIT"],
          description: "The new tracking status",
        },
        note: {
          type: "string",
          description:
            "Optional note or comment provided by merchant, e.g., 'truck left Alaba at 2pm'",
        },
      },
      required: ["orderReference", "status"],
    },
  },
  {
    name: "update_product_price",
    description:
      "Update the price of a product. Triggered by: 'update cement price to 9000', 'change price 8500'",
    parameters: {
      type: "object" as const,
      properties: {
        productName: { type: "string", description: "Product name to update" },
        priceNaira: {
          type: "number",
          description: "New price per unit in Naira",
        },
      },
      required: ["productName", "priceNaira"],
    },
  },
  {
    name: "get_verification_status",
    description:
      "Get the merchant's current verification tier and status. Triggered by: 'verify', 'my verification', 'am I verified', 'verification status'",
    parameters: { type: "object" as const, properties: {} },
  },
  {
    name: "browse_wholesale",
    description:
      "Browse the manufacturer/supplier catalogue for stock. Triggered by: 'I need stock', 'manufacturer catalogue', 'wholesale'",
    parameters: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "Optional product name to search for",
        },
      },
    },
  },
  {
    name: "buy_wholesale",
    description:
      "Purchase stock from a manufacturer. Triggered by: 'buy stock ABC 50 units'",
    parameters: {
      type: "object" as const,
      properties: {
        productId: {
          type: "string",
          description: "The short ID of the manufacturer product",
        },
        quantity: {
          type: "number",
          description: "How many units to buy",
        },
      },
      required: ["productId"],
    },
  },
];

/** Meta Graph API version */
export const META_API_VERSION = "v21.0";

/** WhatsApp Auth/OTP Template Name (configured in Meta Business Suite) */
export const WHATSAPP_OTP_TEMPLATE = "auth_otp";

/** Redis key prefix for WhatsApp sessions */
export const WA_SESSION_PREFIX = "wa:session:";
/** Redis key prefix for WhatsApp OTPs */
export const WA_OTP_PREFIX = "wa:otp:";

/** Session TTL in seconds (30 minutes) */
export const SESSION_TTL = 30 * 60;
/** OTP TTL in seconds (10 minutes) */
export const OTP_TTL = PlatformConfig.timers.otpExpiryWhatsappMinutes * 60; // Use WhatsApp expiry from config

/** Redis key prefix for message dedup */
export const WA_MSG_DEDUP_PREFIX = "wa:msg:";
/** Dedup TTL in seconds (5 minutes) */
export const MSG_DEDUP_TTL = 5 * 60;

// ---------------------------------------------------------------------------
// V5 Onboarding — Step enum and constants
// ---------------------------------------------------------------------------
export enum OnboardingStep {
  BUYER_TYPE = "BUYER_TYPE",
  BUYER_BUSINESS_NAME = "BUYER_BUSINESS_NAME",
  BUYER_NAME = "BUYER_NAME",
  BUYER_EMAIL = "BUYER_EMAIL",
  BUYER_OTP = "BUYER_OTP",
  MERCHANT_BUSINESS_NAME = "MERCHANT_BUSINESS_NAME",
  MERCHANT_NAME = "MERCHANT_NAME",
  MERCHANT_EMAIL = "MERCHANT_EMAIL",
  MERCHANT_OTP = "MERCHANT_OTP",
  MERCHANT_BANK_SELECT = "MERCHANT_BANK_SELECT",
  MERCHANT_BANK_NAME = "MERCHANT_BANK_NAME",
  MERCHANT_ACCOUNT_NUMBER = "MERCHANT_ACCOUNT_NUMBER",
  MERCHANT_BANK_CONFIRM = "MERCHANT_BANK_CONFIRM",
}

/** Onboarding session TTL in seconds (1 hour) */
export const ONBOARDING_SESSION_TTL =
  PlatformConfig.timers.onboardingSessionTtl;

/** Nigerian banks for List Message (using Paystack bank codes) */
export const NIGERIAN_BANKS = [
  { code: "058", name: "GTBank", description: "Guaranty Trust Bank" },
  { code: "044", name: "Access Bank", description: "Access Bank Plc" },
  { code: "011", name: "First Bank", description: "First Bank of Nigeria" },
  { code: "033", name: "UBA", description: "United Bank for Africa" },
  { code: "057", name: "Zenith Bank", description: "Zenith Bank Plc" },
  { code: "other", name: "Other Bank", description: "Type your bank name" },
];

export enum ProductCreationStep {
  NAME = "NAME",
  CATEGORY = "CATEGORY",
  ATTRIBUTES = "ATTRIBUTES",
  UNIT = "UNIT",
  WHOLESALE_PRICE = "WHOLESALE_PRICE",
  RETAIL_PRICE = "RETAIL_PRICE",
  IMAGE = "IMAGE",
  CONFIRMATION = "CONFIRMATION",
}

/** Product creation session TTL (30 minutes) */
export const PRODUCT_CREATION_SESSION_TTL = 30 * 60;
