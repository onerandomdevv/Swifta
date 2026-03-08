// ---------------------------------------------------------------------------
// WhatsApp Bot — Constants, templates & Gemini function declarations
// ---------------------------------------------------------------------------

/** Professional English menu for linked merchants */
export const MAIN_MENU = `Manage your business efficiently right here on WhatsApp. Select an option from the menu or type your request naturally.`;

/** Supplier main menu */
export const SUPPLIER_MAIN_MENU = `Supplier Dashboard. Use the menu below to manage your wholesale operations.`;

/** Friendly fallback when AI can't determine intent */
export const FRIENDLY_FALLBACK = `I'm not quite sure I understood that. 😅 Here is what I can help you with today:`;

/** Main menu for buyers */
export const BUYER_MAIN_MENU = `Welcome to your SwiftTrade Buyer Assistant. Select an option from the menu to get started:`;

/** Friendly fallback for buyers */
export const BUYER_FRIENDLY_FALLBACK = `I didn't quite catch that. Try using the menu or ask me questions like:
• "I need 50 bags of cement in Lekki"
• "Where is my order?"
• "Show my purchase history"`;

/** Follow-up when stock update is incomplete */
export const STOCK_UPDATE_FOLLOWUP = `Understood. Which product would you like to update and by how much?

Example: "Add 50 bags of cement" or "Remove 10 iron rods"`;

/** Follow-up when RFQ response is incomplete */
export const RFQ_RESPOND_FOLLOWUP = `To provide a quote, please include:
• The RFQ reference (e.g. "a3f2")
• Your price per unit in Naira

Example: "Quote a3f2 at 8500 per bag"`;

/** First message for an unlinked phone */
export const WELCOME_MESSAGE = `Welcome to SwiftTrade, Nigeria's digital marketplace for building and hardware materials. How would you like to use our platform?`;

export const ROLE_SELECTED_MESSAGE = `Great! To link your account, please reply with your registered email address.`;

/** Sent after looking up the email */
export const LINK_OTP_SENT = (email: string) =>
  `I've sent a 6-digit verification code to ${email}. Please reply with the code.`;

/** Sent when linking succeeds */
export const LINK_SUCCESS = (merchantName: string, role: string) => {
  if (role === "BUYER") {
    return `You're all set, ${merchantName}! 🎉\n\nYou can now tell me what you want to buy, or say "track my order" if you have any active deliveries.`;
  } else if (role === "SUPPLIER") {
    return `You're all set, ${merchantName}! 🎉\n\n${SUPPLIER_MAIN_MENU}`;
  }
  return `You're all set, ${merchantName}! 🎉\n\n${MAIN_MENU}`;
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
  "2": "get_pending_rfqs",
  "3": "get_inventory",
  "4": "get_recent_orders",
  "5": "update_stock",
  "6": "get_products",
  "7": "update_product_price",
  "8": "get_verification_status",
  "9": "browse_wholesale",
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
- "how much did I sell today" → get_sales_summary (today)
- "what did I sell this week" → get_sales_summary (this_week)
- "my sales" → get_sales_summary (today)
- "anything for me today?" → get_sales_summary (today)
- "how business" → get_sales_summary (today)
- "market summary" → get_sales_summary (today)

RFQ queries:
- "any new order?" → get_pending_rfqs
- "is there a new order?" → get_pending_rfqs
- "check my rfq" → get_pending_rfqs
- "pending orders" → get_pending_rfqs
- "new request" → get_pending_rfqs
- "who is looking for products" → get_pending_rfqs

Inventory queries:
- "what is in my store" → get_inventory
- "check my stock" → get_inventory
- "I want to see inventory" → get_inventory
- "how much cement do I have" → get_inventory (productName: "cement")
- "my goods" → get_inventory
- "warehouse" → get_inventory

Stock updates:
- "add 50 bags cement" → update_stock (productName: "cement", quantity: 50, action: "add")
- "I just receive 100 iron rod" → update_stock (productName: "iron rod", quantity: 100, action: "add")
- "remove 20 bags cement" → update_stock (productName: "cement", quantity: 20, action: "remove")
- "50 blocks have been sold" → update_stock (productName: "blocks", quantity: 50, action: "remove")

Product queries:
- "my products" → get_products
- "what am I selling" → get_products
- "show me my listings" → get_products

RFQ responses:
- "quote a3f2 at 8500 per bag" → respond_to_rfq (rfqReference: "a3f2", unitPriceNaira: 8500)
- "price is 8500 and delivery is 15000" → respond_to_rfq (unitPriceNaira: 8500, deliveryFeeNaira: 15000)

Orders/Dispatch queries:
- "my orders" → get_recent_orders
- "dispatch ABC123" → dispatch_order (orderReference: "ABC123")
- "dispatch" → dispatch_order

Order tracking / Status updates:
- "update order ABC123 in transit, truck left Alaba" → update_order_tracking (orderReference: "ABC123", status: "IN_TRANSIT", note: "truck left Alaba")
- "order DEF456 is preparing" → update_order_tracking (orderReference: "DEF456", status: "PREPARING")
- "update ABC dispatched" → update_order_tracking (orderReference: "ABC", status: "DISPATCHED")

Verification queries:
- "verify" → get_verification_status
- "my verification" → get_verification_status
- "am I verified" → get_verification_status
- "verification status" → get_verification_status
- "check my verification" → get_verification_status

Price updates:
- "update cement price to 9000" → update_product_price (productName: "cement", priceNaira: 9000)
- "change price 8500" → update_product_price (priceNaira: 8500)

Wholesale / Stock Financing:
- "I need stock" → browse_wholesale
- "I want to buy from manufacturer" → browse_wholesale
- "find cement from supplier" → browse_wholesale (query: "cement")
- "wholesale catalogue" → browse_wholesale
- "buy stock a3f2 100 units" → buy_wholesale (productId: "a3f2", quantity: 100)
- "order 500 bags from supplier item a3f2" → buy_wholesale (productId: "a3f2", quantity: 500)

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
    name: "get_pending_rfqs",
    description:
      "Get open/pending RFQs for the merchant. Triggered by: 'any new order', 'pending orders', 'anybody wan buy', 'check rfq'",
    parameters: { type: "object" as const, properties: {} },
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
    name: "respond_to_rfq",
    description:
      "Submit a quote for an RFQ. Triggered by: 'quote a3f2 at 8500', 'give am price 8500'",
    parameters: {
      type: "object" as const,
      properties: {
        rfqReference: {
          type: "string",
          description: "RFQ ID or short reference",
        },
        unitPriceNaira: {
          type: "number",
          description: "Price per unit in Naira",
        },
        deliveryFeeNaira: {
          type: "number",
          description: "Delivery fee in Naira",
        },
      },
      required: ["unitPriceNaira"],
    },
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

/** Redis key prefix for WhatsApp sessions */
export const WA_SESSION_PREFIX = "wa:session:";
/** Redis key prefix for WhatsApp OTPs */
export const WA_OTP_PREFIX = "wa:otp:";

/** Session TTL in seconds (30 minutes) */
export const SESSION_TTL = 30 * 60;
/** OTP TTL in seconds (10 minutes) */
export const OTP_TTL = 10 * 60;

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
export const ONBOARDING_SESSION_TTL = 60 * 60;

/** Nigerian banks for List Message (using Paystack bank codes) */
export const NIGERIAN_BANKS = [
  { code: "058", name: "GTBank", description: "Guaranty Trust Bank" },
  { code: "044", name: "Access Bank", description: "Access Bank Plc" },
  { code: "011", name: "First Bank", description: "First Bank of Nigeria" },
  { code: "033", name: "UBA", description: "United Bank for Africa" },
  { code: "057", name: "Zenith Bank", description: "Zenith Bank Plc" },
  { code: "other", name: "Other Bank", description: "Type your bank name" },
];
