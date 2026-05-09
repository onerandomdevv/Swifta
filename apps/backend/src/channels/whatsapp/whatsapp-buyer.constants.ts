// ---------------------------------------------------------------------------
// WhatsApp Buyer Bot — Constants, templates & Gemini declarations
// ---------------------------------------------------------------------------
export const BUYER_MAIN_MENU = `Welcome to the twizrr Marketplace! ✅

I'm your personal shopping assistant. I can help you find products, discover local merchants, and track your deliveries in real-time.

How can I assist you today?`;

export const BUYER_FRIENDLY_FALLBACK = `I'm sorry, I didn't quite catch that. 📦

I can help you find products, discover merchants, track orders, or connect with support.

What would you like to do?`;

export const BUYER_NUMBER_INTENT_MAP: Record<string, string> = {
  "1": "search_products",
  "2": "search_merchants",
  "3": "get_active_orders",
  "4": "confirm_delivery",
  "5": "get_order_history",
  "6": "contact_support",
};

// ---------------------------------------------------------------------------
// Gemini buyer system prompt is now managed via .env (WHATSAPP_BUYER_SYSTEM_PROMPT)
// ---------------------------------------------------------------------------

export const BUYER_GEMINI_FUNCTION_DECLARATIONS = [
  {
    name: "search_products",
    description:
      "Search the global twizrr catalogue for a product based on name and optionally location.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "The name of the item they want to buy (e.g. 'phone', 'shoes', 'groceries')",
        },
        location: {
          type: "string",
          description:
            "The specific location they want to buy it in (e.g. 'Lekki', 'Ikeja', 'Abuja')",
        },
        quantity: {
          type: "number",
          description: "How many items they want to buy",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "search_merchants",
    description:
      "Search for verified merchants and shops on twizrr by name or specific location.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "The name of the shop or type of merchant (e.g. 'Aliko Store', 'Electronics shops')",
        },
        location: {
          type: "string",
          description:
            "The location to search in (e.g. 'Lekki', 'Victoria Island')",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "buy_product",
    description:
      "Initialize an order checkout process to purchase a specific product ID.",
    parameters: {
      type: "object",
      properties: {
        productId: {
          type: "string",
          description: "The system ID of the product",
        },
        quantity: {
          type: "number",
          description: "How many units they want to buy",
        },
      },
      required: ["productId"],
    },
  },
  {
    name: "get_active_orders",
    description: "Get order status for active or pending deliveries.",
  },
  {
    name: "get_order_history",
    description: "List completed or cancelled past orders.",
  },
  {
    name: "confirm_delivery",
    description:
      "Confirm receipt of an order. Only extracts the reference if explicitly provided.",
    parameters: {
      type: "object",
      properties: {
        orderReference: {
          type: "string",
          description:
            "The order ID or reference string explicitly mentioned by the user.",
        },
      },
    },
  },
  {
    name: "browse_categories",
    description:
      "Browse the available product categories in the twizrr marketplace.",
  },
  {
    name: "list_merchant_products",
    description:
      "List all products available from a specific merchant by their @handle or name.",
    parameters: {
      type: "object",
      properties: {
        merchantSlug: {
          type: "string",
          description:
            "The merchant's @handle or slug (e.g. '@kareem' or 'kareem')",
        },
        query: {
          type: "string",
          description:
            "Optional product name to filter within that merchant's shop",
        },
      },
      required: ["merchantSlug"],
    },
  },
];
