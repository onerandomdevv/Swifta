import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import { WhatsAppInteractiveService } from "./whatsapp-interactive.service";

@Injectable()
export class ImageSearchService {
  private readonly logger = new Logger(ImageSearchService.name);
  private readonly googleCloudApiKey: string;
  private readonly geminiApiKey: string;
  private readonly primarySearchApi: string;
  private readonly fallbackSearchApi: string;
  private readonly metaAccessToken: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private interactiveService: WhatsAppInteractiveService,
  ) {
    this.googleCloudApiKey =
      this.configService.get<string>("GOOGLE_CLOUD_API_KEY") || "";
    this.geminiApiKey = this.configService.get<string>("GEMINI_API_KEY") || "";
    this.primarySearchApi =
      this.configService.get<string>("IMAGE_SEARCH_PRIMARY") || "cloud_vision";
    this.fallbackSearchApi =
      this.configService.get<string>("IMAGE_SEARCH_FALLBACK") || "gemini";
    this.metaAccessToken =
      this.configService.get<string>("WHATSAPP_ACCESS_TOKEN") || "";
  }

  private maskIdentifier(identifier: string): string {
    if (!identifier) return "";
    return identifier.length > 4
      ? `****${identifier.substring(identifier.length - 4)}`
      : "****";
  }

  async handleImageSearch(phone: string, imageId: string): Promise<void> {
    try {
      await this.interactiveService.sendTextMessage(
        phone,
        "Analyzing your image, please wait... 🔍",
      );

      // 1. Download image from Meta
      const imageResult = await this.downloadMetaImage(imageId);
      if (!imageResult) {
        await this.interactiveService.sendTextMessage(
          phone,
          "Sorry, I couldn't download the image. Please try again.",
        );
        return;
      }

      const { base64Data, mimeType } = imageResult;

      // 2. Identify image content
      let extractedTerms = await this.analyzeImage(
        base64Data,
        mimeType,
        this.primarySearchApi,
      );
      if (!extractedTerms && this.fallbackSearchApi) {
        this.logger.log(
          `Primary API failed, falling back to ${this.fallbackSearchApi}`,
        );
        extractedTerms = await this.analyzeImage(
          base64Data,
          mimeType,
          this.fallbackSearchApi,
        );
      }

      if (!extractedTerms) {
        await this.interactiveService.sendTextMessage(
          phone,
          "I couldn't identify any products in this image. Please ensure the product is clearly visible.",
        );
        return;
      }

      this.logger.log(`Extracted terms: ${extractedTerms.join(", ")}`);

      // 3. Search database
      const products = await this.searchProducts(extractedTerms);

      // 4. Send response
      if (products.length === 0) {
        await this.interactiveService.sendTextMessage(
          phone,
          `I detected "${extractedTerms.join(", ")}" but couldn't find any matching products on Swifta right now.`,
        );
        return;
      }

      const rows = products.slice(0, 10).map((p) => ({
        id: `view_product_${p.id}`,
        title: p.name.substring(0, 24),
        description:
          `₦${Number(p.pricePerUnitKobo || 0) / 100} / ${p.unit}`.substring(
            0,
            72,
          ),
      }));

      await this.interactiveService.sendListMessage(
        phone,
        `I found these products that match your image (${extractedTerms[0]}):`,
        "View Products",
        [{ title: "Matches", rows }],
      );
    } catch (error) {
      this.logger.error(
        `Image search failed for ${this.maskIdentifier(phone)}:`,
        error,
      );
      await this.interactiveService.sendTextMessage(
        phone,
        "Something went wrong while searching. Please try again later.",
      );
    }
  }

  private async downloadMetaImage(
    imageId: string,
  ): Promise<{ base64Data: string; mimeType: string } | null> {
    try {
      const controller1 = new AbortController();
      const timeout1 = setTimeout(() => controller1.abort(), 10000);

      // Get URL
      let urlResponse;
      try {
        urlResponse = await fetch(
          `https://graph.facebook.com/v21.0/${imageId}`,
          {
            headers: { Authorization: `Bearer ${this.metaAccessToken}` },
            signal: controller1.signal as RequestInit["signal"],
          },
        );
      } finally {
        clearTimeout(timeout1);
      }
      if (!urlResponse.ok) throw new Error("Failed to get image URL");
      const urlData = await urlResponse.json();

      const controller2 = new AbortController();
      const timeout2 = setTimeout(() => controller2.abort(), 10000);

      // Download binary
      let imageResponse;
      try {
        imageResponse = await fetch(urlData.url, {
          headers: { Authorization: `Bearer ${this.metaAccessToken}` },
          signal: controller2.signal as RequestInit["signal"],
        });
      } finally {
        clearTimeout(timeout2);
      }

      if (!imageResponse.ok) throw new Error("Failed to download image data");

      const mimeType =
        urlData.mime_type ||
        (imageResponse.headers.get("content-type") || "image/jpeg")
          .split(";")[0]
          .trim();
      const arrayBuffer = await imageResponse.arrayBuffer();
      const base64Data = Buffer.from(arrayBuffer).toString("base64");

      return { base64Data, mimeType };
    } catch (error) {
      this.logger.error("Meta image download error:", error);
      return null;
    }
  }

  private async analyzeImage(
    base64Data: string,
    mimeType: string,
    apiType: string,
  ): Promise<string[] | null> {
    if (apiType === "cloud_vision" && this.googleCloudApiKey) {
      return this.callCloudVision(base64Data);
    }
    if (apiType === "gemini" && this.geminiApiKey) {
      return this.callGeminiVision(base64Data, mimeType);
    }
    return null;
  }

  private async callCloudVision(base64Data: string): Promise<string[] | null> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${this.googleCloudApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requests: [
              {
                image: { content: base64Data },
                features: [
                  { type: "LABEL_DETECTION", maxResults: 5 },
                  { type: "OBJECT_LOCALIZATION", maxResults: 3 },
                ],
              },
            ],
          }),
          signal: controller.signal as RequestInit["signal"],
        },
      );

      clearTimeout(timeout);

      if (!response.ok) return null;
      const data = await response.json();

      const labels =
        data.responses[0]?.labelAnnotations?.map((l: any) => l.description) ||
        [];
      const objects =
        data.responses[0]?.localizedObjectAnnotations?.map(
          (o: any) => o.name,
        ) || [];

      const terms = Array.from(new Set([...objects, ...labels]));
      return terms.length > 0 ? terms : null;
    } catch (error) {
      this.logger.error("Cloud Vision error:", error);
      return null;
    }
  }

  private async callGeminiVision(
    base64Data: string,
    mimeType: string,
  ): Promise<string[] | null> {
    try {
      const modelName =
        this.configService.get<string>("GEMINI_VISION_MODEL") ||
        "gemini-1.5-flash";
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${this.geminiApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: "Identify the main product naturally in this image. Output a comma separated list of up to 5 concise search keywords (e.g., Cement, Porcelain Tile, Iron Rod). Just the keywords, no other text.",
                  },
                  {
                    inlineData: {
                      mimeType: mimeType,
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

      if (!response.ok) return null;
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) return null;
      return text
        .split(",")
        .map((t: string) => t.trim())
        .filter(Boolean);
    } catch (error) {
      this.logger.error("Gemini Vision error:", error);
      return null;
    }
  }

  private async searchProducts(terms: string[]) {
    if (!terms || terms.length === 0) return [];

    const searchConditions = terms.map((term) => ({
      name: { contains: term, mode: "insensitive" as any },
    }));

    return this.prisma.product.findMany({
      where: {
        AND: [{ isActive: true }, { OR: searchConditions }],
      },
      include: { merchantProfile: { select: { businessName: true } } },
      take: 20,
      orderBy: { createdAt: "desc" },
    });
  }
}
