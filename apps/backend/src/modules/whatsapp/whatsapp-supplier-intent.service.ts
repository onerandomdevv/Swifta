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

@Injectable()
export class WhatsAppSupplierIntentService {
  private readonly logger = new Logger(WhatsAppSupplierIntentService.name);
  private readonly apiKey: string;
  private readonly systemPrompt: string;

  constructor(private configService: ConfigService) {
    const modelName =
      this.configService.get<string>("GEMINI_MODEL") || "gemini-1.5-flash";
    this.apiKey = this.configService.get<string>("GEMINI_API_KEY") || "";
    this.systemPrompt =
      this.configService.get<string>("WHATSAPP_SUPPLIER_SYSTEM_PROMPT") || "";
  }

  private getGeminiUrl(): string {
    const modelName =
      this.configService.get<string>("GEMINI_MODEL") || "gemini-1.5-flash";
    return `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
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
      const response = await fetch(
        `${this.getGeminiUrl()}?key=${this.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: {
              parts: { text: this.systemPrompt },
            },
            contents: [{ parts: [{ text }] }],
            generationConfig: {
              response_mime_type: "application/json",
              response_schema: SUPPLIER_INTENT_SCHEMA,
              temperature: 0.1,
            },
          }),
        },
      );

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
