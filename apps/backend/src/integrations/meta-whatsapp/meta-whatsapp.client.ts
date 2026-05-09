import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

type SendMessageOptions = {
  normalizeRecipient?: boolean;
  throwOnError?: boolean;
  timeoutMs?: number;
};

@Injectable()
export class MetaWhatsAppClient {
  private readonly logger = new Logger(MetaWhatsAppClient.name);
  private readonly baseUrl = "https://graph.facebook.com";
  private readonly apiVersion: string;
  private readonly phoneNumberId: string;
  private readonly accessToken: string;

  constructor(private configService: ConfigService) {
    this.apiVersion =
      this.configService.get<string>("whatsapp.apiVersion") || "v21.0";
    this.phoneNumberId =
      this.configService.get<string>("whatsapp.phoneNumberId") || "";
    this.accessToken =
      this.configService.get<string>("whatsapp.accessToken") || "";

    if (!this.phoneNumberId || !this.accessToken) {
      this.logger.warn(
        "WhatsApp configuration missing! WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN are required for WhatsApp features to work.",
      );
    }
  }

  getMediaGraphUrl(imageId: string): string {
    return `${this.baseUrl}/${this.apiVersion}/${imageId}`;
  }

  async sendTextMessage(
    to: string,
    text: string,
    options: SendMessageOptions = {},
  ): Promise<boolean> {
    return this.sendMessage(
      {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      },
      options,
    );
  }

  async sendMessage(
    payload: Record<string, any>,
    options: SendMessageOptions = {},
  ): Promise<boolean> {
    const { normalizeRecipient = true, throwOnError = true } = options;

    if (!this.phoneNumberId || !this.accessToken) {
      const message = "WhatsApp credentials missing. Skipping message send.";
      this.logger.warn(message);
      if (throwOnError) {
        throw new Error(message);
      }
      return false;
    }

    const outboundPayload = { ...payload };
    if (normalizeRecipient && typeof outboundPayload.to === "string") {
      outboundPayload.to = outboundPayload.to.startsWith("+")
        ? outboundPayload.to.slice(1)
        : outboundPayload.to;
    }

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      options.timeoutMs ?? 10000,
    );

    try {
      const response = await fetch(
        `${this.baseUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(outboundPayload),
          signal: controller.signal as RequestInit["signal"],
        },
      );

      clearTimeout(timeout);

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(
          `Meta API error (${response.status}) for ${outboundPayload.to}: ${errorBody}`,
        );
        if (throwOnError) {
          throw new Error(`Meta API error: ${response.status} ${errorBody}`);
        }
        return false;
      }

      return true;
    } catch (error) {
      clearTimeout(timeout);
      this.logger.error(
        `Failed to send WhatsApp message: ${error instanceof Error ? error.message : error}`,
      );
      if (throwOnError) {
        throw error;
      }
      return false;
    }
  }

  async downloadImage(
    imageId: string,
  ): Promise<{ base64Data: string; mimeType: string } | null> {
    try {
      const metadata = await this.fetchJsonWithTimeout(
        this.getMediaGraphUrl(imageId),
      );
      const imageUrl = metadata?.url;

      if (!imageUrl) {
        throw new Error("Meta image metadata did not include a URL.");
      }

      const imageResponse = await this.fetchWithTimeout(imageUrl);

      if (!imageResponse.ok) {
        throw new Error("Failed to download image data");
      }

      const mimeType =
        metadata.mime_type ||
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

  private async fetchJsonWithTimeout(url: string): Promise<any> {
    const response = await this.fetchWithTimeout(url);
    if (!response.ok) {
      throw new Error("Failed to get image URL");
    }
    return response.json();
  }

  private async fetchWithTimeout(url: string): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      return await fetch(url, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
        signal: controller.signal as RequestInit["signal"],
      });
    } finally {
      clearTimeout(timeout);
    }
  }
}
