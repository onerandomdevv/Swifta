import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma } from "@prisma/client";
import { GeminiClient } from "../../integrations/ai/gemini.client";
import { GoogleVisionClient } from "../../integrations/ai/google-vision.client";
import { MetaWhatsAppClient } from "../../integrations/meta-whatsapp/meta-whatsapp.client";
import { PrismaService } from "../../prisma/prisma.service";
import { WhatsAppInteractiveService } from "./whatsapp-interactive.service";

@Injectable()
export class ImageSearchService {
  private readonly logger = new Logger(ImageSearchService.name);
  private readonly primarySearchApi: string;
  private readonly fallbackSearchApi: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private interactiveService: WhatsAppInteractiveService,
    private metaWhatsAppClient: MetaWhatsAppClient,
    private geminiClient: GeminiClient,
    private googleVisionClient: GoogleVisionClient,
  ) {
    this.primarySearchApi =
      this.configService.get<string>("IMAGE_SEARCH_PRIMARY") || "cloud_vision";
    this.fallbackSearchApi =
      this.configService.get<string>("IMAGE_SEARCH_FALLBACK") || "gemini";
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
        "Analyzing image. Please wait...",
      );

      const imageResult = await this.downloadMetaImage(imageId);
      if (!imageResult) {
        await this.interactiveService.sendTextMessage(
          phone,
          "Sorry, I couldn't download the image. Please try again.",
        );
        return;
      }

      const { base64Data, mimeType } = imageResult;

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
          "I couldn't identify the product in this photo. Please make sure the item is clearly visible and try sending it again.",
        );
        return;
      }

      this.logger.log(`Extracted terms: ${extractedTerms.join(", ")}`);

      const products = await this.searchProducts(extractedTerms);

      if (products.length === 0) {
        const bodyText = `I identified the item as *${extractedTerms[0]}*, but I couldn't find a direct match right now.\n\nHere are some other popular products you might like instead:`;

        const fallbackProducts = await this.prisma.product.findMany({
          where: { isActive: true },
          include: { merchantProfile: { select: { businessName: true } } },
          take: 5,
          orderBy: { createdAt: "desc" },
        });

        if (fallbackProducts.length > 0) {
          const rows = fallbackProducts.map((product) => ({
            id: `buy_${product.id}_1`,
            title: product.name.substring(0, 24),
            description:
              `NGN ${(Number(product.retailPriceKobo || product.pricePerUnitKobo || 0) / 100).toLocaleString("en-NG")} | ${product.merchantProfile?.businessName || "Verified Shop"}`.substring(
                0,
                72,
              ),
          }));

          await this.interactiveService.sendListMessage(
            phone,
            bodyText,
            "Alternative Products",
            [
              { title: "Suggested Items", rows },
              {
                title: "Other Options",
                rows: [
                  {
                    id: "browse_categories",
                    title: "Browse Categories",
                    description: "Explore by type",
                  },
                  {
                    id: "search_products",
                    title: "Try Text Search",
                    description: "Search by keyword",
                  },
                ],
              },
            ],
          );
          return;
        }

        const bodyTextFallback = `I identified the item as *${extractedTerms[0]}*, but I couldn't find a direct match.\n\nWould you like to browse our top categories or search for a different product?`;
        await this.interactiveService.sendReplyButtons(
          phone,
          bodyTextFallback,
          [
            { id: "browse_categories", title: "Browse Categories" },
            { id: "search_products", title: "Try Text Search" },
          ],
        );
        return;
      }

      const rows = products.slice(0, 10).map((product) => ({
        id: `buy_${product.id}_1`,
        title: product.name.substring(0, 24),
        description:
          `NGN ${(Number(product.retailPriceKobo || product.pricePerUnitKobo || 0) / 100).toLocaleString("en-NG")} | ${product.merchantProfile?.businessName || "Verified Shop"}`.substring(
            0,
            72,
          ),
      }));

      await this.interactiveService.sendListMessage(
        phone,
        `Matching products for "${extractedTerms[0]}":`,
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
        "An error occurred during image search. Please try again later.",
      );
    }
  }

  public async downloadMetaImage(
    imageId: string,
  ): Promise<{ base64Data: string; mimeType: string } | null> {
    return this.metaWhatsAppClient.downloadImage(imageId);
  }

  private async analyzeImage(
    base64Data: string,
    mimeType: string,
    apiType: string,
  ): Promise<string[] | null> {
    if (apiType === "cloud_vision") {
      return this.googleVisionClient.detectProductTerms(base64Data);
    }

    if (apiType === "gemini") {
      return this.geminiClient.analyzeImageKeywords(base64Data, mimeType);
    }

    return null;
  }

  private async searchProducts(terms: string[]) {
    if (!terms || terms.length === 0) return [];

    const searchConditions = terms.map((term) => ({
      name: { contains: term, mode: Prisma.QueryMode.insensitive },
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
