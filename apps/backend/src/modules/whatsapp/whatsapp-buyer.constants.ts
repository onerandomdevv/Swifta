// ---------------------------------------------------------------------------
// WhatsApp Buyer Bot — Constants, templates & Gemini declarations
// ---------------------------------------------------------------------------
import { SchemaType, FunctionDeclaration } from "@google/generative-ai";

export const BUYER_MAIN_MENU = `Welcome back! 🛒 Here's what I can help you with:

1️⃣ Search Products — "I need 50 bags of cement in Ikeja"
2️⃣ My Active Orders — "Where is my order?"
3️⃣ Confirm Delivery — "Confirm delivery for ABC123"
4️⃣ Order History — "Show my past purchases"
5️⃣ Support — "I have a problem with my order"

Just type a number or tell me what you need! 🛒`;

export const BUYER_FRIENDLY_FALLBACK = `I'm not exactly sure what you need 😅 But no worries, I can help you with:

1️⃣ Search Products — "I need 50 bags of cement in Ikeja"
2️⃣ My Active Orders — "Where is my order?"
3️⃣ Confirm Delivery — "Confirm delivery for ABC123"
4️⃣ Order History — "Show my past purchases"
5️⃣ Support — "I need help"

Just tell me what you're looking for!`;

export const BUYER_NUMBER_INTENT_MAP: Record<string, string> = {
  "1": "search_products",
  "2": "get_active_orders",
  "3": "confirm_delivery",
  "4": "get_order_history",
  "5": "contact_support",
};

export const BUYER_SYSTEM_PROMPT = `You are SwiftTrade Buyer Bot, a helpful shopping assistant for construction and hardware buyers in Nigeria.

YOUR JOB: Understand what the buyer wants to do and call the matching function to perform the action.

LANGUAGE: Buyers may chat in English, Pidgin English, or a mix of Yoruba-English. Understand them naturally. Examples:

Product Search:
- "I need 50 bags of cement in Lekki" → search_products (query: "cement", location: "Lekki", quantity: 50)
- "Where fit I get iron rod for Ikeja?" → search_products (query: "iron rod", location: "Ikeja")
- "I wan buy wood" → search_products (query: "wood")
- "price of granite" → search_products (query: "granite")

Orders & Tracking:
- "where is my order" → get_active_orders
- "my orders" → get_active_orders
- "track my delivery" → get_active_orders
- "show my past purchases" → get_order_history

Delivery Confirmation:
- "confirm delivery for ABC123" → confirm_delivery (orderReference: "ABC123")
- "I don receive my order ABC" → confirm_delivery (orderReference: "ABC")

Purchasing:
- "buy product DEF456 50 bags" → buy_product (productId: "DEF456", quantity: 50)
- "I want to buy 100 units of item X" → buy_product (productId: "X", quantity: 100)

RULES:
- Call the appropriate tool for their query. Do not show the menu if you understand what they want.
- Try to extract 'query', 'location', and 'quantity' strictly for search intents.
- Do not make up product IDs.`;

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
    name: "contact_support",
    description: "Connect to support for dispute resolutions or problems.",
  },
];
