import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  FunctionDeclaration,
  GoogleGenerativeAI,
  SchemaType,
} from "@google/generative-ai";

export interface GeminiFunctionCall {
  name: string;
  args: Record<string, any>;
}

@Injectable()
export class GeminiClient {
  private readonly logger = new Logger(GeminiClient.name);
  private readonly apiKey: string;
  private readonly genAI: GoogleGenerativeAI | null;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>("ai.geminiApiKey") || "";
    this.genAI = this.isConfigured()
      ? new GoogleGenerativeAI(this.apiKey)
      : null;

    if (!this.genAI) {
      this.logger.warn("GEMINI_API_KEY not configured. Gemini is disabled.");
    }
  }

  isConfigured(): boolean {
    return Boolean(
      this.apiKey && this.apiKey !== "your_google_ai_studio_key_here",
    );
  }

  async parseFunctionCall(params: {
    message: string;
    systemPrompt?: string;
    functionDeclarations: any[];
    modelName?: string;
  }): Promise<GeminiFunctionCall | null> {
    if (!this.genAI) {
      return null;
    }

    const model = this.genAI.getGenerativeModel({
      model:
        params.modelName ||
        this.configService.get<string>("ai.geminiModel") ||
        "gemini-2.5-flash",
      systemInstruction: params.systemPrompt || "",
      tools: [
        {
          functionDeclarations: this.normalizeFunctionDeclarations(
            params.functionDeclarations,
          ),
        },
      ],
    });

    const result = await model.generateContent(params.message);
    const functionCalls = result.response.functionCalls?.() ?? [];
    const directFunctionCall = functionCalls[0];

    if (directFunctionCall) {
      return {
        name: directFunctionCall.name,
        args: (directFunctionCall.args as Record<string, any>) || {},
      };
    }

    const candidate = result.response.candidates?.[0];
    const functionCallPart = candidate?.content?.parts?.find(
      (part) => part.functionCall,
    );

    if (functionCallPart?.functionCall) {
      return {
        name: functionCallPart.functionCall.name,
        args: (functionCallPart.functionCall.args as Record<string, any>) || {},
      };
    }

    return null;
  }

  async generateJson<T>(params: {
    prompt: string;
    systemPrompt?: string;
    responseSchema: Record<string, any>;
    modelName?: string;
    temperature?: number;
  }): Promise<T | null> {
    if (!this.isConfigured()) {
      return null;
    }

    const response = await fetch(
      `${this.getGenerateContentUrl(params.modelName)}?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: { text: params.systemPrompt || "" },
          },
          contents: [{ parts: [{ text: params.prompt }] }],
          generationConfig: {
            response_mime_type: "application/json",
            response_schema: params.responseSchema,
            temperature: params.temperature ?? 0.1,
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
      return null;
    }

    return JSON.parse(content) as T;
  }

  async analyzeImageKeywords(
    base64Data: string,
    mimeType: string,
  ): Promise<string[] | null> {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(
        `${this.getGenerateContentUrl(
          this.configService.get<string>("ai.geminiVisionModel") ||
            "gemini-1.5-flash",
        )}?key=${this.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: "Identify the main product naturally in this image. Output a comma separated list of up to 5 concise search keywords (e.g., iPhone, Sneakers, Laptop). Just the keywords, no other text.",
                  },
                  {
                    inlineData: {
                      mimeType,
                      data: base64Data,
                    },
                  },
                ],
              },
            ],
          }),
          signal: controller.signal as RequestInit["signal"],
        },
      );

      clearTimeout(timeout);

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        return null;
      }

      return text
        .split(",")
        .map((term: string) => term.trim())
        .filter(Boolean);
    } catch (error) {
      this.logger.error("Gemini Vision error:", error);
      return null;
    }
  }

  private getGenerateContentUrl(modelName?: string): string {
    const model =
      modelName ||
      this.configService.get<string>("ai.geminiModel") ||
      "gemini-2.5-flash";
    return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  }

  private normalizeFunctionDeclarations(
    declarations: any[],
  ): FunctionDeclaration[] {
    return declarations.map((declaration) => ({
      ...declaration,
      parameters: declaration.parameters
        ? this.normalizeSchema(declaration.parameters)
        : undefined,
    }));
  }

  private normalizeSchema(schema: any): any {
    if (!schema) {
      return undefined;
    }

    const normalized: any = {
      ...schema,
      type: this.normalizeSchemaType(schema.type),
    };

    if (schema.properties) {
      normalized.properties = Object.fromEntries(
        Object.entries(schema.properties).map(([key, value]) => [
          key,
          this.normalizeSchema(value),
        ]),
      );
    }

    if (schema.items) {
      normalized.items = this.normalizeSchema(schema.items);
    }

    return normalized;
  }

  private normalizeSchemaType(type: any): SchemaType {
    if (typeof type !== "string") {
      return type;
    }

    switch (type.toLowerCase()) {
      case "object":
        return SchemaType.OBJECT;
      case "number":
        return SchemaType.NUMBER;
      case "integer":
        return SchemaType.INTEGER;
      case "boolean":
        return SchemaType.BOOLEAN;
      case "array":
        return SchemaType.ARRAY;
      case "string":
      default:
        return SchemaType.STRING;
    }
  }
}
