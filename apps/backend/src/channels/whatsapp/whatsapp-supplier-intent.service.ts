import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ParsedIntent } from "./whatsapp-intent.service";
import { GeminiClient } from "../../integrations/ai/gemini.client";

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
          description: "Name of the product indicated in the supplier message.",
        },
        newPriceNaira: {
          type: "number",
          description: "The new wholesale price indicated in Naira.",
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
  private readonly systemPrompt: string;

  constructor(
    private configService: ConfigService,
    private geminiClient: GeminiClient,
  ) {
    this.systemPrompt =
      this.configService.get<string>("whatsapp.supplierSystemPrompt") || "";
  }

  async parseIntent(text: string): Promise<ParsedIntent> {
    const cleanText = text.trim().toLowerCase();

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

    if (["menu", "hi", "hello", "help", "start"].includes(cleanText)) {
      return { functionName: "show_menu", params: {} };
    }

    if (!this.geminiClient.isConfigured()) {
      this.logger.warn(
        "Gemini client not configured - falling back to unknown intent.",
      );
      return { functionName: "unknown", params: {} };
    }

    try {
      const parsed = await this.geminiClient.generateJson<ParsedIntent>({
        prompt: text,
        systemPrompt: this.systemPrompt,
        responseSchema: SUPPLIER_INTENT_SCHEMA,
        temperature: 0.1,
      });

      if (!parsed) {
        return { functionName: "unknown", params: {} };
      }

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
