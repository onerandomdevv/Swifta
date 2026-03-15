import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import {
  NUMBER_INTENT_MAP,
  GEMINI_FUNCTION_DECLARATIONS,
} from "./whatsapp.constants";

export interface ParsedIntent {
  functionName: string;
  params: Record<string, any>;
}

/**
 * AI-powered intent parsing using Gemini function calling.
 *
 * Priority:
 * 1. Numbers 1–6 bypass the AI entirely (fast, free, always works).
 * 2. Greetings / "menu" / "help" → show_menu (no AI call).
 * 3. Everything else → Gemini function calling.
 * 4. Fallback on AI error → friendly_fallback (NOT show_menu).
 */
@Injectable()
export class WhatsAppIntentService {
  private readonly logger = new Logger(WhatsAppIntentService.name);
  private genAI: GoogleGenerativeAI | null = null;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>("GEMINI_API_KEY");
    if (apiKey && apiKey !== "your_google_ai_studio_key_here") {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.logger.log("Gemini AI initialized for intent parsing");
    } else {
      this.logger.warn(
        "GEMINI_API_KEY not configured — AI intent parsing disabled, number menu still works",
      );
    }
  }

  /**
   * Parse the merchant's message text and determine which function to call.
   */
  async parseIntent(messageText: string): Promise<ParsedIntent> {
    const text = messageText.trim();

    // 1. Direct number mapping (fastest path — no AI needed)
    if (NUMBER_INTENT_MAP[text]) {
      this.logger.log(
        `Number shortcut: "${text}" → ${NUMBER_INTENT_MAP[text]}`,
      );
      return { functionName: NUMBER_INTENT_MAP[text], params: {} };
    }

    // 2. Explicit greetings / menu requests only (keep this list SHORT)
    const lower = text.toLowerCase();
    if (["menu", "help", "start"].includes(lower)) {
      this.logger.log(`Keyword shortcut: "${text}" → show_menu`);
      return { functionName: "show_menu", params: {} };
    }

    // 3. Wholesale / Manufacturer shortcuts (High priority in V4)
    if (
      lower.includes("wholesale") ||
      lower.includes("manufacturer") ||
      lower.includes("supplier") ||
      lower.includes("buy stock")
    ) {
      this.logger.log(`Wholesale shortcut matched: "${text}"`);
      return this.basicKeywordMatch(text);
    }

    // 4. EVERYTHING ELSE → send to Gemini AI for intent parsing
    if (this.genAI) {
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
        // AI failed — show friendly fallback, NOT the plain menu
        return { functionName: "friendly_fallback", params: {} };
      }
    }

    // 4. No AI configured — try basic keyword matching as last resort
    this.logger.log(`No AI available, trying keyword match for: "${text}"`);
    return this.basicKeywordMatch(text);
  }

  // -----------------------------------------------------------------------
  // Basic keyword matching (when AI is unavailable)
  // -----------------------------------------------------------------------
  private basicKeywordMatch(text: string): ParsedIntent {
    const lower = text.toLowerCase();

    // Dispatch
    if (lower.includes("dispatch")) {
      const match = lower.match(/dispatch\s+([a-zA-Z0-9]+)/);
      const orderReference = match ? match[1] : undefined;
      return {
        functionName: "dispatch_order",
        params: orderReference ? { orderReference } : {},
      };
    }

    // Orders
    if (
      lower.includes("my orders") ||
      lower.includes("recent orders") ||
      lower.includes("show my orders")
    ) {
      return { functionName: "get_recent_orders", params: {} };
    }

    // Update Price
    if (lower.includes("update price") || lower.includes("change price")) {
      return { functionName: "update_product_price", params: {} };
    }

    // Sales-related
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

    // RFQ queries
    if (
      lower.includes("rfq") ||
      lower.includes("order") ||
      lower.includes("request") ||
      lower.includes("buy") ||
      lower.includes("pending")
    ) {
      return { functionName: "get_pending_rfqs", params: {} };
    }

    // Inventory / stock check
    if (
      lower.includes("inventory") ||
      lower.includes("stock") ||
      lower.includes("store") ||
      lower.includes("warehouse") ||
      lower.includes("goods")
    ) {
      return { functionName: "get_inventory", params: {} };
    }

    // Product listing
    if (
      lower.includes("product") ||
      lower.includes("listing") ||
      lower.includes("sell")
    ) {
      return { functionName: "get_products", params: {} };
    }

    // Stock update
    if (
      lower.includes("add") ||
      lower.includes("remove") ||
      lower.includes("restock") ||
      lower.includes("receive")
    ) {
      return { functionName: "update_stock", params: {} };
    }

    // Quote / price
    if (lower.includes("quote") || lower.includes("price")) {
      return { functionName: "respond_to_rfq", params: {} };
    }

    // Verification status
    if (
      lower.includes("verify") ||
      lower.includes("verification") ||
      lower.includes("verified")
    ) {
      return { functionName: "get_verification_status", params: {} };
    }

    // Wholesale / Stock
    if (
      lower.includes("wholesale") ||
      lower.includes("manufacturer") ||
      lower.includes("stock")
    ) {
      const buyMatch = lower.match(
        /(?:buy|order)\s+(?:stock\s+)?([a-zA-Z0-9]+)/,
      );
      if (buyMatch) {
        return {
          functionName: "buy_wholesale",
          params: { productId: buyMatch[1] },
        };
      }
      return { functionName: "browse_wholesale", params: {} };
    }

    // Greetings
    if (
      ["hi", "hello", "hey", "good morning", "good evening"].includes(lower)
    ) {
      return { functionName: "show_menu", params: {} };
    }

    return { functionName: "friendly_fallback", params: {} };
  }

  // -----------------------------------------------------------------------
  // Gemini function calling
  // -----------------------------------------------------------------------
  private async parseWithGemini(messageText: string): Promise<ParsedIntent> {
    const systemPrompt =
      this.configService.get<string>("WHATSAPP_MERCHANT_SYSTEM_PROMPT") || "";

    const modelName = this.configService.get<string>("GEMINI_MODEL") || "gemini-2.0-flash";
    const model = this.genAI!.getGenerativeModel({
      model: modelName,
      systemInstruction: systemPrompt,
      tools: [
        {
          functionDeclarations: GEMINI_FUNCTION_DECLARATIONS.map((fd) => ({
            name: fd.name,
            description: fd.description,
            parameters: fd.parameters
              ? {
                  type: SchemaType.OBJECT,
                  properties: Object.fromEntries(
                    Object.entries(fd.parameters.properties || {}).map(
                      ([key, val]: [string, any]) => [
                        key,
                        {
                          type:
                            val.type === "number"
                              ? SchemaType.NUMBER
                              : SchemaType.STRING,
                          description: val.description || "",
                          ...(val.enum ? { enum: val.enum } : {}),
                        },
                      ],
                    ),
                  ),
                  required: fd.parameters.required || [],
                }
              : undefined,
          })) as any,
        },
      ],
    });

    const result = await model.generateContent(messageText);
    const response = result.response;
    const candidate = response.candidates?.[0];

    if (!candidate?.content?.parts) {
      this.logger.warn("Gemini returned no candidate parts");
      return { functionName: "friendly_fallback", params: {} };
    }

    // Look for a function call in the response
    for (const part of candidate.content.parts) {
      if (part.functionCall) {
        return {
          functionName: part.functionCall.name,
          params: (part.functionCall.args as Record<string, any>) || {},
        };
      }
    }

    // Gemini returned text instead of a function call — check if it's a text response
    const textPart = candidate.content.parts.find((p) => p.text);
    if (textPart?.text) {
      this.logger.log(
        `Gemini returned text instead of function call: "${textPart.text.substring(0, 100)}"`,
      );
    }

    // No function call found — friendly fallback
    return { functionName: "friendly_fallback", params: {} };
  }
}
