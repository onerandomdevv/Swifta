import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ParsedIntent } from "./whatsapp-intent.service";
import {
  BUYER_NUMBER_INTENT_MAP,
  BUYER_SYSTEM_PROMPT,
  BUYER_GEMINI_FUNCTION_DECLARATIONS,
} from "./whatsapp-buyer.constants";

@Injectable()
export class WhatsAppBuyerIntentService {
  private readonly logger = new Logger(WhatsAppBuyerIntentService.name);
  private genAI: GoogleGenerativeAI | null = null;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>("GEMINI_API_KEY");
    if (apiKey && apiKey !== "your_google_ai_studio_key_here") {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async parseIntent(messageText: string): Promise<ParsedIntent> {
    const text = messageText.trim();

    if (BUYER_NUMBER_INTENT_MAP[text]) {
      return { functionName: BUYER_NUMBER_INTENT_MAP[text], params: {} };
    }

    const lower = text.toLowerCase();
    if (["menu", "help", "start", "hi", "hello"].includes(lower)) {
      return { functionName: "show_menu", params: {} };
    }

    if (this.genAI) {
      try {
        const intent = await this.parseWithGemini(text);
        return intent;
      } catch (error) {
        this.logger.error(`Gemini intent parsing failed for buyer: ${error}`);
        return { functionName: "friendly_fallback", params: {} };
      }
    }

    // Keyword fallback without AI
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
    if (lower.includes("where") || lower.includes("track")) {
      return { functionName: "get_active_orders", params: {} };
    }

    return { functionName: "show_menu", params: {} };
  }

  private async parseWithGemini(userMessage: string): Promise<ParsedIntent> {
    if (!this.genAI) throw new Error("Gemini AI is not initialized");

    const model = this.genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: BUYER_SYSTEM_PROMPT,
      tools: [{ functionDeclarations: BUYER_GEMINI_FUNCTION_DECLARATIONS }],
    });

    const chat = model.startChat();
    const result = await chat.sendMessage(userMessage);
    const functionCall = result.response.functionCalls()?.[0];

    if (functionCall) {
      return {
        functionName: functionCall.name,
        params: functionCall.args as Record<string, any>,
      };
    }

    return { functionName: "friendly_fallback", params: {} };
  }
}
