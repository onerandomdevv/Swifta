import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  NUMBER_INTENT_MAP,
  GEMINI_FUNCTION_DECLARATIONS,
} from "./whatsapp.constants";
import { GeminiClient } from "../../integrations/ai/gemini.client";

export interface ParsedIntent {
  functionName: string;
  params: Record<string, any>;
}

/**
 * AI-powered intent parsing using Gemini function calling.
 *
 * Priority:
 * 1. Numbers 1-6 bypass the AI entirely.
 * 2. Greetings/menu/help route directly to show_menu.
 * 3. Everything else goes through Gemini function calling.
 * 4. AI failures fall back to friendly_fallback.
 */
@Injectable()
export class WhatsAppIntentService {
  private readonly logger = new Logger(WhatsAppIntentService.name);

  constructor(
    private configService: ConfigService,
    private geminiClient: GeminiClient,
  ) {
    if (!this.geminiClient.isConfigured()) {
      this.logger.warn(
        "Gemini API key not configured - AI intent parsing disabled, number menu still works",
      );
    }
  }

  async parseIntent(messageText: string): Promise<ParsedIntent> {
    const text = messageText.trim();

    if (NUMBER_INTENT_MAP[text]) {
      this.logger.log(
        `Number shortcut: "${text}" -> ${NUMBER_INTENT_MAP[text]}`,
      );
      return { functionName: NUMBER_INTENT_MAP[text], params: {} };
    }

    const lower = text.toLowerCase();
    if (["menu", "help", "start"].includes(lower)) {
      this.logger.log(`Keyword shortcut: "${text}" -> show_menu`);
      return { functionName: "show_menu", params: {} };
    }

    if (this.geminiClient.isConfigured()) {
      try {
        this.logger.log(`Sending to Gemini AI: "${text}"`);
        const intent = await this.parseWithGemini(text);
        this.logger.log(
          `Gemini returned: ${intent.functionName} | Params: ${JSON.stringify(intent.params)}`,
        );
        return intent;
      } catch (error) {
        this.logger.error(
          `Gemini intent parsing failed: ${error instanceof Error ? error.message : error}`,
        );
        return { functionName: "friendly_fallback", params: {} };
      }
    }

    this.logger.log(`No AI available, trying keyword match for: "${text}"`);
    return this.basicKeywordMatch(text);
  }

  private basicKeywordMatch(text: string): ParsedIntent {
    const lower = text.toLowerCase();

    if (lower.includes("dispatch")) {
      const match = lower.match(/dispatch\s+([a-zA-Z0-9]+)/);
      const orderReference = match ? match[1] : undefined;
      return {
        functionName: "dispatch_order",
        params: orderReference ? { orderReference } : {},
      };
    }

    if (
      lower.includes("my orders") ||
      lower.includes("recent orders") ||
      lower.includes("show my orders")
    ) {
      return { functionName: "get_recent_orders", params: {} };
    }

    if (lower.includes("update price") || lower.includes("change price")) {
      return { functionName: "update_product_price", params: {} };
    }

    if (
      lower.includes("sales") ||
      lower.includes("market") ||
      lower.includes("revenue") ||
      lower.includes("sell") ||
      lower.includes("business")
    ) {
      let timeframe = "today";
      if (lower.includes("week")) timeframe = "this_week";
      if (lower.includes("month")) timeframe = "this_month";
      if (lower.includes("all")) timeframe = "all_time";
      return { functionName: "get_sales_summary", params: { timeframe } };
    }

    if (
      lower.includes("inventory") ||
      lower.includes("stock") ||
      lower.includes("store") ||
      lower.includes("warehouse") ||
      lower.includes("goods")
    ) {
      return { functionName: "get_inventory", params: {} };
    }

    if (
      lower.includes("product") ||
      lower.includes("listing") ||
      lower.includes("sell")
    ) {
      return { functionName: "get_products", params: {} };
    }

    if (
      lower.includes("add") ||
      lower.includes("remove") ||
      lower.includes("restock") ||
      lower.includes("receive")
    ) {
      return { functionName: "update_stock", params: {} };
    }

    if (
      lower.includes("verify") ||
      lower.includes("verification") ||
      lower.includes("verified")
    ) {
      return { functionName: "get_verification_status", params: {} };
    }

    if (
      ["hi", "hello", "hey", "good morning", "good evening"].includes(lower)
    ) {
      return { functionName: "show_menu", params: {} };
    }

    return { functionName: "friendly_fallback", params: {} };
  }

  private async parseWithGemini(messageText: string): Promise<ParsedIntent> {
    const systemPrompt =
      this.configService.get<string>("whatsapp.merchantSystemPrompt") || "";

    const functionCall = await this.geminiClient.parseFunctionCall({
      message: messageText,
      systemPrompt,
      functionDeclarations: GEMINI_FUNCTION_DECLARATIONS,
    });

    if (!functionCall) {
      this.logger.warn("Gemini returned no function call");
      return { functionName: "friendly_fallback", params: {} };
    }

    return {
      functionName: functionCall.name,
      params: functionCall.args,
    };
  }
}
