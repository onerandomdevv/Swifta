import { Injectable, Logger, Inject, forwardRef } from "@nestjs/common";
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
import { ReviewService } from "../review/review.service";
import { WhatsAppInteractiveService } from "./whatsapp-interactive.service";

const PENDING_OTP_PREFIX = "wa_pending_otp_";
const PENDING_REVIEW_PREFIX = "wa_pending_review_";
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
    @Inject(forwardRef(() => OrderService))
    private orderService: OrderService,
    private productService: ProductService,
    private authService: WhatsAppBuyerAuthService,
    private intentService: WhatsAppBuyerIntentService,
    private redisService: RedisService,
    @Inject(forwardRef(() => ReviewService))
    private reviewService: ReviewService,
    private interactiveService: WhatsAppInteractiveService,
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
    interactiveReply?: { type: string; id: string; title: string },
  ): Promise<void> {
    try {
      const buyerId = await this.authService.resolvePhone(phone);

      if (!buyerId) {
        this.logger.error(
          `Buyer link not found for phone ${maskPhone(phone)} during processMessage`,
        );
        return;
      }

      // 1. Check for pending OTP confirmation (delivery completion)
      const pendingOtpKey = `${PENDING_OTP_PREFIX}${buyerId}`;
      const pendingSessionRaw = await this.redisService.get(pendingOtpKey);
      let pendingOtpSession: any = null;

      if (pendingSessionRaw) {
        try {
          pendingOtpSession = JSON.parse(pendingSessionRaw);
        } catch (parseErr) {
          this.logger.error(`Malformed pending OTP session for ${buyerId}`);
          await this.redisService.del(pendingOtpKey);
        }
      }

      const cleanText = messageText.trim().replace(/\s/g, "");
      if (pendingOtpSession && /^\d{6}$/.test(cleanText)) {
        const response = await this.handleOtpConfirmation(
          buyerId,
          pendingOtpSession.orderId,
          cleanText,
          pendingOtpKey,
        );
        await this.sendWhatsAppMessage(phone, response);
        return;
      }

      // 2. Check for pending checkout flow (interactive state)
      const checkoutKey = `wa_pending_checkout_${buyerId}`;
      const checkoutSessionRaw = await this.redisService.get(checkoutKey);
      let checkoutSession: any = null;

      if (checkoutSessionRaw) {
        try {
          checkoutSession = JSON.parse(checkoutSessionRaw);
        } catch (parseErr) {
          this.logger.error(`Malformed checkout session for ${buyerId}`);
          await this.redisService.del(checkoutKey);
        }
      }

      if (checkoutSession) {
        await this.handleCheckoutStep(
          buyerId,
          checkoutSession,
          messageText,
          checkoutKey,
        );
        return;
      }

      // 3. Check for pending review session (text comments)
      // Note: We need to find if there's an active review session for ANY order for this buyer
      // Better: In a real system, we might query Redis for keys matching `${PENDING_REVIEW_PREFIX}${buyerId}:*`
      // For simplicity, we'll try to get the most recent one if available or use a pointer
      const reviewSessionPointer = await this.redisService.get(
        `review_pointer:${buyerId}`,
      );
      if (reviewSessionPointer && messageText && !interactiveReply) {
        const reviewKey = `${PENDING_REVIEW_PREFIX}${buyerId}:${reviewSessionPointer}`;
        const reviewSessionRaw = await this.redisService.get(reviewKey);

        if (reviewSessionRaw) {
          const session = JSON.parse(reviewSessionRaw);
          if (session.step === "COMMENT_PROMPT") {
            await this.reviewService.updateComment(
              session.orderId,
              messageText,
            );
            await this.redisService.del(reviewKey);
            await this.redisService.del(`review_pointer:${buyerId}`);
            await this.interactiveService.sendTextMessage(
              phone,
              "✅ Comment added! Thank you for your feedback.",
            );
            return;
          }
        }
      }

      // 4. Handle general interactive replies
      if (interactiveReply) {
        await this.handleInteractiveReply(buyerId, phone, interactiveReply);
        return;
      }

      const intent = await this.intentService.parseIntent(messageText);

      // B1: Scrubbed log — mask phone, only log intent function name + param keys (not values)
      this.logger.debug(
        `Buyer intent parsed | phone=${maskPhone(phone)} | fn=${intent.functionName} | paramKeys=${Object.keys(intent.params ?? {}).join(",")}`,
      );

      await this.executeCommand(buyerId, phone, intent);
    } catch (error) {
      // B1: Mask phone in error logs too
      this.logger.error(
        `Error processing buyer message from ${maskPhone(phone)}: ${error instanceof Error ? error.message : error}`,
      );
      await this.interactiveService.sendTextMessage(
        phone,
        "Sorry, I ran into a small issue processing that request. Try sending it again.",
      );
    }
  }

  /**
   * Central handler for interactive replies
   */
  private async handleInteractiveReply(
    buyerId: string,
    phone: string,
    reply: { id: string; title: string },
  ): Promise<void> {
    const { id } = reply;

    // Delivery selection
    if (id === "delivery_merchant" || id === "delivery_track") {
      const checkoutKey = `wa_pending_checkout_${buyerId}`;
      const checkoutSessionRaw = await this.redisService.get(checkoutKey);
      if (!checkoutSessionRaw) {
        await this.interactiveService.sendTextMessage(
          phone,
          "Your checkout session has expired. Please search for the product again.",
        );
        return;
      }

      const session = JSON.parse(checkoutSessionRaw);
      session.deliveryMethod =
        id === "delivery_merchant" ? "MERCHANT_DELIVERY" : "PLATFORM_LOGISTICS";

      await this.redisService.del(checkoutKey);

      const appUrl =
        this.configService.get("FRONTEND_URL") || "https://swifta.store";
      const checkoutLink = `${appUrl}/buyer/checkout/${session.productId}?qty=${session.quantity}&delivery=${session.deliveryMethod}`;

      await this.interactiveService.sendCTAUrlButton(
        phone,
        `✅ *Delivery method confirmed: ${session.deliveryMethod === "MERCHANT_DELIVERY" ? "Merchant Delivery" : "SwiftTrade Tracked"}*\n\nPlease tap the button below to complete your payment securely.`,
        "Pay Now",
        checkoutLink,
      );
      return;
    }

    // Rating buttons
    if (id.startsWith("rate_")) {
      const parts = id.split("_");
      const rating = parseInt(parts[1]);
      const orderId = parts[2];
      const reviewKey = `${PENDING_REVIEW_PREFIX}${buyerId}:${orderId}`;
      const sessionRaw = await this.redisService.get(reviewKey);
      if (sessionRaw) {
        // Set a pointer so we know which order the next text message belongs to
        await this.redisService.set(`review_pointer:${buyerId}`, orderId, 600);
        await this.handleReviewRating(
          buyerId,
          JSON.parse(sessionRaw),
          rating,
          reviewKey,
          phone,
        );
      }
      return;
    }

    if (id.startsWith("review_add_comment_")) {
      const orderId = id.replace("review_add_comment_", "");
      await this.redisService.set(`review_pointer:${buyerId}`, orderId, 600);
      await this.interactiveService.sendTextMessage(
        phone,
        "Please type your comment below and send it to me. ✍️",
      );
      return;
    }

    if (id.startsWith("review_skip_")) {
      const orderId = id.replace("review_skip_", "");
      await this.redisService.del(
        `${PENDING_REVIEW_PREFIX}${buyerId}:${orderId}`,
      );
      await this.redisService.del(`review_pointer:${buyerId}`);
      await this.interactiveService.sendTextMessage(
        phone,
        "Thank you! Your rating has been saved. ✅",
      );
      return;
    }

    // Menu actions
    if (id === "search_products") {
      await this.interactiveService.sendTextMessage(
        phone,
        "What are you looking for? (e.g., '50 bags of cement')",
      );
      return;
    }

    if (id === "get_active_orders") {
      await this.handleGetActiveOrders(buyerId, phone);
      return;
    }

    if (id === "get_order_history") {
      await this.handleGetOrderHistory(buyerId, phone);
      return;
    }

    if (id === "confirm_delivery_prompt") {
      await this.interactiveService.sendTextMessage(
        phone,
        'Please enter: *"Confirm delivery for [Order ID]"*',
      );
      return;
    }

    if (id === "browse_categories") {
      await this.handleBrowseCategories(phone);
      return;
    }

    if (id === "buy_now") {
      await this.interactiveService.sendTextMessage(
        phone,
        'Please type: *"Buy [Product ID] [Quantity]"*',
      );
      return;
    }

    if (id.startsWith("buy_")) {
      const parts = id.split("_");
      const productIdShort = parts[1];
      const quantity = parseInt(parts[2]) || 1;

      const product = await this.prisma.product.findFirst({
        where: { id: { startsWith: productIdShort } as any },
      });

      if (product) {
        await this.handleBuyProduct(buyerId, phone, product.id, quantity);
      }
      return;
    }

    if (id.startsWith("track_")) {
      const orderIdShort = id.replace("track_", "");
      await this.handleTrackOrder(buyerId, orderIdShort, phone);
      return;
    }

    if (id.startsWith("hist_")) {
      const orderIdShort = id.replace("hist_", "");
      await this.handleShowOrderHistory(buyerId, orderIdShort, phone);
      return;
    }

    if (id.startsWith("cat_")) {
      const categoryId = id.replace("cat_", "");
      await this.handleBrowseCategory(buyerId, phone, categoryId);
      return;
    }

    if (id === "show_buyer_menu") {
      await this.sendBuyerMenu(phone);
      return;
    }
  }

  private async sendBuyerMenu(phone: string): Promise<void> {
    await this.interactiveService.sendListMessage(
      phone,
      BUYER_MAIN_MENU,
      "Select Action",
      [
        {
          title: "Shopping",
          rows: [
            {
              id: "search_products",
              title: "Search Products",
              description: "Find materials and items",
            },
            {
              id: "browse_categories",
              title: "Browse Categories",
              description: "View by product type",
            },
          ],
        },
        {
          title: "My Orders",
          rows: [
            {
              id: "get_active_orders",
              title: "Active Orders",
              description: "Track your current deliveries",
            },
            {
              id: "confirm_delivery_prompt",
              title: "Confirm Delivery",
              description: "Mark order as received",
            },
            {
              id: "get_order_history",
              title: "Order History",
              description: "Review past purchases",
            },
          ],
        },
      ],
    );
  }

  // =======================================================================
  // Checkout Multi-step Flow
  // =======================================================================
  private async handleCheckoutStep(
    buyerId: string,
    session: any,
    text: string,
    key: string,
  ): Promise<void> {
    // This is now mostly handled by handleInteractiveReply for SELECT_DELIVERY
    // but we keep it here for text-based fallbacks if needed.
    const input = text.trim();

    if (session.step === "SELECT_DELIVERY") {
      if (input === "1" || input.toLowerCase().includes("merchant")) {
        session.deliveryMethod = "MERCHANT_DELIVERY";
      } else if (input === "2" || input.toLowerCase().includes("swifttrade")) {
        session.deliveryMethod = "PLATFORM_LOGISTICS";
      } else {
        await this.interactiveService.sendReplyButtons(
          session.phone,
          "Please select your delivery method:",
          [
            { id: "delivery_merchant", title: "Merchant Delivery" },
            { id: "delivery_track", title: "Tracked Delivery" },
          ],
        );
        return;
      }

      await this.redisService.del(key);
      const appUrl =
        this.configService.get("FRONTEND_URL") || "https://swifta.store";
      const checkoutLink = `${appUrl}/buyer/checkout/${session.productId}?qty=${session.quantity}&delivery=${session.deliveryMethod}`;

      await this.interactiveService.sendCTAUrlButton(
        session.phone,
        `✅ *Delivery confirmed.*\n\nTap below to pay securely.`,
        "Pay Now",
        checkoutLink,
      );
      return;
    }

    await this.redisService.del(key);
    await this.sendBuyerMenu(session.phone);
  }

  // =======================================================================
  // Command Router
  // =======================================================================
  private async executeCommand(
    buyerId: string,
    phone: string,
    intent: ParsedIntent,
  ): Promise<void> {
    try {
      switch (intent.functionName) {
        case "search_products":
          await this.handleSearchProducts(
            phone,
            intent.params.query,
            intent.params.location,
            intent.params.quantity,
          );
          break;
        case "browse_categories":
          await this.handleBrowseCategories(phone);
          break;
        case "buy_product":
          await this.handleBuyProduct(
            buyerId,
            phone,
            intent.params.productId,
            intent.params.quantity,
          );
          break;
        case "get_active_orders":
          await this.handleGetActiveOrders(buyerId, phone);
          break;
        case "get_order_history":
          await this.handleGetOrderHistory(buyerId, phone);
          break;
        case "confirm_delivery":
          await this.handleConfirmDelivery(
            buyerId,
            phone,
            intent.params.orderReference,
          );
          break;
        case "contact_support":
          await this.interactiveService.sendTextMessage(
            phone,
            "📞 You can contact SwiftTrade Support directly at 0800-SWIFTTRADE or email support@swifta.store for any disputes or assistance.",
          );
          break;
        case "friendly_fallback":
          await this.interactiveService.sendTextMessage(
            phone,
            BUYER_FRIENDLY_FALLBACK,
          );
          break;
        case "show_menu":
        default:
          await this.sendBuyerMenu(phone);
          break;
      }
    } catch (error) {
      this.logger.error(
        `Buyer Command error (${intent.functionName}): ${error instanceof Error ? error.message : error}`,
      );
      await this.interactiveService.sendTextMessage(
        phone,
        "Something went wrong while fulfilling your request. Try again later.",
      );
    }
  }

  // =======================================================================
  // Command Handlers
  // =======================================================================

  /**
   * 🔎 Search Products globally based on AI extracted intent
   */
  private async handleSearchProducts(
    phone: string,
    query: string,
    location?: string,
    rawQuantity?: number,
  ): Promise<void> {
    const buyerId = await this.authService.resolvePhone(phone);
    const profile = await this.prisma.buyerProfile.findUnique({
      where: { userId: buyerId || "" },
    });
    const isConsumer = profile?.buyerType === "CONSUMER";

    if (!query) {
      await this.interactiveService.sendTextMessage(
        phone,
        "What kind of product are you looking for? e.g. 'I need 50 bags of cement'",
      );
      return;
    }

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
        category: true,
      },
      take: 10,
    });

    if (products.length === 0) {
      await this.interactiveService.sendListMessage(
        phone,
        `❌ No results for *"${query}"*${location ? ` near ${location}` : ""}.`,
        "More Options",
        [
          {
            title: "Try something else",
            rows: [
              {
                id: "browse_categories",
                title: "Browse Categories",
                description: "Explore by product type",
              },
              {
                id: "search_products",
                title: "Try New Search",
                description: "Search for a different item",
              },
              {
                id: "show_buyer_menu",
                title: "Main Menu",
                description: "Return to home",
              },
            ],
          },
        ],
      );
      return;
    }

    await this.interactiveService.sendListMessage(
      phone,
      `🛒 Search results for *"${query}"*:`,
      "View Results",
      [
        {
          title: "Top Matches",
          rows: products.map((p) => {
            const rating = p.merchantProfile?.averageRating || 0;
            const starStr =
              rating > 0
                ? ` ⭐${rating.toFixed(1)} (${p.merchantProfile?.reviewCount || 0})`
                : "";
            return {
              id: `buy_${p.id.substring(0, 8)}_${quantity}`,
              title: p.name,
              description: `${p.category?.name || "General"} | ${this.formatNaira(Number(isConsumer && (p as any).retailPriceKobo ? (p as any).retailPriceKobo : (p as any).pricePerUnitKobo || 0))}${starStr} | Seller: ${p.merchantProfile?.businessName || "Verified"}`,
            };
          }),
        },
      ],
    );
  }

  /**
   * 📂 Browse Categories
   */
  private async handleBrowseCategories(phone: string): Promise<void> {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      take: 10,
    });

    if (categories.length === 0) {
      await this.interactiveService.sendListMessage(
        phone,
        "No categories found. What would you like to do?",
        "More Options",
        [
          {
            title: "Try something else",
            rows: [
              {
                id: "search_products",
                title: "Search Products",
                description: "Search for materials",
              },
              {
                id: "show_buyer_menu",
                title: "Main Menu",
                description: "Return to home",
              },
            ],
          },
        ],
      );
      return;
    }

    await this.interactiveService.sendListMessage(
      phone,
      "📂 *Browse by Category*\n\nExplore our marketplace by selecting a category below:",
      "Select Category",
      [
        {
          title: "Popular Categories",
          rows: categories.map((c) => ({
            id: `cat_${c.name.replace(/\s/g, "_")}`,
            title: c.name,
          })),
        },
      ],
    );
  }

  /**
   * 💸 Buy Product (Generate Paystack checkout link)
   */
  private async handleBuyProduct(
    buyerId: string,
    phone: string,
    partialId: string,
    rawQuantity?: number,
  ): Promise<void> {
    if (!partialId) {
      await this.interactiveService.sendTextMessage(
        phone,
        "Which product ID do you want to buy? E.g. 'Buy ABC12345 50 units'",
      );
      return;
    }

    const quantity = rawQuantity || 1;

    const products = await this.prisma.$queryRaw<any[]>`
      SELECT 
        id, 
        name, 
        unit,
        price_per_unit_kobo AS "pricePerUnitKobo",
        retail_price_kobo AS "retailPriceKobo"
      FROM products 
      WHERE id::text LIKE ${partialId + "%"}
        AND is_active = true
      LIMIT 1
    `;
    const product = products[0];

    if (!product) {
      await this.interactiveService.sendTextMessage(
        phone,
        `❌ Product ID "${partialId}" not found.`,
      );
      return;
    }

    // Resolve buyer type to determine price
    const profile = await this.prisma.buyerProfile.findUnique({
      where: { userId: buyerId || "" },
    });
    const isConsumer = profile?.buyerType === "CONSUMER";
    const unitPriceKobo =
      isConsumer && (product as any).retailPriceKobo
        ? (product as any).retailPriceKobo
        : (product as any).pricePerUnitKobo || 0;

    try {
      const checkoutKey = `wa_pending_checkout_${buyerId}`;
      const session = {
        productId: product.id,
        quantity,
        phone, // Keep phone for fallback
        totalAmountKobo: BigInt(Number(unitPriceKobo) * quantity).toString(),
        step: "SELECT_DELIVERY",
      };
      await this.redisService.set(checkoutKey, JSON.stringify(session), 3600);

      await this.interactiveService.sendReplyButtons(
        phone,
        `🛒 *${product.name}* (${quantity} units)\n\nHow would you like this delivered?`,
        [
          { id: "delivery_merchant", title: "Merchant Delivery" },
          { id: "delivery_track", title: "Tracked Delivery" },
        ],
      );
    } catch (e) {
      this.logger.error("Checkout session issue", e);
      await this.interactiveService.sendTextMessage(
        phone,
        "Unable to start the checkout at this time.",
      );
    }
  }

  /**
   * 🚚 Get currently active orders — B3: include supplierProduct
   */
  private async handleGetActiveOrders(
    buyerId: string,
    phone: string,
  ): Promise<void> {
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

    if (orders.length === 0) {
      await this.interactiveService.sendTextMessage(
        phone,
        "You don't have any active deliveries right now.",
      );
      return;
    }

    await this.interactiveService.sendListMessage(
      phone,
      "🚚 *Active Orders*",
      "View Details",
      [
        {
          title: "Track Deliveries",
          rows: orders.map((o) => ({
            id: `track_${o.id.substring(0, 8)}`,
            title: `#${o.id.substring(0, 8).toUpperCase()} | ${o.status.replace(/_/g, " ")}`,
            description: `${getOrderItemName(o)} | OTP: ${o.deliveryOtp || "N/A"}`,
          })),
        },
      ],
    );
  }

  private async handleGetOrderHistory(
    buyerId: string,
    phone: string,
  ): Promise<void> {
    const orders = await this.prisma.order.findMany({
      where: {
        buyerId,
        status: { in: [OrderStatus.DELIVERED, OrderStatus.COMPLETED] },
      },
      include: { product: true, supplierProduct: true },
      take: 5,
      orderBy: { createdAt: "desc" },
    });

    if (orders.length === 0) {
      await this.interactiveService.sendTextMessage(
        phone,
        "You haven't completed any orders yet!",
      );
      return;
    }

    await this.interactiveService.sendListMessage(
      phone,
      "📜 *Order History (Last 5)*",
      "Order Details",
      [
        {
          title: "Previous Purchases",
          rows: orders.map((o) => ({
            id: `hist_${o.id.substring(0, 8)}`,
            title: `#${o.id.substring(0, 8).toUpperCase()} | Delivered`,
            description: `${getOrderItemName(o)} | ${this.formatNaira(Number(o.totalAmountKobo))}`,
          })),
        },
      ],
    );
  }

  /**
   * B4: Confirm Delivery — now persists pending OTP session, uses aliased SQL
   */
  private async handleConfirmDelivery(
    buyerId: string,
    phone: string,
    orderRef?: string,
  ): Promise<void> {
    if (!orderRef || orderRef.length < 3) {
      await this.interactiveService.sendTextMessage(
        phone,
        'Please enter at least 3 characters of the Order ID. E.g. *"Confirm delivery for ABC"*.',
      );
      return;
    }

    const orders = await this.prisma.$queryRaw<any[]>`
      SELECT 
        id, 
        delivery_otp AS "deliveryOtp",
        status
      FROM orders 
      WHERE buyer_id = ${buyerId}::uuid 
        AND id::text LIKE ${orderRef + "%"} 
        AND status IN ('DISPATCHED', 'IN_TRANSIT')
    `;

    if (orders.length === 0) {
      await this.interactiveService.sendTextMessage(
        phone,
        `❌ No active orders found matching *"${orderRef}"*. Please check your order ID and try again.`,
      );
      return;
    }

    if (orders.length > 1) {
      await this.interactiveService.sendTextMessage(
        phone,
        `⚠️ Multiple orders matched *"${orderRef}"*. Please provide a few more characters to identify the exact order.`,
      );
      return;
    }

    const order = orders[0];

    const pendingOtpKey = `${PENDING_OTP_PREFIX}${buyerId}`;
    await this.redisService.set(
      pendingOtpKey,
      JSON.stringify({ orderId: order.id, createdAt: Date.now() }),
      PENDING_OTP_TTL,
    );

    await this.interactiveService.sendTextMessage(
      phone,
      `🚚 To confirm delivery for *Order #${order.id.substring(0, 8).toUpperCase()}*, please reply with your 6-digit Delivery OTP.`,
    );
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
      await this.orderService.confirmDelivery(buyerId, orderId, otp);
      await this.redisService.del(pendingOtpKey);
      return `✅ *Delivery Confirmed!* Your order has been marked as delivered. Payment will now be released to the merchant. Thank you! 🎉`;
    } catch (error: any) {
      this.logger.warn(
        `OTP confirmation failed for order ${orderId}: ${error.message}`,
      );
      await this.redisService.del(pendingOtpKey);
      return `❌ Invalid or expired OTP. Please check your code and try again.`;
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

  async sendWhatsAppReviewPrompt(
    phone: string,
    bodyText: string,
    orderId: string,
  ): Promise<void> {
    const buyerId = await this.authService.resolvePhone(phone);
    if (!buyerId) return;

    // First message: Stars 1-3
    await this.interactiveService.sendReplyButtons(phone, bodyText, [
      { id: `rate_1_${orderId}`, title: "⭐" },
      { id: `rate_2_${orderId}`, title: "⭐⭐" },
      { id: `rate_3_${orderId}`, title: "⭐⭐⭐" },
    ]);

    // Second message: Stars 4-5
    await this.interactiveService.sendReplyButtons(phone, "Or more stars:", [
      { id: `rate_4_${orderId}`, title: "⭐⭐⭐⭐" },
      { id: `rate_5_${orderId}`, title: "⭐⭐⭐⭐⭐" },
    ]);

    // Store pending review session scoped to order
    await this.redisService.set(
      `${PENDING_REVIEW_PREFIX}${buyerId}:${orderId}`,
      JSON.stringify({
        orderId,
        step: "SELECT_RATING",
      }),
      3600,
    );
  }

  private async handleReviewRating(
    buyerId: string,
    session: any,
    rating: number,
    reviewKey: string,
    phone: string,
  ): Promise<string | null> {
    // Initial save (without comment)
    try {
      await this.reviewService.create(buyerId, {
        orderId: session.orderId,
        rating,
      });

      // Update session to allow adding comment
      session.rating = rating;
      session.step = "COMMENT_PROMPT";
      await this.redisService.set(reviewKey, JSON.stringify(session), 3600);

      // Send interactive prompt for comment
      await this.interactiveService.sendReplyButtons(
        phone,
        "✅ Rating saved! Would you like to add a comment about your experience?",
        [
          {
            id: `review_add_comment_${session.orderId}`,
            title: "Yes, add comment",
          },
          { id: `review_skip_${session.orderId}`, title: "No, thanks" },
        ],
      );

      return null; // Handled via interactive service
    } catch (error: any) {
      if (error.message.includes("already been reviewed")) {
        await this.redisService.del(reviewKey);
        return "This order has already been reviewed. Thank you!";
      }
      throw error;
    }
  }
  private async handleTrackOrder(
    buyerId: string,
    orderIdShort: string,
    phone: string,
  ): Promise<void> {
    const orders = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM orders 
      WHERE buyer_id = ${buyerId}::uuid 
      AND id::text LIKE ${orderIdShort + "%"}
      LIMIT 1
    `;
    const order = orders[0];

    if (!order) {
      await this.interactiveService.sendTextMessage(
        phone,
        "❌ Order not found.",
      );
      return;
    }

    // Refresh with includes
    const fullOrder = await this.prisma.order.findUnique({
      where: { id: order.id },
      include: { product: true, supplierProduct: true, merchantProfile: true },
    });

    if (!fullOrder) return;

    let msg = `📦 *Order #${fullOrder.id.substring(0, 8).toUpperCase()} Tracking*\n\n`;
    msg += `Status: *${fullOrder.status.replace(/_/g, " ")}*\n`;
    msg += `Item: ${getOrderItemName(fullOrder)}\n`;
    msg += `Seller: ${fullOrder.merchantProfile?.businessName || "Verified Merchant"}\n`;
    if (fullOrder.deliveryAddress)
      msg += `Address: ${fullOrder.deliveryAddress}\n`;
    if (fullOrder.deliveryOtp) msg += `OTP: *${fullOrder.deliveryOtp}*\n`;

    await this.interactiveService.sendTextMessage(phone, msg);
  }

  private async handleShowOrderHistory(
    buyerId: string,
    orderIdShort: string,
    phone: string,
  ): Promise<void> {
    const orders = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM orders 
      WHERE buyer_id = ${buyerId}::uuid 
      AND id::text LIKE ${orderIdShort + "%"}
      LIMIT 1
    `;
    const order = orders[0];

    if (!order) {
      await this.interactiveService.sendTextMessage(
        phone,
        "❌ Order detail not found.",
      );
      return;
    }

    // Refresh with includes
    const fullOrder = await this.prisma.order.findUnique({
      where: { id: order.id },
      include: { product: true, supplierProduct: true, review: true },
    });

    if (!fullOrder) return;

    let msg = `📜 *Past Order Details*\n\n`;
    msg += `ID: #${fullOrder.id.substring(0, 8).toUpperCase()}\n`;
    msg += `Item: ${getOrderItemName(fullOrder)}\n`;
    msg += `Amount: ${this.formatNaira(Number(fullOrder.totalAmountKobo))}\n`;
    msg += `Date: ${fullOrder.createdAt.toLocaleDateString()}\n\n`;

    if (fullOrder.review) {
      msg += `⭐ Your Rating: ${fullOrder.review.rating}/5\n`;
      if (fullOrder.review.comment)
        msg += `💬 Your Comment: "${fullOrder.review.comment}"`;
    }

    await this.interactiveService.sendTextMessage(phone, msg);
  }

  private async handleBrowseCategory(
    buyerId: string,
    phone: string,
    categoryId: string,
  ): Promise<void> {
    // We expect categoryId to be the name or actual ID
    // Let's first try to find by ID then by slug/name
    const category = await this.prisma.category.findFirst({
      where: {
        OR: [
          { id: categoryId.length === 36 ? categoryId : undefined },
          { name: categoryId.replace(/_/g, " ") },
        ],
      },
    });

    if (!category) {
      await this.interactiveService.sendTextMessage(
        phone,
        "❌ Category not found.",
      );
      return;
    }

    const profile = await this.prisma.buyerProfile.findUnique({
      where: { userId: buyerId || "" },
    });
    const isConsumer = profile?.buyerType === "CONSUMER";

    const products = await this.prisma.product.findMany({
      where: {
        categoryId: category.id,
        isActive: true,
      },
      include: {
        merchantProfile: true,
        category: true,
      },
      take: 10,
    });

    if (products.length === 0) {
      await this.interactiveService.sendListMessage(
        phone,
        `❌ No products found in the *${category.name}* category.`,
        "Continue Options",
        [
          {
            title: "Other Actions",
            rows: [
              {
                id: "browse_categories",
                title: "Browse All Categories",
                description: "See other categories",
              },
              {
                id: "search_products",
                title: "Search Specific Item",
                description: "Search across all categories",
              },
            ],
          },
        ],
      );
      return;
    }

    await this.interactiveService.sendListMessage(
      phone,
      `📂 Products in *${category.name}*:`,
      "View Products",
      [
        {
          title: "Available Items",
          rows: products.map((p) => {
            const rating = p.merchantProfile?.averageRating || 0;
            const starStr =
              rating > 0
                ? ` ⭐${rating.toFixed(1)} (${p.merchantProfile?.reviewCount || 0})`
                : "";
            return {
              id: `buy_${p.id.substring(0, 8)}_1`,
              title: p.name,
              description: `${this.formatNaira(Number(isConsumer && (p as any).retailPriceKobo ? (p as any).retailPriceKobo : (p as any).pricePerUnitKobo || 0))}${starStr} | ${p.merchantProfile?.businessName || "Seller"}`,
            };
          }),
        },
      ],
    );
  }
}
