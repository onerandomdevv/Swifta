import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ParsedIntent } from "./whatsapp-intent.service";
import {
  BUYER_NUMBER_INTENT_MAP,
  BUYER_GEMINI_FUNCTION_DECLARATIONS,
} from "./whatsapp-buyer.constants";
import { GeminiClient } from "../../integrations/ai/gemini.client";

@Injectable()
export class WhatsAppBuyerIntentService {
  private readonly logger = new Logger(WhatsAppBuyerIntentService.name);

  constructor(
    private configService: ConfigService,
    private geminiClient: GeminiClient,
  ) {}

  async parseIntent(messageText: string): Promise<ParsedIntent> {
    const text = messageText.trim();

    if (BUYER_NUMBER_INTENT_MAP[text]) {
      return { functionName: BUYER_NUMBER_INTENT_MAP[text], params: {} };
    }

    const lower = text.toLowerCase();
    if (["menu", "help", "start", "hi", "hello"].includes(lower)) {
      return { functionName: "show_menu", params: {} };
    }

    if (this.geminiClient.isConfigured()) {
      try {
        return await this.parseWithGemini(text);
      } catch (error) {
        this.logger.error(`Gemini intent parsing failed for buyer: ${error}`);
        return { functionName: "friendly_fallback", params: {} };
      }
    }

    if (
      lower.includes("search") ||
      lower.includes("buy") ||
      lower.includes("need")
    ) {
      return { functionName: "search_products", params: { query: text } };
    }
    if (
      lower.includes("category") ||
      lower.includes("browse") ||
      lower.includes("categories")
    ) {
      return { functionName: "browse_categories", params: {} };
    }
    if (
      lower.includes("merchant") ||
      lower.includes("seller") ||
      lower.includes("shop") ||
      lower.includes("store")
    ) {
      return { functionName: "search_merchants", params: { query: text } };
    }
    if (lower.includes("where") || lower.includes("track")) {
      return { functionName: "get_active_orders", params: {} };
    }

    return { functionName: "show_menu", params: {} };
  }

  private async parseWithGemini(userMessage: string): Promise<ParsedIntent> {
    const systemPrompt =
      this.configService.get<string>("whatsapp.buyerSystemPrompt") || "";

    const functionCall = await this.geminiClient.parseFunctionCall({
      message: userMessage,
      systemPrompt,
      functionDeclarations: BUYER_GEMINI_FUNCTION_DECLARATIONS,
    });

    if (!functionCall) {
      return { functionName: "friendly_fallback", params: {} };
    }

    return {
      functionName: functionCall.name,
      params: functionCall.args,
    };
  }
}
