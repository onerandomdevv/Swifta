import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class GoogleVisionClient {
  private readonly logger = new Logger(GoogleVisionClient.name);
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>("ai.googleCloudApiKey") || "";
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async detectProductTerms(base64Data: string): Promise<string[] | null> {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${this.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requests: [
              {
                image: { content: base64Data },
                features: [
                  { type: "TEXT_DETECTION", maxResults: 1 },
                  { type: "OBJECT_LOCALIZATION", maxResults: 3 },
                  { type: "LABEL_DETECTION", maxResults: 5 },
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
      const responseData = data.responses?.[0];

      const objects =
        responseData?.localizedObjectAnnotations
          ?.filter((object: { score: number }) => object.score > 0.5)
          ?.map((object: { name: string }) => object.name) || [];

      const labels =
        responseData?.labelAnnotations
          ?.filter((label: { score: number }) => label.score > 0.7)
          ?.map((label: { description: string }) => label.description) || [];

      let textTerms: string[] = [];
      if (objects.length === 0 && labels.length === 0) {
        const textBlock = responseData?.textAnnotations?.[0]?.description || "";
        if (textBlock) {
          textTerms = textBlock
            .split(/\s+/)
            .filter(
              (word: string) => word.length > 3 && !word.match(/^[0-9]+$/),
            )
            .slice(0, 3);
        }
      }

      const terms = Array.from(new Set([...objects, ...labels, ...textTerms]));
      this.logger.debug(
        `Vision results - objects: [${objects.join(", ")}], labels: [${labels.join(", ")}], ocrFallback: [${textTerms.join(", ")}]`,
      );

      return terms.length > 0 ? terms : null;
    } catch (error) {
      this.logger.error("Cloud Vision error:", error);
      return null;
    }
  }
}
