import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ParsedIntent } from "./whatsapp-intent.service";

// Define strict supplier intents matching those handled in the bot service.
const SUPPLIER_INTENT_SCHEMA = {
  type: "object",
  properties: {
    functionName: {
      type: "string",
      enum: [
        "get_supplier_sales",
        "get_supplier_orders",
        "get_supplier_products",
        "update_supplier_price",
        "get_supplier_payouts",
        "dispatch_supplier_order",
        "show_menu",
        "unknown",
      ],
      description: "The action the supplier wants to perform.",
    },
    params: {
      type: "object",
      properties: {
        productName: {
          type: "string",
          description:
            "Name of the product indicating in the supplier message.",
        },
        newPriceNaira: {
          type: "number",
          description: "The new wholesale price indicating in Naira.",
        },
        orderId: {
          type: "string",
          description: "The order ID to dispatch.",
        },
      },
      description: "Parameters required for the function.",
    },
  },
  required: ["functionName"],
};

// Use Gemini to understand the intent and map it to our command functions.
const SUPPLIER_SYSTEM_PROMPT = `You are SwiftTrade Supplier Bot, an AI assistant for B2B manufacturers and wholesalers in Nigeria.
Your job is to understand the user's message and determine their intent.

Allowed intents:
- "get_supplier_sales": "how much have I made", "today's sales", "sales summary"
- "get_supplier_orders": "my orders", "who ordered", "new orders"
- "get_supplier_products": "what do I sell", "my products"
- "update_supplier_price": "update cement price to 8500", "change price of iron rod to 12000"
- "get_supplier_payouts": "my payouts", "payment history"
- "dispatch_supplier_order": "dispatch order A12B", "order 83f2 is on the way"
- "show_menu": "menu", "help", "hello", "hi"
- "unknown": Anything else that doesn't fit the above.

Extract required parameters like 'productName', 'newPriceNaira', and 'orderId' if present.`;

@Injectable()
export class WhatsAppSupplierIntentService {
  private readonly logger = new Logger(WhatsAppSupplierIntentService.name);
  private readonly apiKey: string;
  private readonly geminiUrl =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>("GEMINI_API_KEY") || "";
  }

  async parseIntent(text: string): Promise<ParsedIntent> {
    const cleanText = text.trim().toLowerCase();

    // 1. Quick matches for menu numbers
    if (cleanText === "1")
      return { functionName: "get_supplier_sales", params: {} };
    if (cleanText === "2")
      return { functionName: "get_supplier_orders", params: {} };
    if (cleanText === "3")
      return { functionName: "get_supplier_products", params: {} };
    if (cleanText === "4")
      return { functionName: "update_supplier_price", params: {} };
    if (cleanText === "5")
      return { functionName: "get_supplier_payouts", params: {} };

    // Common greetings
    if (["menu", "hi", "hello", "help", "start"].includes(cleanText)) {
      return { functionName: "show_menu", params: {} };
    }

    // 2. Fallback to Gemini
    if (!this.apiKey) {
      this.logger.warn("No GEMINI_API_KEY - falling back to unknown intent.");
      return { functionName: "unknown", params: {} };
    }

    try {
      const response = await fetch(`${this.geminiUrl}?key=${this.apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: { text: SUPPLIER_SYSTEM_PROMPT },
          },
          contents: [{ parts: [{ text }] }],
          generationConfig: {
            response_mime_type: "application/json",
            response_schema: SUPPLIER_INTENT_SCHEMA,
            temperature: 0.1,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API Error: ${response.status}`);
      }

      const data = await response.json();
      const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!content) {
        return { functionName: "unknown", params: {} };
      }

      const parsed: ParsedIntent = JSON.parse(content);

      if (!parsed.params) parsed.params = {};

      return parsed;
    } catch (error) {
      this.logger.error(
        `Intent parsing failed: ${error instanceof Error ? error.message : error}`,
      );
      return { functionName: "unknown", params: {} };
    }
  }
}
