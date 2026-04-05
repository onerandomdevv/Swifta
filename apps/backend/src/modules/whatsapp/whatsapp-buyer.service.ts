import {
  Injectable,
  Logger,
  Inject,
  forwardRef,
  NotFoundException,
} from "@nestjs/common";
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
import { OrderStatus } from "@twizrr/shared";
import { ReviewService } from "../review/review.service";
import { UploadService } from "../upload/upload.service";
import { ImageSearchService } from "./image-search.service";
import { WhatsAppInteractiveService } from "./whatsapp-interactive.service";
import { DvaService } from "../dva/dva.service";

const PENDING_OTP_PREFIX = "wa_pending_otp_";
const PENDING_REVIEW_PREFIX = "wa_pending_review_";
const PENDING_OTP_TTL = 600; // 10 minutes

// Helper to mask phone numbers — only show last 4 digits
function maskPhone(phone: string): string {
  if (phone.length <= 4) return "****";
  return `****${phone.slice(-4)}`;
}

// Helper to get order item name from product
function getOrderItemName(order: any): string {
  return order.product?.name ?? "Unknown Item";
}

/**
 * Helper to resolve price based on quantity and buyer type
 */
function resolvePrice(
  product: any,
  quantity: number,
  isConsumer: boolean,
): number | null {
  const retail = product.retailPriceKobo
    ? Number(product.retailPriceKobo)
    : null;
  const wholesale = product.wholesalePriceKobo
    ? Number(product.wholesalePriceKobo)
    : null;
  const legacy = product.pricePerUnitKobo
    ? Number(product.pricePerUnitKobo)
    : 0;

  let price: number | null = null;
  if (!isConsumer) {
    price = wholesale ?? legacy;
  } else {
    // Consumer (B2C) can buy retail OR wholesale
    // Use wholesale if quantity meets threshold (default 10) OR if retail is missing
    const threshold = product.minOrderQuantity || 10;
    if (quantity >= threshold && wholesale) {
      price = wholesale;
    } else {
      price = retail ?? wholesale ?? legacy;
    }
  }

  // Final safeguard: Avoid 0 or null prices
  return price && price > 0 ? price : null;
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
    private dvaService: DvaService,
    private uploadService: UploadService,
    private imageSearchService: ImageSearchService,
  ) {
    this.accessToken =
      this.configService.get<string>("whatsapp.accessToken") || "";
    this.phoneNumberId =
      this.configService.get<string>("whatsapp.phoneNumberId") || "";
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
          phone,
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
        // If this is an interactive reply and it's one of the delivery methods, LET IT FALL THROUGH
        // to handleInteractiveReply, which properly processes and clears the checkout state.
        const isAllowedInteraction =
          interactiveReply &&
          ["delivery_merchant", "delivery_track", "support_handoff"].includes(
            interactiveReply.id,
          );

        if (!isAllowedInteraction) {
          await this.handleCheckoutStep(
            buyerId,
            checkoutSession,
            messageText || "",
            checkoutKey,
          );
          return;
        }
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
              "Comment added. ✅ Thank you for your feedback.",
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

      const intent = await this.intentService.parseIntent(messageText || "");

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
        "An error occurred while processing your request. Please try again.",
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

    if (id === "support_handoff") {
      await this.handleSupportHandoff(phone);
      return;
    }

    // Delivery selection
    if (id === "delivery_merchant" || id === "delivery_track") {
      const checkoutKey = `wa_pending_checkout_${buyerId}`;
      const checkoutSessionRaw = await this.redisService.get(checkoutKey);
      if (!checkoutSessionRaw) {
        await this.interactiveService.sendTextMessage(
          phone,
          "Checkout session expired. Please search for the product again.",
        );
        return;
      }

      const session = JSON.parse(checkoutSessionRaw);
      session.deliveryMethod =
        id === "delivery_merchant" ? "MERCHANT_DELIVERY" : "PLATFORM_LOGISTICS";

      await this.redisService.del(checkoutKey);

      const appUrl =
        this.configService.get("FRONTEND_URL") || "https://twizrr.com";
      const checkoutLink = `${appUrl}/buyer/checkout/${session.productId}?qty=${session.quantity}&delivery=${session.deliveryMethod}`;

      const dva = await this.getSafeDva(buyerId);
      if (dva && dva.active && dva.accountNumber) {
        const dvaMsg =
          `💳 *Pay via Bank Transfer (Fastest)*\n\n` +
          `Bank: *${dva.bankName}*\n` +
          `Account: *${dva.accountNumber}*\n` +
          `Name: *${dva.accountName}*\n\n` +
          `Transfer the exact amount to this account. your order will be processed automatically. ✅`;
        await this.interactiveService.sendTextMessage(phone, dvaMsg);
      }

      await this.interactiveService.sendCTAUrlButton(
        phone,
        `Logistics confirmed. ✅\n\n${dva?.active ? "Alternatively, you can " : ""}Tap below to pay securely via card or bank.`,
        "Secure Payment",
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
        "Please type your comment below.",
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
        "Thank you. Your rating has been saved. ✅",
      );
      return;
    }

    // Menu actions
    if (id === "search_merchants") {
      await this.interactiveService.sendTextMessage(
        phone,
        "Who or what kind of shop are you looking for? (e.g., 'Groceries in Lekki' or 'Fashion stores')",
      );
      return;
    }

    if (id === "search_products") {
      await this.interactiveService.sendTextMessage(
        phone,
        "What are you looking for? (e.g., 'iPhone 15' or 'Nike sneakers')",
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

    if (id === "show_full_menu") {
      await this.sendBuyerMenu(phone, "Select an action below to continue:");
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
      const productIdRaw = parts[1];
      const quantity = parseInt(parts[2]) || 1;

      try {
        let product;
        if (productIdRaw.length === 36) {
          product = await this.prisma.product.findUnique({
            where: { id: productIdRaw },
          });
        } else if (productIdRaw.length < 4) {
          await this.interactiveService.sendTextMessage(
            phone,
            "Product code too short. Please provide at least 4 characters of the product code.",
          );
          return;
        } else {
          const productsRaw = await this.prisma.$queryRaw<any[]>`
            SELECT id FROM products 
            WHERE id::text LIKE ${productIdRaw + "%"}
            LIMIT 5
          `;
          if (productsRaw.length > 1) {
            await this.interactiveService.sendTextMessage(
              phone,
              `Multiple products match the code "${productIdRaw}". Please provide a longer code to narrow it down.`,
            );
            return;
          }
          if (productsRaw.length === 1) {
            product = { id: productsRaw[0].id } as any;
          }
        }

        if (product) {
          await this.handleBuyProduct(buyerId, phone, product.id, quantity);
        } else {
          await this.interactiveService.sendTextMessage(
            phone,
            "This product is no longer available. Please search for another item.",
          );
        }
      } catch (err) {
        this.logger.error(
          `Buy interactive handler error: ${err instanceof Error ? err.message : err}`,
        );
        await this.interactiveService.sendTextMessage(
          phone,
          "Something went wrong while loading the product. Please try again.",
        );
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

    if (id.startsWith("merchant_")) {
      const merchantId = id.replace("merchant_", "");
      await this.handleShowMerchant(phone, merchantId);
      return;
    }

    if (id.startsWith("shop_products_")) {
      const merchantId = id.replace("shop_products_", "");
      await this.handleSearchProducts(phone, "", undefined, 1, merchantId);
      return;
    }
  }

  private async sendBuyerMenu(
    phone: string,
    customBody?: string,
  ): Promise<void> {
    const isMerchant = await this.prisma.user.findFirst({
      where: { phone, role: "MERCHANT" },
    });

    const sections = [
      {
        title: "Shopping",
        rows: [
          {
            id: "search_products",
            title: "Search Products",
            description: "Find the best deals and items",
          },
          {
            id: "search_merchants",
            title: "Find Merchants",
            description: "Discover local shops and merchants",
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
      {
        title: "Support",
        rows: [
          {
            id: "support_handoff",
            title: "📞 Need Help?",
            description: "Chat with a human agent",
          },
        ],
      },
    ];

    if (isMerchant) {
      sections.push({
        title: "Account",
        rows: [
          {
            id: "menu_merchant_mode",
            title: "Return to Merchant Mode",
            description: "Manage your own shop",
          },
        ],
      });
    }

    await this.interactiveService.sendListMessage(
      phone,
      customBody || BUYER_MAIN_MENU,
      "Select Action",
      sections,
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
      } else if (input === "2" || input.toLowerCase().includes("twizrr")) {
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
        this.configService.get("FRONTEND_URL") || "https://twizrr.com";
      const checkoutLink = `${appUrl}/buyer/checkout/${session.productId}?qty=${session.quantity}&delivery=${session.deliveryMethod}`;

      const dva = await this.getSafeDva(buyerId);
      if (dva && dva.active && dva.accountNumber) {
        const dvaMsg =
          `💳 *Pay via Bank Transfer (Fastest)*\n\n` +
          `Bank: *${dva.bankName}*\n` +
          `Account: *${dva.accountNumber}*\n` +
          `Name: *${dva.accountName}*\n\n` +
          `Transfer the exact amount to this account. Your order will be processed automatically. ✅`;
        await this.interactiveService.sendTextMessage(session.phone, dvaMsg);
      }

      await this.interactiveService.sendCTAUrlButton(
        session.phone,
        `Delivery confirmed. ✅\n\n${dva?.active ? "Alternatively, you can " : ""}Tap below to pay securely.`,
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
        case "list_merchant_products":
          await this.handleListMerchantProducts(
            phone,
            intent.params.merchantSlug,
            intent.params.query,
          );
          break;
        case "search_merchants":
          await this.handleSearchMerchants(
            phone,
            intent.params.query,
            intent.params.location,
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
        case "show_menu":
          await this.sendBuyerWelcomeButtons(phone);
          break;
        case "support_handoff":
          await this.handleSupportHandoff(phone);
          break;
        case "friendly_fallback":
          await this.sendBuyerMenu(phone, BUYER_FRIENDLY_FALLBACK);
          break;
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
        "An error occurred. Please try again later.",
      );
    }
  }

  // =======================================================================
  // Command Handlers
  // =======================================================================

  private async handleSupportHandoff(phone: string): Promise<void> {
    const pauseKey = `ai_paused_${phone}`;
    await this.redisService.set(pauseKey, "1", 24 * 60 * 60); // 24 hours
    await this.interactiveService.sendTextMessage(
      phone,
      "You are being transferred to a human agent. They will reply to you on this number shortly.\n\nType *'resume'* at any time to reactivate the AI assistant.",
    );
    this.logger.log(`Support Handoff initiated for ${maskPhone(phone)}`);

    // Record in AuditLog for admin visibility
    try {
      const buyerId = await this.authService.resolvePhone(phone);
      if (buyerId) {
        await this.prisma.auditLog.create({
          data: {
            userId: buyerId,
            action: "SUPPORT_HANDOFF",
            targetType: "WHATSAPP_BOT",
            targetId: phone,
            metadata: { status: "AI_PAUSED", phone },
          },
        });
      }
    } catch (err) {
      this.logger.error("Failed to record support handoff in AuditLog", err);
    }
  }

  /**
   * 🔎 Search Products globally based on AI extracted intent
   */
  private async handleSearchProducts(
    phone: string,
    query: string,
    location?: string,
    rawQuantity?: number,
    merchantId?: string,
  ): Promise<void> {
    const buyerId = await this.authService.resolvePhone(phone);
    const profile = buyerId
      ? await this.prisma.buyerProfile.findUnique({
          where: { userId: buyerId },
        })
      : null;
    // For WhatsApp, treat ALL as consumers by default unless explicitly a BUSINESS buyer
    const isConsumer = profile ? profile.buyerType !== "BUSINESS" : true;

    if (!query && !merchantId) {
      await this.interactiveService.sendTextMessage(
        phone,
        "What kind of product are you looking for? e.g. 'I need a new laptop' or 'iPhone 15'",
      );
      return;
    }

    const quantity = rawQuantity || 1;

    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        merchantId,
        AND: [
          query
            ? {
                OR: [
                  { name: { contains: query, mode: "insensitive" } },
                  { description: { contains: query, mode: "insensitive" } },
                  {
                    shortDescription: { contains: query, mode: "insensitive" },
                  },
                ],
              }
            : {},
          location
            ? {
                merchantProfile: {
                  OR: [
                    {
                      businessAddress: {
                        contains: location,
                        mode: "insensitive",
                      },
                    },
                    {
                      warehouseLocation: {
                        contains: location,
                        mode: "insensitive",
                      },
                    },
                  ],
                },
              }
            : {},
        ],
      },
      include: {
        merchantProfile: true,
        category: true,
      },
      take: 10,
    });

    if (products.length === 0) {
      const msg = query
        ? `No results found for "${query}"${location ? ` near ${location}` : ""}. 🛍️\n\nHere are some other popular items you might like:`
        : "This merchant currently has no active products. 🏪\n\nHere are some popular items from other sellers:";

      // Feature 4: Smart "No Results" Fallback
      const fallbackProducts = await this.prisma.product.findMany({
        where: { isActive: true },
        include: { merchantProfile: true, category: true },
        take: 5,
        orderBy: { createdAt: "desc" },
      });

      if (fallbackProducts.length > 0) {
        const validFallbacks = fallbackProducts.filter(
          (p) => resolvePrice(p, quantity, isConsumer) !== null,
        );

        if (validFallbacks.length > 0) {
          const rows = validFallbacks.map((p) => {
            const resolvedPriceKobo = resolvePrice(p, quantity, isConsumer)!;
            return {
              id: `buy_${p.id}_${quantity}`,
              title: p.name.substring(0, 24),
              description:
                `${this.formatNaira(resolvedPriceKobo)} | ${p.merchantProfile?.businessName || "Verified Shop"}`.substring(
                  0,
                  72,
                ),
            };
          });

          await this.interactiveService.sendListMessage(
            phone,
            msg,
            "Alternative Items",
            [
              { title: "Suggested Products", rows },
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
                    title: "New Search",
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
      }

      await this.interactiveService.sendListMessage(
        phone,
        query
          ? `No results for "${query}". 🛍️`
          : "This merchant has no active products. 🏪",
        "Options",
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
                title: "New Search",
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

    const validResults = products.filter(
      (p) => resolvePrice(p, quantity, isConsumer) !== null,
    );

    if (validResults.length === 0) {
      await this.interactiveService.sendTextMessage(
        phone,
        `No products with valid pricing found matching "${query || "this search"}".`,
      );
      return;
    }

    await this.interactiveService.sendListMessage(
      phone,
      query
        ? `Search results for "${query}":`
        : `Products from ${products[0].merchantProfile?.businessName || "this merchant"}:`,
      "View Results",
      [
        {
          title: "Top Matches",
          rows: validResults.map((p) => {
            const rating = p.merchantProfile?.averageRating || 0;
            const starStr =
              rating > 0
                ? ` ⭐${rating.toFixed(1)} (${p.merchantProfile?.reviewCount || 0})`
                : "";
            const resolvedPriceKobo = resolvePrice(p, quantity, isConsumer)!;
            const isWholesale =
              p.wholesalePriceKobo &&
              resolvedPriceKobo === Number(p.wholesalePriceKobo);
            const wholesaleBadge = isWholesale ? " [Wholesale! ✅]" : "";
            const weightStr = p.weightKg ? ` | ${p.weightKg}kg` : "";
            const locationStr = p.warehouseLocation
              ? ` | 📍${p.warehouseLocation}`
              : "";

            const shortDesc = p.shortDescription
              ? `${p.shortDescription} | `
              : "";

            return {
              id: `buy_${p.id}_${quantity}`,
              title: `${p.name}${wholesaleBadge}`.substring(0, 24),
              description:
                `${shortDesc}${this.formatNaira(resolvedPriceKobo)}${weightStr}${locationStr}${starStr}`.substring(
                  0,
                  72,
                ),
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
        "No categories found.",
        "Options",
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
        retail_price_kobo AS \"retailPriceKobo\",
        wholesale_price_kobo AS \"wholesalePriceKobo\",
        image_url AS \"imageUrl\"
      FROM products 
      WHERE id::text LIKE ${partialId + "%"}
        AND is_active = true
      LIMIT 1
    `;
    const product = products[0];

    if (!product) {
      await this.interactiveService.sendTextMessage(
        phone,
        `Product ID "${partialId}" not found.`,
      );
      return;
    }

    // Resolve buyer type to determine price
    const profile = buyerId
      ? await this.prisma.buyerProfile.findUnique({
          where: { userId: buyerId },
        })
      : null;
    const isConsumer = profile ? profile.buyerType !== "BUSINESS" : true;

    const unitPriceKobo = resolvePrice(product, quantity, isConsumer);

    if (unitPriceKobo === null) {
      await this.interactiveService.sendTextMessage(
        phone,
        "This product does not have a valid price listed. Please contact the merchant for pricing.",
      );
      return;
    }

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
        `${product.name} (${quantity} units)\n\nHow would you like this delivered?`,
        [
          { id: "delivery_merchant", title: "Direct Merchant" },
          { id: "delivery_track", title: "twizrr Tracked" },
        ],
        product.imageUrl || undefined,
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
      include: { product: true },
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
      include: { product: true },
      take: 5,
      orderBy: { createdAt: "desc" },
    });

    if (orders.length === 0) {
      await this.interactiveService.sendTextMessage(
        phone,
        "No completed orders yet.",
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
        `No active orders found matching "${orderRef}".`,
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
      `To confirm delivery for Order #${order.id.substring(0, 8).toUpperCase()}, please reply with your 6-digit Delivery OTP.`,
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
    phone: string,
  ): Promise<string> {
    try {
      // 1. Core action: Confirm delivery in DB
      await this.orderService.confirmDelivery(buyerId, orderId, otp);

      // 2. Best-effort cleanup: Remove the pending OTP
      try {
        await this.redisService.del(pendingOtpKey);
      } catch (err) {
        this.logger.error(
          `Failed to delete pendingOtpKey ${pendingOtpKey} after success`,
          err,
        );
      }

      // 3. Best-effort setup: Prepare for photo review
      try {
        const photoKey = `wa_pending_review_photo:${phone}:${orderId}`;
        await this.redisService.set(photoKey, "1", 3600); // 1 hour window
      } catch (err) {
        this.logger.error(
          `Failed to set photoKey for order ${orderId} after success`,
          err,
        );
      }

      return `Delivery confirmed. ✅ Your order has been marked as delivered. Payment will be released to the merchant.\n\n📸 *Optional:* Reply with a photo of the item you received to help other buyers!`;
    } catch (error: any) {
      this.logger.warn(
        `OTP confirmation failed for order ${orderId}: ${error.message}`,
      );

      // Attempt cleanup on failure too, but ignore errors
      try {
        await this.redisService.del(pendingOtpKey);
      } catch (ignore) {}

      return `Invalid or expired OTP. Please check your code and try again.`;
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
      const bufferedImage = await this.redisService.get(
        `wa_order_captured_image:${session.orderId}`,
      );

      await this.reviewService.create(buyerId, {
        orderId: session.orderId,
        rating,
        imageUrl: bufferedImage || undefined,
      });

      if (bufferedImage) {
        await this.redisService.del(
          `wa_order_captured_image:${session.orderId}`,
        );
      }

      // Update session to allow adding comment
      session.rating = rating;
      session.step = "COMMENT_PROMPT";
      await this.redisService.set(reviewKey, JSON.stringify(session), 3600);

      // Send interactive prompt for comment
      await this.interactiveService.sendReplyButtons(
        phone,
        "Rating saved. ✅ Would you like to add a comment about your experience?",
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

  // Feature 3: Rich Media Delivery Reviews
  async handleReviewPhoto(
    phone: string,
    orderId: string,
    imageId: string,
  ): Promise<void> {
    try {
      await this.interactiveService.sendTextMessage(
        phone,
        "Processing your photo...",
      );

      const imageResult =
        await this.imageSearchService.downloadMetaImage(imageId);
      if (!imageResult) {
        await this.interactiveService.sendTextMessage(
          phone,
          "Sorry, I couldn't download the photo. Please try again.",
        );
        return;
      }

      const buffer = Buffer.from(imageResult.base64Data, "base64");
      const file = { buffer, mimetype: imageResult.mimeType } as any;

      const imageUrl = await this.uploadService.uploadImageToCloudinary(
        file,
        "twizrr/reviews",
      );

      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
      });
      if (order && order.merchantId) {
        // Store image in Redis instead of database placeholder
        await this.redisService.set(
          `wa_order_captured_image:${orderId}`,
          imageUrl,
          3600,
        );
      }

      await this.interactiveService.sendTextMessage(
        phone,
        "Amazing! 📸 Your photo has been attached to your review to help other buyers.",
      );
    } catch (error) {
      this.logger.error(
        `Review photo upload failed: ${error instanceof Error ? error.message : error}`,
      );
      await this.interactiveService.sendTextMessage(
        phone,
        "An error occurred while saving your photo.",
      );
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
      await this.interactiveService.sendTextMessage(phone, "Order not found.");
      return;
    }

    // Refresh with includes
    const fullOrder = await this.prisma.order.findUnique({
      where: { id: order.id },
      include: { product: true, merchantProfile: true },
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
        "Order details not found.",
      );
      return;
    }

    // Refresh with includes
    const fullOrder = await this.prisma.order.findUnique({
      where: { id: order.id },
      include: { product: true, review: true },
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
          {
            name: {
              equals: categoryId.replace(/_/g, " "),
              mode: "insensitive",
            },
          },
          {
            slug: {
              equals: categoryId.toLowerCase().replace(/_/g, "-"),
              mode: "insensitive",
            },
          },
        ],
      },
    });

    if (!category) {
      await this.interactiveService.sendTextMessage(
        phone,
        "Category not found.",
      );
      return;
    }

    const profile = buyerId
      ? await this.prisma.buyerProfile.findUnique({
          where: { userId: buyerId },
        })
      : null;
    const isConsumer = profile ? profile.buyerType !== "BUSINESS" : true;

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
        `No products found in ${category.name}.`,
        "Options",
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

    const validCategorized = products.filter(
      (p) => resolvePrice(p, 1, isConsumer) !== null,
    );

    if (validCategorized.length === 0) {
      await this.interactiveService.sendTextMessage(
        phone,
        `No products with valid pricing found in ${category.name}.`,
      );
      return;
    }

    await this.interactiveService.sendListMessage(
      phone,
      `Products in ${category.name}:`,
      "View Products",
      [
        {
          title: "Available Items",
          rows: validCategorized.map((p) => {
            const rating = p.merchantProfile?.averageRating || 0;
            const stars = rating > 0 ? ` ⭐${rating.toFixed(1)}` : "";

            const resolvedPriceKobo = resolvePrice(p, 1, isConsumer)!;
            const isWholesale =
              p.wholesalePriceKobo &&
              resolvedPriceKobo === Number(p.wholesalePriceKobo);
            const wholesaleBadge = isWholesale ? " [Wholesale! ✅]" : "";
            const weightStr = p.weightKg ? ` | ${p.weightKg}kg` : "";
            const locationStr = p.warehouseLocation
              ? ` | 📍${p.warehouseLocation}`
              : "";

            return {
              id: `buy_${p.id}_1`,
              title: `${p.name}${wholesaleBadge}`.substring(0, 24),
              description:
                `${this.formatNaira(resolvedPriceKobo)}${weightStr}${locationStr}${stars} | ${p.merchantProfile?.businessName || "Seller"}`.substring(
                  0,
                  72,
                ),
            };
          }),
        },
      ],
    );
  }

  private async handleSearchMerchants(
    phone: string,
    query?: string,
    location?: string,
  ): Promise<void> {
    if (!query && !location) {
      await this.interactiveService.sendTextMessage(
        phone,
        "Please specify a merchant name or category (e.g., 'Electronics') to search.",
      );
      return;
    }

    const merchants = await this.prisma.merchantProfile.findMany({
      where: {
        AND: [
          { verificationTier: { not: "UNVERIFIED" } },
          query
            ? {
                OR: [
                  { businessName: { contains: query, mode: "insensitive" } },
                  { description: { contains: query, mode: "insensitive" } },
                  { slug: { contains: query, mode: "insensitive" } },
                ],
              }
            : {},
          location
            ? {
                OR: [
                  {
                    businessAddress: {
                      contains: location,
                      mode: "insensitive",
                    },
                  },
                  {
                    warehouseLocation: {
                      contains: location,
                      mode: "insensitive",
                    },
                  },
                ],
              }
            : {},
        ],
      },
      take: 10,
    });

    if (merchants.length === 0) {
      await this.interactiveService.sendTextMessage(
        phone,
        `No merchants found matching "${query || location}". 🏪`,
      );
      return;
    }

    await this.interactiveService.sendListMessage(
      phone,
      `Verified Merchants:`,
      "View Shops",
      [
        {
          title: "Top Matches",
          rows: merchants.map((m) => ({
            id: `merchant_${m.id}`,
            title: m.businessName || "Untitled Shop",
            description: `${m.averageRating && m.averageRating > 0 ? `⭐${m.averageRating.toFixed(1)} | ` : ""}${m.description?.substring(0, 50) || "Verified twizrr Merchant"}`,
          })),
        },
      ],
    );
  }

  private async handleShowMerchant(
    phone: string,
    merchantId: string,
  ): Promise<void> {
    const merchant = await this.prisma.merchantProfile.findUnique({
      where: { id: merchantId },
    });

    if (!merchant) {
      await this.interactiveService.sendTextMessage(
        phone,
        "Merchant not found.",
      );
      return;
    }

    const ratingStr =
      merchant.averageRating && merchant.averageRating > 0
        ? `⭐ ${merchant.averageRating.toFixed(1)} (${merchant.reviewCount} reviews)`
        : "No reviews yet";

    const msg =
      `🏪 *${merchant.businessName}*\n\n` +
      `${merchant.description || "A verified partner on twizrr."}\n\n` +
      `📍 *Location:* ${merchant.businessAddress || "Abuja, Nigeria"}\n` +
      `✨ *Rating:* ${ratingStr}\n\n` +
      `What would you like to do?`;

    await this.interactiveService.sendReplyButtons(phone, msg, [
      { id: `shop_products_${merchantId}`, title: "Browse Their Shop" },
      { id: "show_buyer_menu", title: "Main Menu" },
    ]);
  }

  /**
   * 🏪 List Products from a specific merchant by slug/handle
   */
  private async handleListMerchantProducts(
    phone: string,
    merchantSlug: string,
    query?: string,
  ): Promise<void> {
    if (!merchantSlug) {
      await this.interactiveService.sendTextMessage(
        phone,
        "Please specify a merchant handle (e.g. @businessusername).",
      );
      return;
    }

    const cleanSlug = merchantSlug.trim().replace(/^@/, "").toLowerCase();

    const merchant = await this.prisma.merchantProfile.findFirst({
      where: {
        OR: [
          { slug: { equals: cleanSlug, mode: "insensitive" } },
          { businessName: { contains: cleanSlug, mode: "insensitive" } },
        ],
      },
    });

    if (!merchant) {
      await this.interactiveService.sendTextMessage(
        phone,
        `I couldn't find a merchant or shop matching "${cleanSlug}". 🏪`,
      );
      return;
    }

    // Reuse existing search logic but pinned to this merchant
    await this.handleSearchProducts(
      phone,
      query || "",
      undefined,
      1,
      merchant.id,
    );
  }

  /**
   * 🏠 Registered Buyer Welcome (Reply Buttons) — Scenario 2 fix
   */
  private async sendBuyerWelcomeButtons(phone: string): Promise<void> {
    const welcomeMsg =
      `Welcome back to twizrr! 👋\n\n` +
      `Secure social commerce for Nigeria. Shop across any category or track your active deliveries.\n\n` +
      `What would you like to do?`;

    await this.interactiveService.sendReplyButtons(phone, welcomeMsg, [
      { id: "browse_categories", title: "🛍️ Shop" },
      { id: "get_active_orders", title: "🚚 Tracks" },
      { id: "show_full_menu", title: "📋 More" },
    ]);
  }

  private async getSafeDva(buyerId: string): Promise<any | null> {
    try {
      const dva = await this.dvaService.getDva(buyerId);
      if (dva && dva.active && dva.accountNumber) {
        return dva;
      }

      // If buyer exists but DVA is inactive/unassigned, attempt auto-provision
      this.logger.log(`Auto-provisioning DVA for buyer ${buyerId}`);
      try {
        const newDva = await this.dvaService.createDva(buyerId);
        if (newDva && newDva.dva) {
          return {
            active: true,
            accountNumber: newDva.dva.accountNumber,
            accountName: newDva.dva.accountName,
            bankName: newDva.dva.bankName,
          };
        }
      } catch (createError) {
        this.logger.error(
          `Failed to auto-provision DVA for buyer ${buyerId}:`,
          createError,
        );
      }
      return null;
    } catch (error) {
      if (error instanceof NotFoundException || (error as any).status === 404) {
        return null; // Buyer profile doesn't exist
      }
      this.logger.error(`DVA lookup error for buyer ${buyerId}`, error);
      return null;
    }
  }
}
