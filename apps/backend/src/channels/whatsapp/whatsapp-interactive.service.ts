import { Injectable, Logger } from "@nestjs/common";
import { MetaWhatsAppClient } from "../../integrations/meta-whatsapp/meta-whatsapp.client";

/**
 * WhatsApp Interactive Message Service
 *
 * Utility for sending Meta Interactive Messages (Reply Buttons & List Messages)
 * and plain text messages via the WhatsApp Business Cloud API.
 */
@Injectable()
export class WhatsAppInteractiveService {
  private readonly logger = new Logger(WhatsAppInteractiveService.name);

  constructor(private metaWhatsAppClient: MetaWhatsAppClient) {}

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
    headerImageUrl?: string,
  ): Promise<void> {
    if (buttons.length > 3) {
      this.logger.warn(
        `Reply buttons truncated to 3 (received ${buttons.length})`,
      );
      buttons = buttons.slice(0, 3);
    }

    const interactive: any = {
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
    };

    if (headerImageUrl) {
      interactive.header = {
        type: "image",
        image: { link: headerImageUrl },
      };
    }

    await this.callMetaApi(phone, {
      messaging_product: "whatsapp",
      to: phone,
      type: "interactive",
      interactive,
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
    headerImageUrl?: string,
  ): Promise<void> {
    const interactive: any = {
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
    };

    if (headerImageUrl) {
      interactive.header = {
        type: "image",
        image: { link: headerImageUrl },
      };
    }

    await this.callMetaApi(phone, {
      messaging_product: "whatsapp",
      to: phone,
      type: "interactive",
      interactive,
    });
  }

  // -----------------------------------------------------------------------
  // Send CTA URL Button (Single button that opens a website)
  // -----------------------------------------------------------------------
  async sendCTAUrlButton(
    phone: string,
    bodyText: string,
    buttonTitle: string,
    url: string,
  ): Promise<void> {
    await this.callMetaApi(phone, {
      messaging_product: "whatsapp",
      to: phone,
      type: "interactive",
      interactive: {
        type: "cta_url",
        body: { text: bodyText },
        action: {
          name: "cta_url",
          parameters: {
            display_text: buttonTitle.substring(0, 20),
            url: url,
          },
        },
      },
    });
  }

  // -----------------------------------------------------------------------
  // Send Template Message (Pre-approved Meta Templates like auth_otp)
  // -----------------------------------------------------------------------
  async sendTemplateMessage(
    phone: string,
    templateName: string,
    otpCode: string,
  ): Promise<void> {
    const trimmedOtp = (otpCode || "").trim();
    if (!trimmedOtp || trimmedOtp.length < 4) {
      this.logger.error(
        `Invalid or missing OTP code provided for template ${templateName}.`,
      );
      throw new Error(`Invalid OTP code provided for template ${templateName}`);
    }

    await this.callMetaApi(phone, {
      messaging_product: "whatsapp",
      to: phone,
      type: "template",
      template: {
        name: templateName,
        language: {
          code: "en",
        },
        components: [
          {
            type: "body",
            parameters: [
              {
                type: "text",
                text: otpCode,
              },
            ],
          },
          {
            type: "button",
            sub_type: "url",
            index: 0,
            parameters: [
              {
                type: "text",
                text: otpCode,
              },
            ],
          },
        ],
      },
    });
  }

  // -----------------------------------------------------------------------
  // Internal: Call Meta Cloud API
  // -----------------------------------------------------------------------
  private async callMetaApi(phone: string, payload: any): Promise<void> {
    try {
      await this.metaWhatsAppClient.sendMessage({ ...payload, to: phone });
    } catch (error) {
      this.logger.error(
        `Failed to send WhatsApp message to ${phone}: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }
}
