import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GoogleGenerativeAI,
  SchemaType,
} from '@google/generative-ai';
import {
  NUMBER_INTENT_MAP,
  SYSTEM_PROMPT,
  GEMINI_FUNCTION_DECLARATIONS,
} from './whatsapp.constants';

export interface ParsedIntent {
  functionName: string;
  params: Record<string, any>;
}

/**
 * AI-powered intent parsing using Gemini function calling.
 *
 * - Numbers 1–6 bypass the AI entirely (fast, free, always works).
 * - Free-text messages go through Gemini with function declarations.
 * - Falls back to show_menu on any AI error (graceful degradation).
 */
@Injectable()
export class WhatsAppIntentService {
  private readonly logger = new Logger(WhatsAppIntentService.name);
  private genAI: GoogleGenerativeAI | null = null;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey && apiKey !== 'your_google_ai_studio_key_here') {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.logger.log('Gemini AI initialized for intent parsing');
    } else {
      this.logger.warn(
        'GEMINI_API_KEY not configured — AI intent parsing disabled, number menu still works',
      );
    }
  }

  /**
   * Parse the merchant's message text and determine which function to call.
   *
   * Priority:
   * 1. Number 1–6 → direct map (no AI)
   * 2. "menu" / "help" keywords → show_menu (no AI)
   * 3. Free text → Gemini function calling
   * 4. Fallback → show_menu
   */
  async parseIntent(messageText: string): Promise<ParsedIntent> {
    const text = messageText.trim();

    // 1. Direct number mapping
    if (NUMBER_INTENT_MAP[text]) {
      return { functionName: NUMBER_INTENT_MAP[text], params: {} };
    }

    // 2. Keyword shortcuts
    const lower = text.toLowerCase();
    if (['menu', 'help', 'hi', 'hello', 'hey', 'start'].includes(lower)) {
      return { functionName: 'show_menu', params: {} };
    }

    // 3. AI intent parsing via Gemini
    if (this.genAI) {
      try {
        return await this.parseWithGemini(text);
      } catch (error) {
        this.logger.error(
          `Gemini intent parsing failed: ${error instanceof Error ? error.message : error}`,
        );
        // Fall through to default
      }
    }

    // 4. Fallback — show menu
    return { functionName: 'show_menu', params: {} };
  }

  // -----------------------------------------------------------------------
  // Gemini function calling
  // -----------------------------------------------------------------------
  private async parseWithGemini(messageText: string): Promise<ParsedIntent> {
    const model = this.genAI!.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: SYSTEM_PROMPT,
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
                            val.type === 'number'
                              ? SchemaType.NUMBER
                              : SchemaType.STRING,
                          description: val.description || '',
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
      return { functionName: 'show_menu', params: {} };
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

    // No function call found — show menu
    return { functionName: 'show_menu', params: {} };
  }
}
