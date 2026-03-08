import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import { OrderService } from "../order/order.service";
import { ProductService } from "../product/product.service";
import { WhatsAppBuyerAuthService } from "./whatsapp-buyer-auth.service";
import { WhatsAppBuyerIntentService } from "./whatsapp-buyer-intent.service";
import { ParsedIntent } from "./whatsapp-intent.service";
import { RedisService } from "../../redis/redis.service";
import {
  BUYER_MAIN_MENU,
  BUYER_FRIENDLY_FALLBACK,
} from "./whatsapp-buyer.constants";
import { OrderStatus } from "@hardware-os/shared";

const PENDING_OTP_PREFIX = "wa_pending_otp_";
const PENDING_OTP_TTL = 600; // 10 minutes

// Helper to mask phone numbers — only show last 4 digits
function maskPhone(phone: string): string {
  if (phone.length <= 4) return "****";
  return `****${phone.slice(-4)}`;
}

// Helper to get order item name from either product or supplierProduct
function getOrderItemName(order: any): string {
  return order.product?.name ?? order.supplierProduct?.name ?? "Unknown Item";
}

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
      const buyerId = await this.authService.resolvePhone(phone);

      if (!buyerId) {
        this.logger.error(
          `Buyer link not found for phone ${phone} during processMessage`,
        );
        return;
      }

      // 1. Check for pending checkout flow (interactive state)
      const checkoutKey = `wa_pending_checkout_${buyerId}`;
      const checkoutSessionRaw = await this.redisService.get(checkoutKey);
      if (checkoutSessionRaw) {
        try {
          const session = JSON.parse(checkoutSessionRaw);
          const response = await this.handleCheckoutStep(
            buyerId,
            session,
            messageText,
            checkoutKey,
          );
          await this.sendWhatsAppMessage(phone, response);
          return;
        } catch (parseErr) {
          this.logger.error(`Malformed checkout session for ${buyerId}`);
          await this.redisService.del(checkoutKey);
        }
      }

      // 2. Check for pending OTP confirmation (delivery completion)
      const pendingOtpKey = `${PENDING_OTP_PREFIX}${buyerId}`;
      const pendingSession = await this.redisService.get(pendingOtpKey);
      if (pendingSession) {
        try {
          const pending = JSON.parse(pendingSession);
          const text = messageText.trim().replace(/\s/g, "");
          if (/^\d{6}$/.test(text)) {
            const response = await this.handleOtpConfirmation(
              buyerId,
              pending.orderId,
              text,
              pendingOtpKey,
            );
            await this.sendWhatsAppMessage(phone, response);
            return;
          }
        } catch (parseErr) {
          this.logger.error(`Malformed pending OTP session for ${buyerId}`);
          await this.redisService.del(pendingOtpKey);
        }
      }

      const intent = await this.intentService.parseIntent(messageText);

      // B1: Scrubbed log — mask phone, only log intent function name + param keys (not values)
      this.logger.debug(
        `Buyer intent parsed | phone=${maskPhone(phone)} | fn=${intent.functionName} | paramKeys=${Object.keys(intent.params ?? {}).join(",")}`,
      );

      const response = await this.executeCommand(buyerId, intent);
      await this.sendWhatsAppMessage(phone, response);
    } catch (error) {
      // B1: Mask phone in error logs too
      this.logger.error(
        `Error processing buyer message from ${maskPhone(phone)}: ${error instanceof Error ? error.message : error}`,
      );
      await this.sendWhatsAppMessage(
        phone,
        "Sorry, I ran into a small issue processing that request. Try sending it again.",
      );
    }
  }

  // =======================================================================
  // Checkout Multi-step Flow
  // =======================================================================
  private async handleCheckoutStep(
    buyerId: string,
    session: any,
    text: string,
    key: string,
  ): Promise<string> {
    const input = text.trim();

    if (session.step === "SELECT_DELIVERY") {
      if (input === "1") {
        session.deliveryMethod = "MERCHANT_DELIVERY";
      } else if (input === "2") {
        session.deliveryMethod = "PLATFORM_LOGISTICS";
      } else {
        return "Please reply with 1️⃣ or 2️⃣ to select your delivery method.";
      }

      // Complete checkout - generate final instructions
      await this.redisService.del(key);
      const appUrl =
        this.configService.get("FRONTEND_URL") || "https://swifttrade.com";
      const checkoutLink = `${appUrl}/buyer/checkout/${session.productId}?qty=${session.quantity}&delivery=${session.deliveryMethod}`;

      let msg = `✅ *Delivery Method confirmed!*\n\n`;
      msg += `*Delivery*: ${session.deliveryMethod === "MERCHANT_DELIVERY" ? "Merchant" : "SwiftTrade"}\n\n`;
      msg += `💳 *Tap the link below to complete your order and pay:*\n`;
      msg += checkoutLink;

      return msg;
    }

    return BUYER_MAIN_MENU;
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

    const quantity = rawQuantity || 1;

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
   * 💸 Buy Product (Generate Paystack checkout link)
   */
  private async handleBuyProduct(
    buyerId: string,
    partialId: string,
    rawQuantity?: number,
  ): Promise<string> {
    if (!partialId)
      return "Which product ID do you want to buy? E.g. 'Buy ABC12345 50 units'";

    const quantity = rawQuantity || 1;

    // B2: Alias snake_case columns to camelCase explicitly
    const products = await this.prisma.$queryRaw<any[]>`
      SELECT 
        id, 
        name, 
        unit,
        price_per_unit_kobo AS "pricePerUnitKobo",
        COALESCE(price_per_unit_kobo, 0) AS "pricePerUnitKobo"
      FROM products 
      WHERE id::text LIKE ${partialId + "%"}
        AND is_active = true
      LIMIT 1
    `;
    const product = products[0];

    if (!product)
      return `❌ Couldn't find a product with ID starting with "${partialId}". Please check the ID and try again.`;

    try {
      // Initiate multi-step checkout session
      const checkoutKey = `wa_pending_checkout_${buyerId}`;
      const session = {
        productId: product.id,
        quantity,
        totalAmountKobo: BigInt(
          Number(product.pricePerUnitKobo || 0) * quantity,
        ).toString(), // Store as string for JSON
        step: "SELECT_DELIVERY",
      };
      await this.redisService.set(checkoutKey, JSON.stringify(session), 3600);

      let msg = `✅ Order started for *${product.name}* (${quantity} units).\n\n`;
      msg += `How would you like this delivered?\n\n`;
      msg += `1️⃣ *Merchant Delivery* (Free)\n`;
      msg += `2️⃣ *SwiftTrade Tracked Delivery*`;

      return msg;
    } catch (e) {
      this.logger.error("Checkout session issue", e);
      return "Unable to start the checkout at this time.";
    }
  }

  /**
   * 🚚 Get currently active orders — B3: include supplierProduct
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
      include: { product: true, supplierProduct: true },
    });

    if (orders.length === 0)
      return "You don't have any active deliveries right now.";

    let msg = `🚚 *Your Active Orders:*\n\n`;
    orders.forEach((o) => {
      msg += `*Order #${o.id.substring(0, 8)}*\n`;
      msg += `📦 Item: ${getOrderItemName(o)}\n`;
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
      include: { product: true, supplierProduct: true },
      take: 5,
      orderBy: { createdAt: "desc" },
    });

    if (orders.length === 0) return "You haven't completed any orders yet!";

    let msg = `📜 *Your Last 5 Orders:*\n\n`;
    orders.forEach((o) => {
      msg += `*#${o.id.substring(0, 8)}* — ${getOrderItemName(o)}\n`;
      msg += `Status: ${o.status} | Total: ${this.formatNaira(Number(o.totalAmountKobo))}\n\n`;
    });

    return msg;
  }

  /**
   * B4: Confirm Delivery — now persists pending OTP session, uses aliased SQL
   */
  private async handleConfirmDelivery(
    buyerId: string,
    orderRef?: string,
  ): Promise<string> {
    if (!orderRef)
      return `To confirm an order, reply with "Confirm delivery for [Order ID]"`;

    // B2: Alias snake_case columns to camelCase
    const orders = await this.prisma.$queryRaw<any[]>`
      SELECT 
        id, 
        delivery_otp AS "deliveryOtp",
        status
      FROM orders 
      WHERE buyer_id = ${buyerId}::uuid 
        AND id::text LIKE ${orderRef + "%"} 
        AND status = 'DISPATCHED' 
      LIMIT 1
    `;
    const order = orders[0];

    if (!order)
      return `❌ I couldn't find a dispatched order matching "${orderRef}".`;

    // B4: Persist pending OTP session so subsequent 6-digit reply can be matched
    const pendingOtpKey = `${PENDING_OTP_PREFIX}${buyerId}`;
    await this.redisService.set(
      pendingOtpKey,
      JSON.stringify({ orderId: order.id, createdAt: Date.now() }),
      PENDING_OTP_TTL,
    );

    return `🚚 To confirm delivery for *Order #${order.id.substring(0, 8)}*, please reply with your 6-digit Delivery OTP. This code was included in your order confirmation. It will expire in 10 minutes.`;
  }

  /**
   * B4: Handle incoming OTP from buyer — called when a pending confirmation session exists
   */
  private async handleOtpConfirmation(
    buyerId: string,
    orderId: string,
    otp: string,
    pendingOtpKey: string,
  ): Promise<string> {
    try {
      // Delegate to OrderService for actual OTP verification and status transition
      await this.orderService.confirmDelivery(buyerId, orderId, otp);

      // Clear session on success
      await this.redisService.del(pendingOtpKey);

      return `✅ *Delivery Confirmed!* Your order has been marked as delivered and the merchant will receive payment. Thank you for using SwiftTrade! 🎉`;
    } catch (error: any) {
      this.logger.warn(
        `OTP confirmation failed for order ${orderId}: ${error.message}`,
      );

      // Clear session on failure to prevent replay
      await this.redisService.del(pendingOtpKey);

      return `❌ Invalid or expired OTP. Please check your code and try again. If you have issues, open a dispute via the web app or contact support.`;
    }
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
