import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import { OrderService } from "../order/order.service";
import { ProductService } from "../product/product.service";
import { WhatsAppBuyerAuthService } from "./whatsapp-buyer-auth.service";
import { WhatsAppBuyerIntentService } from "./whatsapp-buyer-intent.service";
import { ParsedIntent } from "./whatsapp-intent.service";
import {
  BUYER_MAIN_MENU,
  BUYER_FRIENDLY_FALLBACK,
} from "./whatsapp-buyer.constants";
import { OrderStatus } from "@hardware-os/shared";

@Injectable()
export class WhatsAppBuyerService {
  private readonly logger = new Logger(WhatsAppBuyerService.name);
  private readonly accessToken: string;
  private readonly phoneNumberId: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private orderService: OrderService,
    private productService: ProductService,
    private authService: WhatsAppBuyerAuthService,
    private intentService: WhatsAppBuyerIntentService,
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
      const buyerId = await this.authService.resolvePhone(phone);

      if (!buyerId) {
        const response = await this.authService.handleLinkingFlow(
          phone,
          messageText,
        );
        await this.sendWhatsAppMessage(phone, response);
        return;
      }

      const intent = await this.intentService.parseIntent(messageText);
      this.logger.log(
        `Buyer Intent: ${intent.functionName} | Params: ${JSON.stringify(intent.params)} | Phone: ${phone}`,
      );

      const response = await this.executeCommand(buyerId, intent);
      await this.sendWhatsAppMessage(phone, response);
    } catch (error) {
      this.logger.error(
        `Error processing buyer message from ${phone}: ${error instanceof Error ? error.message : error}`,
      );
      await this.sendWhatsAppMessage(
        phone,
        "Sorry, I ran into a small issue processing that request. Try sending it again.",
      );
    }
  }

  // =======================================================================
  // Command Router
  // =======================================================================
  private async executeCommand(
    buyerId: string,
    intent: ParsedIntent,
  ): Promise<string> {
    try {
      switch (intent.functionName) {
        case "search_products":
          return this.handleSearchProducts(
            intent.params.query,
            intent.params.location,
            intent.params.quantity,
          );
        case "buy_product":
          return this.handleBuyProduct(
            buyerId,
            intent.params.productId,
            intent.params.quantity,
          );
        case "get_active_orders":
          return this.handleGetActiveOrders(buyerId);
        case "get_order_history":
          return this.handleGetOrderHistory(buyerId);
        case "confirm_delivery":
          return this.handleConfirmDelivery(
            buyerId,
            intent.params.orderReference,
          );
        case "contact_support":
          return "📞 You can contact SwiftTrade Support directly at 0800-SWIFTTRADE or email support@swifttrade.com for any disputes or assistance.";
        case "friendly_fallback":
          return BUYER_FRIENDLY_FALLBACK;
        case "show_menu":
        default:
          return BUYER_MAIN_MENU;
      }
    } catch (error) {
      this.logger.error(
        `Buyer Command error (${intent.functionName}): ${error instanceof Error ? error.message : error}`,
      );
      return "Something went wrong while fulfilling your request. Try again later.";
    }
  }

  // =======================================================================
  // Command Handlers
  // =======================================================================

  /**
   * 🔎 Search Products globally based on AI extracted intent
   */
  private async handleSearchProducts(
    query: string,
    location?: string,
    rawQuantity?: number,
  ): Promise<string> {
    if (!query)
      return "What kind of product are you looking for? e.g. 'I need 50 bags of Dangote Cement'";

    // For safety, fallback quantity
    const quantity = rawQuantity || 1;

    // Use Prisma full text search or simple 'contains' filter
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        name: { contains: query, mode: "insensitive" },
        ...(location && {
          merchantProfile: {
            businessAddress: { contains: location, mode: "insensitive" },
          },
        }),
      },
      include: {
        merchantProfile: true,
      },
      take: 5,
    });

    if (products.length === 0) {
      return `❌ We couldn't find any "${query}"${location ? ` near ${location}` : ""} available right now. Try adjusting your search.`;
    }

    let msg = `🛒 Here are the top items for *"${query}"*:\n\n`;

    products.forEach((p, idx) => {
      msg += `*${idx + 1}. ${p.name}*\n`;
      msg += `🏪 Seller: ${p.merchantProfile?.businessName || "Verified Merchant"}\n`;
      msg += `💰 Price: ${p.pricePerUnitKobo ? this.formatNaira(Number(p.pricePerUnitKobo)) : "Contact for Quote"}\n`;
      msg += `🆔 ID: ${p.id.substring(0, 8)}\n\n`;
    });

    msg += `💡 To buy an item, reply: *"Buy ${products[0].id.substring(0, 8)} ${quantity} units"*`;

    return msg;
  }

  /**
   * 💸 Buy Product (Generate Paystack checkout link using direct order payload)
   * Note: Resolves partial IDs from whatsapp search results
   */
  private async handleBuyProduct(
    buyerId: string,
    partialId: string,
    rawQuantity?: number,
  ): Promise<string> {
    if (!partialId)
      return "Which product ID do you want to buy? E.g. 'Buy ABC12345 50 units'";

    const quantity = rawQuantity || 1;

    // Find product matching full or starting-with ID string
    const products = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM products 
      WHERE id::text LIKE ${partialId + "%"} 
      LIMIT 1
    `;
    const product = products[0];

    if (!product)
      return `❌ Couldn't find a product with ID starting with "${partialId}". Please check the ID and try again.`;

    // To place an order, the user needs a delivery address.
    // Given WhatsApp flows, we would typically collect deliveryAddress via state machine.
    // For V4 MVP simplified flow, we'll generate the order directly with a placeholder,
    // and rely on the frontend checkout screen via a shortlink.
    // BUT since the goal is generating Paystack Links IN WhatsApp: we'll call createDirectOrder and link to it.

    try {
      // In a pure WhatsApp flow, we intercept here and text them the Web UI Checkout Link.
      // E.g 'Click here to fetch accurate delivery bounds and pay securely'
      const appUrl =
        this.configService.get("FRONTEND_URL") || "https://app.swifttrade.com";
      const checkoutLink = `${appUrl}/buyer/checkout/${product.id}`;

      let msg = `✅ Great choice! Let's get your order for *${product.name}* started.\n\n`;
      msg += `*Quantity*: ${quantity} ${product.unit}(s)\n`;
      msg += `*Expected Price*: ${this.formatNaira(Number(product.pricePerUnitKobo || 0) * quantity)}\n\n`;
      msg += `💳 *Tap the secure link below to enter your address and pay with Paystack/Escrow:*\n`;
      msg += `${checkoutLink}`;

      return msg;
    } catch (e) {
      this.logger.error("Checkout issue", e);
      return "Unable to start the checkout at this time.";
    }
  }

  /**
   * 🚚 Get currently active orders
   */
  private async handleGetActiveOrders(buyerId: string): Promise<string> {
    const orders = await this.prisma.order.findMany({
      where: {
        buyerId,
        status: {
          notIn: [
            OrderStatus.DELIVERED,
            OrderStatus.COMPLETED,
            OrderStatus.CANCELLED,
          ],
        },
      },
      include: { product: true },
    });

    if (orders.length === 0)
      return "You don't have any active deliveries right now.";

    let msg = `🚚 *Your Active Orders:*\n\n`;
    orders.forEach((o) => {
      msg += `*Order #${o.id.substring(0, 8)}*\n`;
      msg += `📦 Item: ${o.product?.name}\n`;
      msg += `📊 Status: *${o.status.replace(/_/g, " ")}*\n`;
      msg += `💰 Total: ${this.formatNaira(Number(o.totalAmountKobo) + Number(o.deliveryFeeKobo))}\n`;

      if (o.status === OrderStatus.DISPATCHED) {
        msg += `🔑 Delivery OTP: *${o.deliveryOtp}*\n`;
      }
      msg += `\n`;
    });

    return msg;
  }

  private async handleGetOrderHistory(buyerId: string): Promise<string> {
    const orders = await this.prisma.order.findMany({
      where: {
        buyerId,
        status: { in: [OrderStatus.DELIVERED, OrderStatus.COMPLETED] },
      },
      include: { product: true },
      take: 5,
      orderBy: { createdAt: "desc" },
    });

    if (orders.length === 0) return "You haven't completed any orders yet!";

    let msg = `📜 *Your Last 5 Orders:*\n\n`;
    orders.forEach((o) => {
      msg += `*#${o.id.substring(0, 8)}* — ${o.product?.name}\n`;
      msg += `Status: ${o.status} | Total: ${this.formatNaira(Number(o.totalAmountKobo))}\n\n`;
    });

    return msg;
  }

  private async handleConfirmDelivery(
    buyerId: string,
    orderRef?: string,
  ): Promise<string> {
    if (!orderRef)
      return `To confirm an order, reply with "Confirm delivery for [Order ID]"`;

    const orders = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM orders 
      WHERE buyer_id = ${buyerId}::uuid 
        AND id::text LIKE ${orderRef + "%"} 
        AND status = 'DISPATCHED' 
      LIMIT 1
    `;
    const order = orders[0];

    if (!order)
      return `❌ I couldn't find a dispatched order matching "${orderRef}".`;

    return `🚚 To confirm delivery for *${order.id.substring(0, 8)}*, please provide your 6-digit Delivery OTP (or enter it in your web dashboard).`;
  }

  // =======================================================================
  // Output utilities
  // =======================================================================
  private formatNaira(kobo: number): string {
    const naira = kobo / 100;
    return `₦${naira.toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }

  async sendWhatsAppMessage(phone: string, text: string): Promise<void> {
    const url = `https://graph.facebook.com/v22.0/${this.phoneNumberId}/messages`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phone,
          type: "text",
          text: { body: text },
        }),
      });
      if (!response.ok)
        this.logger.error(`Meta API error: ${await response.text()}`);
    } catch (error) {
      this.logger.error("Failed to send WhatsApp message", error);
    }
  }
}
