import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import { WhatsAppSupplierIntentService } from "./whatsapp-supplier-intent.service";
import { ParsedIntent } from "./whatsapp-intent.service";
import { RedisService } from "../../redis/redis.service";
import { SUPPLIER_MAIN_MENU, FRIENDLY_FALLBACK } from "./whatsapp.constants";
import { OrderStatus } from "@hardware-os/shared";

// Helper to mask phone numbers — only show last 4 digits
function maskPhone(phone: string): string {
  if (phone.length <= 4) return "****";
  return `****${phone.slice(-4)}`;
}

@Injectable()
export class WhatsAppSupplierService {
  private readonly logger = new Logger(WhatsAppSupplierService.name);
  private readonly accessToken: string;
  private readonly phoneNumberId: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private intentService: WhatsAppSupplierIntentService,
    private redisService: RedisService,
  ) {
    this.accessToken =
      this.configService.get<string>("WHATSAPP_ACCESS_TOKEN") || "";
    this.phoneNumberId =
      this.configService.get<string>("WHATSAPP_PHONE_NUMBER_ID") || "";
  }

  // =======================================================================
  // Main Entry Processor
  // =======================================================================
  async processMessage(
    phone: string,
    messageText: string,
    messageId: string,
  ): Promise<void> {
    try {
      // Find the supplier link
      const link = await (this.prisma as any).whatsAppSupplierLink.findUnique({
        where: { phone },
        select: { supplierId: true, isActive: true },
      });

      if (!link || !link.isActive) {
        this.logger.error(
          `Supplier link not found for phone ${phone} during processMessage`,
        );
        return;
      }

      const supplierId = link.supplierId;
      const intent = await this.intentService.parseIntent(messageText);

      this.logger.debug(
        `Supplier intent parsed | phone=${maskPhone(phone)} | fn=${intent.functionName} | paramKeys=${Object.keys(intent.params ?? {}).join(",")}`,
      );

      const response = await this.executeCommand(supplierId, intent);
      await this.sendWhatsAppMessage(phone, response);
    } catch (error) {
      this.logger.error(
        `Error processing supplier message from ${maskPhone(phone)}: ${error instanceof Error ? error.message : error}`,
      );
      await this.sendWhatsAppMessage(
        phone,
        "Sorry, I ran into a small issue processing that request. Try sending it again.",
      );
    }
  }

  // =======================================================================
  // Command router
  // =======================================================================
  private async executeCommand(
    supplierId: string,
    intent: ParsedIntent,
  ): Promise<string> {
    try {
      switch (intent.functionName) {
        case "show_menu":
          return SUPPLIER_MAIN_MENU;
        case "get_supplier_sales":
          return this.handleSalesSummary(supplierId);
        case "get_supplier_orders":
          return this.handleRecentOrders(supplierId);
        case "get_supplier_products":
          return this.handleGetProducts(supplierId);
        case "update_supplier_price":
          return this.handleUpdatePrice(
            supplierId,
            intent.params.productName,
            intent.params.newPriceNaira,
          );
        case "get_supplier_payouts":
          return this.handlePayouts(supplierId);
        case "dispatch_supplier_order":
          return this.handleDispatchOrder(supplierId, intent.params.orderId);
        default:
          return SUPPLIER_MAIN_MENU;
      }
    } catch (error) {
      this.logger.error(`Error executing supplier command: ${error}`);
      return "I ran into a problem fetching that information. Please try again.";
    }
  }

  // =======================================================================
  // Intent Handlers
  // =======================================================================

  private async handleSalesSummary(supplierId: string): Promise<string> {
    // Stub for now
    return "Your sales summary will be displayed here soon.";
  }

  private async handleRecentOrders(supplierId: string): Promise<string> {
    // Stub for now
    return "Your recent orders will be displayed here soon.";
  }

  private async handleGetProducts(supplierId: string): Promise<string> {
    // Stub for now
    return "Your products will be listed here soon.";
  }

  private async handleUpdatePrice(
    supplierId: string,
    productName?: string,
    newPriceNaira?: number,
  ): Promise<string> {
    if (!productName || !newPriceNaira) {
      return "To update a price, tell me the product and the new price, e.g. 'Update cement to 8500'.";
    }
    // Stub for now
    return "Feature coming soon — this action is not yet implemented.";
  }

  private async handlePayouts(supplierId: string): Promise<string> {
    // Stub for now
    return "Your recent payouts will be displayed here soon.";
  }

  private async handleDispatchOrder(
    supplierId: string,
    orderId?: string,
  ): Promise<string> {
    if (!orderId) {
      return "Which order do you want to mark as dispatched? Tell me the Order ID.";
    }
    // Stub for now
    return "Feature coming soon — this action is not yet implemented.";
  }

  // =======================================================================
  // Meta Cloud API Wrapper
  // =======================================================================
  private async sendWhatsAppMessage(to: string, text: string): Promise<void> {
    if (!this.accessToken || !this.phoneNumberId) {
      this.logger.warn("WhatsApp credentials missing. Skipping message send.");
      return;
    }

    const url = `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "text",
          text: {
            preview_url: false,
            body: text,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Failed to send WhatsApp message: ${errorText}`);
      }
    } catch (error) {
      this.logger.error(
        `Fetch error sending WhatsApp message: ${error instanceof Error ? error.message : error}`,
      );
    }
  }
}
