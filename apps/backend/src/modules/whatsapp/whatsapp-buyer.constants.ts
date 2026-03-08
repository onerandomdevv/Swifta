// ---------------------------------------------------------------------------
// WhatsApp Buyer Bot — Constants, templates & Gemini declarations
// ---------------------------------------------------------------------------
import { SchemaType, FunctionDeclaration } from "@google/generative-ai";

export const BUYER_MAIN_MENU = `Welcome back! 🛒 How can I assist you today? Select an option from the menu:`;

export const BUYER_FRIENDLY_FALLBACK = `I'm not exactly sure what you need. 😅 But don't worry, I can help you with searching for products, tracking active orders, or contacting support.

Tell me what you're looking for!`;

export const BUYER_NUMBER_INTENT_MAP: Record<string, string> = {
  "1": "search_products",
  "2": "get_active_orders",
  "3": "confirm_delivery",
  "4": "get_order_history",
  "5": "contact_support",
};

export const BUYER_SYSTEM_PROMPT = `You are SwiftTrade Buyer Bot, a professional shopping assistant for retail and wholesale buyers in Nigeria, covering all product categories (electronics, fashion, hardware, groceries, etc.).

YOUR MISSION: Understand the buyer's needs and trigger the correct function to assist them.

LANGUAGE: Buyers communicate in English or mixed language (Pidgin/Yoruba-English). You must interpret their intent accurately.

Product Search:
- "I need a Samsung Galaxy S23 in Lekki" → search_products (query: "Samsung Galaxy S23", location: "Lekki")
- "Where can I get iron rods in Ikeja?" → search_products (query: "iron rod", location: "Ikeja")
- "I want to buy men's corporate shoes" → search_products (query: "men's corporate shoes")
- "price of bags of rice" → search_products (query: "bags of rice")

Orders & Tracking:
- "where is my order" → get_active_orders
- "my orders" → get_active_orders
- "track my delivery" → get_active_orders
- "show my past purchases" → get_order_history

Delivery Confirmation:
- "confirm delivery for ABC123" → confirm_delivery (orderReference: "ABC123")
- "I have received my order ABC" → confirm_delivery (orderReference: "ABC")

Purchasing:
- "buy product DEF456 50 bags" → buy_product (productId: "DEF456", quantity: 50)
- "I want to buy 100 units of item X" → buy_product (productId: "X", quantity: 100)

RULES:
- Always call the matched tool. Do not simply show the menu if intent is clear.
- Extract 'query', 'location', and 'quantity' precisely for search intents.
- Do not invent product IDs. Use only those provided or mentioned by the user.`;

export const BUYER_GEMINI_FUNCTION_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: "search_products",
    description:
      "Search the global SwiftTrade catalogue for a product based on name and optionally location.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        query: {
          type: SchemaType.STRING,
          description:
            "The name of the item they want to buy (e.g. 'cement', 'iron rod', 'paint')",
        },
        location: {
          type: SchemaType.STRING,
          description:
            "The specific location they want to buy it in (e.g. 'Lekki', 'Ikeja', 'Abuja')",
        },
        quantity: {
          type: SchemaType.NUMBER,
          description: "How many items they want to buy",
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
      type: SchemaType.OBJECT,
      properties: {
        productId: {
          type: SchemaType.STRING,
          description: "The system ID of the product",
        },
        quantity: {
          type: SchemaType.NUMBER,
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
      type: SchemaType.OBJECT,
      properties: {
        orderReference: {
          type: SchemaType.STRING,
          description:
            "The order ID or reference string explicitly mentioned by the user.",
        },
      },
    },
  },
  {
    name: "browse_categories",
    description:
      "Browse the available product categories in the SwiftTrade marketplace.",
  },
  {
    name: "contact_support",
    description: "Connect to support for dispute resolutions or problems.",
  },
];
