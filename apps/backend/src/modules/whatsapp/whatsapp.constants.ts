// ---------------------------------------------------------------------------
// WhatsApp Bot — Constants, templates & Gemini function declarations
// ---------------------------------------------------------------------------

/** Numbered menu shown to linked merchants */
export const MAIN_MENU = `Here's what I can help you with:

1️⃣ Sales Summary
2️⃣ Pending RFQs
3️⃣ Inventory Check
4️⃣ Respond to RFQ
5️⃣ Update Stock
6️⃣ My Products

Just type a number or tell me what you need!`;

/** First message for an unlinked phone */
export const WELCOME_MESSAGE = `Welcome to SwiftTrade! 🔗

To link your merchant account, please reply with your registered email address.`;

/** Sent after looking up the email */
export const LINK_OTP_SENT = (email: string) =>
  `I've sent a 6-digit verification code to ${email}. Please reply with the code.`;

/** Sent when linking succeeds */
export const LINK_SUCCESS = (merchantName: string) =>
  `You're all set, ${merchantName}! 🎉\n\n${MAIN_MENU}`;

/** Sent when the phone is already linked */
export const ALREADY_LINKED = `This phone number is already linked to a merchant account.`;

/** Errors */
export const EMAIL_NOT_FOUND = `I couldn't find a merchant account with that email. Please check and try again.`;
export const INVALID_OTP = `That code doesn't match. Please check your email and try again.`;
export const OTP_EXPIRED = `The verification code has expired. Please send your email again to get a new code.`;
export const GENERIC_ERROR = `Something went wrong on our end. Please try again or type *menu* to see your options.`;

// ---------------------------------------------------------------------------
// Session states for multi-step flows
// ---------------------------------------------------------------------------
export enum SessionState {
  AWAITING_EMAIL = 'AWAITING_EMAIL',
  AWAITING_OTP = 'AWAITING_OTP',
}

// ---------------------------------------------------------------------------
// Number-to-intent quick map (no AI call required)
// ---------------------------------------------------------------------------
export const NUMBER_INTENT_MAP: Record<string, string> = {
  '1': 'get_sales_summary',
  '2': 'get_pending_rfqs',
  '3': 'get_inventory',
  '4': 'respond_to_rfq',
  '5': 'update_stock',
  '6': 'get_products',
};

// ---------------------------------------------------------------------------
// Gemini system prompt
// ---------------------------------------------------------------------------
export const SYSTEM_PROMPT = `You are SwiftTrade Bot, a WhatsApp assistant for hardware merchants in Lagos, Nigeria.
Your job is to understand what the merchant wants and call the right function.
Merchants may write in English, Pidgin English, or a mix.
Examples: "how market today" = get_sales_summary, "wetin dey my store" = get_inventory, "I wan add 50 bags cement" = update_stock.
If you cannot determine the intent, return the show_menu function.
Always be friendly and use emojis sparingly.
Never make up data — only call functions to retrieve real data.`;

// ---------------------------------------------------------------------------
// Gemini function declarations (for function calling)
// ---------------------------------------------------------------------------
export const GEMINI_FUNCTION_DECLARATIONS = [
  {
    name: 'get_sales_summary',
    description: "Get merchant's sales/revenue summary for a time period",
    parameters: {
      type: 'object' as const,
      properties: {
        timeframe: {
          type: 'string',
          enum: ['today', 'this_week', 'this_month', 'all_time'],
          description: 'Time period for the summary. Defaults to today.',
        },
      },
    },
  },
  {
    name: 'get_pending_rfqs',
    description: 'Get list of open/pending RFQs (Request for Quotes) for the merchant',
    parameters: { type: 'object' as const, properties: {} },
  },
  {
    name: 'get_inventory',
    description: 'Get current stock levels for all products or a specific product',
    parameters: {
      type: 'object' as const,
      properties: {
        productName: {
          type: 'string',
          description: 'Optional: specific product name to check stock for',
        },
      },
    },
  },
  {
    name: 'respond_to_rfq',
    description: 'Submit a quote/price for an RFQ',
    parameters: {
      type: 'object' as const,
      properties: {
        rfqReference: {
          type: 'string',
          description: 'The RFQ ID or short reference (first 4 chars of UUID)',
        },
        unitPriceNaira: {
          type: 'number',
          description: 'Price per unit in Naira',
        },
        deliveryFeeNaira: {
          type: 'number',
          description: 'Delivery fee in Naira (optional)',
        },
      },
      required: ['rfqReference', 'unitPriceNaira'],
    },
  },
  {
    name: 'update_stock',
    description: 'Add or remove inventory stock for a product',
    parameters: {
      type: 'object' as const,
      properties: {
        productName: { type: 'string', description: 'Product name or partial name' },
        quantity: { type: 'number', description: 'Number of units to add or remove' },
        action: {
          type: 'string',
          enum: ['add', 'remove'],
          description: 'Whether to add or remove stock. Defaults to add.',
        },
      },
      required: ['productName', 'quantity'],
    },
  },
  {
    name: 'get_products',
    description: "List all merchant's products with stock levels",
    parameters: { type: 'object' as const, properties: {} },
  },
  {
    name: 'show_menu',
    description: 'Show the main menu of available commands',
    parameters: { type: 'object' as const, properties: {} },
  },
];

/** Meta Graph API version */
export const META_API_VERSION = 'v21.0';

/** Redis key prefix for WhatsApp sessions */
export const WA_SESSION_PREFIX = 'wa:session:';
/** Redis key prefix for WhatsApp OTPs */
export const WA_OTP_PREFIX = 'wa:otp:';

/** Session TTL in seconds (30 minutes) */
export const SESSION_TTL = 30 * 60;
/** OTP TTL in seconds (10 minutes) */
export const OTP_TTL = 10 * 60;

/** Redis key prefix for message dedup */
export const WA_MSG_DEDUP_PREFIX = 'wa:msg:';
/** Dedup TTL in seconds (5 minutes) */
export const MSG_DEDUP_TTL = 5 * 60;
