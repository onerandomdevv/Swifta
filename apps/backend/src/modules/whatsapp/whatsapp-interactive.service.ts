import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { META_API_VERSION } from "./whatsapp.constants";

/**
 * WhatsApp Interactive Message Service
 *
 * Utility for sending Meta Interactive Messages (Reply Buttons & List Messages)
 * and plain text messages via the WhatsApp Business Cloud API.
 */
@Injectable()
export class WhatsAppInteractiveService {
  private readonly logger = new Logger(WhatsAppInteractiveService.name);
  private readonly phoneNumberId: string;
  private readonly accessToken: string;
  private readonly apiUrl: string;

  constructor(private configService: ConfigService) {
    this.phoneNumberId =
      this.configService.get<string>("WHATSAPP_PHONE_NUMBER_ID") || "";
    this.accessToken =
      this.configService.get<string>("WHATSAPP_ACCESS_TOKEN") || "";
    this.apiUrl = `https://graph.facebook.com/${META_API_VERSION}/${this.phoneNumberId}/messages`;
  }

  // -----------------------------------------------------------------------
  // Send a plain text message
  // -----------------------------------------------------------------------
  async sendTextMessage(phone: string, text: string): Promise<void> {
    await this.callMetaApi(phone, {
      messaging_product: "whatsapp",
      to: phone,
      type: "text",
      text: { body: text },
    });
  }

  // -----------------------------------------------------------------------
  // Send Reply Buttons (max 3 buttons, titles max 20 chars)
  // -----------------------------------------------------------------------
  async sendReplyButtons(
    phone: string,
    bodyText: string,
    buttons: Array<{ id: string; title: string }>,
  ): Promise<void> {
    if (buttons.length > 3) {
      this.logger.warn(
        `Reply buttons truncated to 3 (received ${buttons.length})`,
      );
      buttons = buttons.slice(0, 3);
    }

    await this.callMetaApi(phone, {
      messaging_product: "whatsapp",
      to: phone,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: bodyText },
        action: {
          buttons: buttons.map((btn) => ({
            type: "reply",
            reply: {
              id: btn.id,
              title: btn.title.substring(0, 20),
            },
          })),
        },
      },
    });
  }

  // -----------------------------------------------------------------------
  // Send List Message (up to 10 rows per section)
  // -----------------------------------------------------------------------
  async sendListMessage(
    phone: string,
    bodyText: string,
    buttonLabel: string,
    sections: Array<{
      title: string;
      rows: Array<{ id: string; title: string; description?: string }>;
    }>,
  ): Promise<void> {
    await this.callMetaApi(phone, {
      messaging_product: "whatsapp",
      to: phone,
      type: "interactive",
      interactive: {
        type: "list",
        body: { text: bodyText },
        action: {
          button: buttonLabel.substring(0, 20),
          sections: sections.map((section) => ({
            title: section.title,
            rows: section.rows.map((row) => ({
              id: row.id,
              title: row.title.substring(0, 24),
              description: row.description
                ? row.description.substring(0, 72)
                : undefined,
            })),
          })),
        },
      },
    });
  }

  // -----------------------------------------------------------------------
  // Internal: Call Meta Cloud API
  // -----------------------------------------------------------------------
  private async callMetaApi(phone: string, payload: any): Promise<void> {
    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(
          `Meta API error (${response.status}) for ${phone}: ${errorBody}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to send WhatsApp message to ${phone}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }
}
