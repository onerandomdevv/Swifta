// ---------------------------------------------------------------------------
// WhatsApp Bot — Constants, templates & Gemini function declarations
// ---------------------------------------------------------------------------

/** Numbered menu shown to linked merchants */
export const MAIN_MENU = `Welcome back! 🤝 Here's what I fit help you with:

1️⃣ Sales Summary — "How market?"
2️⃣ Pending RFQs — "Any new order?"
3️⃣ Inventory Check — "Wetin dey my store?"
4️⃣ Respond to RFQ — "Quote [ref] at [price]"
5️⃣ Update Stock — "Add 50 bags cement"
6️⃣ My Products — "Wetin I dey sell?"

Just type a number or tell me wetin you need! 🤝`;

/** Friendly fallback when AI can't determine intent */
export const FRIENDLY_FALLBACK = `I no too understand that one o 😅 But no worry, here's what I fit help you with:

1️⃣ Sales Summary — "How market?"
2️⃣ Pending RFQs — "Any new order?"
3️⃣ Inventory Check — "Wetin dey my store?"
4️⃣ Respond to RFQ — "Quote [ref] at [price]"
5️⃣ Update Stock — "Add 50 bags cement"
6️⃣ My Products — "Wetin I dey sell?"

Just tell me wetin you need! 🤝`;

/** Follow-up when stock update is incomplete */
export const STOCK_UPDATE_FOLLOWUP = `No wahala! Which product you wan update? And how many?

For example: "add 50 bags cement" or "remove 10 iron rods"

Say *6* if you wan see your products first.`;

/** Follow-up when RFQ response is incomplete */
export const RFQ_RESPOND_FOLLOWUP = `To respond to an RFQ, I need:
• The RFQ reference (e.g. "a3f2")
• Your price per unit in Naira

Example: "quote a3f2 at 8500 per bag"

Reply *2* to see your pending RFQs first.`;

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
// Gemini system prompt — rich with Pidgin / Yoruba-English examples
// ---------------------------------------------------------------------------
export const SYSTEM_PROMPT = `You are SwiftTrade Bot, a friendly AI assistant for hardware merchants in Lagos, Nigeria.

YOUR JOB: Understand what the merchant wants and call the right function. That's it.

LANGUAGE: Merchants write in English, Pidgin English, Yoruba-English mix, or short slang. You must understand all of these. Examples:

Sales/Revenue queries:
- "how market" → get_sales_summary (today)
- "how market dey be naa" → get_sales_summary (today)
- "how much I sell today" → get_sales_summary (today)
- "wetin I sell this week" → get_sales_summary (this_week)
- "my sales" → get_sales_summary (today)
- "anything for me today?" → get_sales_summary (today)
- "how business" → get_sales_summary (today)
- "market summary" → get_sales_summary (today)

RFQ queries:
- "any new order?" → get_pending_rfqs
- "anybody wan buy?" → get_pending_rfqs
- "check my rfq" → get_pending_rfqs
- "pending orders" → get_pending_rfqs
- "new request" → get_pending_rfqs
- "who dey find goods" → get_pending_rfqs

Inventory queries:
- "wetin dey my store" → get_inventory
- "check my stock" → get_inventory
- "I want to see inventory" → get_inventory
- "how many cement I get" → get_inventory (productName: "cement")
- "my goods" → get_inventory
- "warehouse" → get_inventory

Stock updates:
- "add 50 bags cement" → update_stock (productName: "cement", quantity: 50, action: "add")
- "I just receive 100 iron rod" → update_stock (productName: "iron rod", quantity: 100, action: "add")
- "remove 20 bags cement" → update_stock (productName: "cement", quantity: 20, action: "remove")
- "50 blocks don sell" → update_stock (productName: "blocks", quantity: 50, action: "remove")

Product queries:
- "my products" → get_products
- "wetin I dey sell" → get_products
- "show me my listings" → get_products

RFQ responses:
- "quote a3f2 at 8500 per bag" → respond_to_rfq (rfqReference: "a3f2", unitPriceNaira: 8500)
- "give am price 8500 delivery 15000" → respond_to_rfq (unitPriceNaira: 8500, deliveryFeeNaira: 15000)

Greetings (show menu):
- "hi", "hello", "hey", "good morning", "menu", "help" → show_menu

RULES:
- If you understand what they want, call the function. DO NOT show the menu.
- If you partially understand (e.g., they want to update stock but didn't say which product), still call the function with whatever params you have.
- Only show the menu if you truly cannot determine their intent.
- Never say "I don't understand" — always try your best to match an intent.`;

// ---------------------------------------------------------------------------
// Gemini function declarations (for function calling)
// ---------------------------------------------------------------------------
export const GEMINI_FUNCTION_DECLARATIONS = [
  {
    name: 'get_sales_summary',
    description: "Get merchant sales/revenue summary. Triggered by: 'how market', 'my sales', 'how much I sell', 'how business'",
    parameters: {
      type: 'object' as const,
      properties: {
        timeframe: {
          type: 'string',
          enum: ['today', 'this_week', 'this_month', 'all_time'],
          description: 'Time period for summary. Default: today',
        },
      },
    },
  },
  {
    name: 'get_pending_rfqs',
    description: "Get open/pending RFQs for the merchant. Triggered by: 'any new order', 'pending orders', 'anybody wan buy', 'check rfq'",
    parameters: { type: 'object' as const, properties: {} },
  },
  {
    name: 'get_inventory',
    description: "Get stock levels for all or specific product. Triggered by: 'check my stock', 'wetin dey my store', 'inventory', 'my goods'",
    parameters: {
      type: 'object' as const,
      properties: {
        productName: {
          type: 'string',
          description: 'Optional specific product to check',
        },
      },
    },
  },
  {
    name: 'update_stock',
    description: "Add or remove inventory stock. Triggered by: 'add 50 bags cement', 'remove 10 rods', 'I just receive 100 iron', 'restock'",
    parameters: {
      type: 'object' as const,
      properties: {
        productName: { type: 'string', description: 'Product name' },
        quantity: { type: 'number', description: 'Quantity to add or remove' },
        action: {
          type: 'string',
          enum: ['add', 'remove'],
          description: 'Whether to add or remove stock',
        },
      },
      required: ['productName', 'quantity', 'action'],
    },
  },
  {
    name: 'get_products',
    description: "List all merchant products. Triggered by: 'my products', 'wetin I dey sell', 'show listings'",
    parameters: { type: 'object' as const, properties: {} },
  },
  {
    name: 'respond_to_rfq',
    description: "Submit a quote for an RFQ. Triggered by: 'quote a3f2 at 8500', 'give am price 8500'",
    parameters: {
      type: 'object' as const,
      properties: {
        rfqReference: { type: 'string', description: 'RFQ ID or short reference' },
        unitPriceNaira: { type: 'number', description: 'Price per unit in Naira' },
        deliveryFeeNaira: { type: 'number', description: 'Delivery fee in Naira' },
      },
      required: ['unitPriceNaira'],
    },
  },
  {
    name: 'show_menu',
    description: 'Show the main menu ONLY when intent is truly unclear or user explicitly asks for help/menu',
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
