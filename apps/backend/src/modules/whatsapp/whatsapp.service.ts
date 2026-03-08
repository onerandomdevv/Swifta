import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import { OrderService } from "../order/order.service";
import { RFQService } from "../rfq/rfq.service";
import { QuoteService } from "../quote/quote.service";
import { ProductService } from "../product/product.service";
import { InventoryService } from "../inventory/inventory.service";
import { WhatsAppAuthService } from "./whatsapp-auth.service";
import { WhatsAppBuyerAuthService } from "./whatsapp-buyer-auth.service";
import { WhatsAppBuyerService } from "./whatsapp-buyer.service";
import { TradeFinancingService } from "../trade-financing/trade-financing.service";
import { RedisService } from "../../redis/redis.service";
import { WhatsAppSupplierService } from "./whatsapp-supplier.service";
import { WhatsAppIntentService, ParsedIntent } from "./whatsapp-intent.service";
import {
  MAIN_MENU,
  GENERIC_ERROR,
  FRIENDLY_FALLBACK,
  STOCK_UPDATE_FOLLOWUP,
  RFQ_RESPOND_FOLLOWUP,
  META_API_VERSION,
} from "./whatsapp.constants";
import { RFQStatus, OrderStatus } from "@hardware-os/shared";

/**
 * Core WhatsApp Bot service.
 *
 * Orchestrates:
 *  - Message processing (auth check → intent → execute → respond)
 *  - Command execution via existing services
 *  - Meta Cloud API message sending
 */
@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly accessToken: string;
  private readonly phoneNumberId: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private orderService: OrderService,
    private rfqService: RFQService,
    private quoteService: QuoteService,
    private productService: ProductService,
    private inventoryService: InventoryService,
    private authService: WhatsAppAuthService,
    private buyerAuthService: WhatsAppBuyerAuthService,
    private intentService: WhatsAppIntentService,
    private buyerService: WhatsAppBuyerService,
    private supplierService: WhatsAppSupplierService,
    private tradeFinancingService: TradeFinancingService,
    private redisService: RedisService,
  ) {
    this.accessToken =
      this.configService.get<string>("WHATSAPP_ACCESS_TOKEN") || "";
    this.phoneNumberId =
      this.configService.get<string>("WHATSAPP_PHONE_NUMBER_ID") || "";
  }

  // =======================================================================
  // Main entry point — called by the BullMQ processor
  // =======================================================================
  async processMessage(
    phone: string,
    messageText: string,
    messageId: string,
  ): Promise<void> {
    try {
      // 1. Check if phone is linked to a Merchant
      const merchantId = await this.authService.resolvePhone(phone);
      if (merchantId) {
        // Merchant path
        this.logger.log(
          `Routing message to Merchant Bot (Merchant ID: ${merchantId})`,
        );

        // 1. Check for pending wholesale checkout flow
        const checkoutKey = `wa_pending_wholesale_${merchantId}`;
        const checkoutSessionRaw = await this.redisService.get(checkoutKey);
        if (checkoutSessionRaw) {
          try {
            const session = JSON.parse(checkoutSessionRaw);
            const response = await this.handleWholesaleCheckoutStep(
              merchantId,
              session,
              messageText,
              checkoutKey,
            );
            await this.sendWhatsAppMessage(phone, response);
            return;
          } catch (parseErr) {
            this.logger.error(
              `Malformed wholesale checkout session for ${merchantId}`,
            );
            await this.redisService.del(checkoutKey);
          }
        }

        const intent = await this.intentService.parseIntent(messageText);
        const response = await this.executeCommand(merchantId, intent);
        await this.sendWhatsAppMessage(phone, response);
        return;
      }

      // 2. Check if phone is linked to a Buyer
      const buyerId = await this.buyerAuthService.resolvePhone(phone);
      if (buyerId) {
        this.logger.log(`Routing message to Buyer Bot (Phone: ${phone})`);
        await this.buyerService.processMessage(phone, messageText, messageId);
        return;
      }

      // 3. Check if phone is linked to a Supplier
      const supplierId = await this.authService.resolveSupplierPhone(phone);
      if (supplierId) {
        this.logger.log(`Routing message to Supplier Bot (Phone: ${phone})`);
        try {
          await this.supplierService.processMessage(
            phone,
            messageText,
            messageId,
          );
        } catch (error) {
          this.logger.error(
            `Error processing supplier message from ${phone}: ${error instanceof Error ? error.message : error}`,
          );
          await this.sendWhatsAppMessage(
            phone,
            "Supplier bot features are currently experiencing an issue. Please try again later.",
          );
        }
        return;
      }

      // 4. Unknown number — Trigger Unified Authentication Flow
      this.logger.log(
        `Routing message to Unified Onboarding (Phone: ${phone})`,
      );
      const response = await this.authService.handleLinkingFlow(
        phone,
        messageText,
      );
      await this.sendWhatsAppMessage(phone, response);
    } catch (error) {
      this.logger.error(
        `Error processing message from ${phone}: ${error instanceof Error ? error.message : error}`,
      );
      // Send a friendly error — never leave the user hanging
      try {
        await this.sendWhatsAppMessage(phone, GENERIC_ERROR);
      } catch {
        this.logger.error(`Failed to send error message to ${phone}`);
      }
    }
  }

  // =======================================================================
  // Command router
  // =======================================================================
  private async executeCommand(
    merchantId: string,
    intent: ParsedIntent,
  ): Promise<string> {
    try {
      switch (intent.functionName) {
        case "get_sales_summary":
          return this.handleSalesSummary(merchantId, intent.params.timeframe);
        case "get_pending_rfqs":
          return this.handlePendingRfqs(merchantId);
        case "get_inventory":
          return this.handleInventory(merchantId, intent.params.productName);
        case "respond_to_rfq":
          return this.handleRespondToRfq(
            merchantId,
            intent.params.rfqReference,
            intent.params.unitPriceNaira,
            intent.params.deliveryFeeNaira,
          );
        case "update_stock":
          return this.handleUpdateStock(
            merchantId,
            intent.params.productName,
            intent.params.quantity,
            intent.params.action,
          );
        case "get_products":
          return this.handleGetProducts(merchantId);
        case "update_order_tracking":
          return this.handleUpdateOrderTracking(
            merchantId,
            intent.params.orderReference,
            intent.params.status,
            intent.params.note,
          );
        case "get_verification_status":
          return this.handleGetVerificationStatus(merchantId);
        case "browse_wholesale":
          return this.handleBrowseWholesale(intent.params.query);
        case "buy_wholesale":
          return this.handleBuyWholesale(
            merchantId,
            intent.params.productId,
            intent.params.quantity,
          );
        case "friendly_fallback":
          return FRIENDLY_FALLBACK;
        case "show_menu":
        default:
          return MAIN_MENU;
      }
    } catch (error) {
      this.logger.error(
        `Command execution error (${intent.functionName}): ${error instanceof Error ? error.message : error}`,
      );
      return GENERIC_ERROR;
    }
  }

  // =======================================================================
  // Command handlers — warm, conversational Pidgin/Lagos tone
  // =======================================================================

  /**
   * 📊 Sales Summary
   */
  private async handleSalesSummary(
    merchantId: string,
    timeframe?: string,
  ): Promise<string> {
    const dateFilter = this.getDateFilter(timeframe || "today");
    const timeframeLabel = this.getTimeframeLabel(timeframe || "today");

    const orders = await this.prisma.order.findMany({
      where: {
        merchantId,
        status: { in: [OrderStatus.DELIVERED, OrderStatus.COMPLETED] },
        ...(dateFilter ? { createdAt: { gte: dateFilter } } : {}),
      },
      select: {
        totalAmountKobo: true,
        deliveryFeeKobo: true,
        quote: {
          select: {
            rfq: {
              select: {
                product: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    const totalRevenue = orders.reduce(
      (sum, o) =>
        sum + Number(o.totalAmountKobo || 0) + Number(o.deliveryFeeKobo || 0),
      0,
    );

    // Count products for "top seller"
    const productCounts: Record<string, number> = {};
    for (const o of orders) {
      const name = o.quote?.rfq?.product?.name || "Unnamed";
      productCounts[name] = (productCounts[name] || 0) + 1;
    }
    const topSeller = Object.entries(productCounts).sort(
      (a, b) => b[1] - a[1],
    )[0];

    // Get pending RFQ count
    const pendingRfqs = await this.prisma.rfq.count({
      where: { merchantId, status: RFQStatus.OPEN },
    });

    let msg = `📊 *Oga, here's how market dey* (${timeframeLabel}):\n\n`;

    if (orders.length === 0) {
      msg += `E never move ${timeframe === "today" ? "today" : "for this period"}, but no worry — day never end! 💪\n`;
    } else {
      msg += `✅ Orders completed: *${orders.length}*\n`;
      msg += `💰 Total revenue: *${this.formatNaira(totalRevenue)}*\n`;
      if (topSeller) {
        msg += `🏆 Top seller: ${topSeller[0]} (${topSeller[1]} orders)\n`;
      }
    }

    msg += `\n📋 Pending RFQs: *${pendingRfqs}*`;
    if (pendingRfqs > 0) {
      msg += `\nYou get people waiting for your price o! Say *"check rfq"* to see them.`;
    }

    return msg;
  }

  /**
   * 📋 Pending RFQs
   */
  private async handlePendingRfqs(merchantId: string): Promise<string> {
    const result = await this.rfqService.listByMerchant(merchantId, 1, 10);
    const rfqs = result.data.filter((r: any) => r.status === RFQStatus.OPEN);

    if (rfqs.length === 0) {
      return '📋 No pending RFQs right now. You dey free! ✅\n\n💡 Say *"how market"* to check your sales.';
    }

    let msg = `📋 You get *${rfqs.length}* pending RFQ${rfqs.length > 1 ? "s" : ""}:\n`;

    rfqs.forEach((rfq: any, i: number) => {
      const shortId = rfq.id.substring(0, 4);
      const productName = rfq.product?.name || "Custom Item";
      const unit = rfq.product?.unit || "units";
      const buyerName = rfq.user
        ? `${rfq.user.firstName} ${rfq.user.lastName}`
        : "A buyer";
      const expiresAt = new Date(rfq.expiresAt);
      const expiresIn = this.formatTimeRemaining(expiresAt);
      const address = rfq.deliveryAddress || "Not specified";
      const location = address.split(",")[0].trim();

      msg += `\n${i + 1}. *${buyerName}* wan buy ${rfq.quantity} ${unit} ${productName}`;
      msg += `\n   📍 ${location} | ⏰ ${expiresIn}`;
      msg += `\n   🏷️ Ref: #${shortId}`;
    });

    msg += `\n\nTo quote, just say: "quote ${rfqs[0].id.substring(0, 4)} at [price] per [unit]"`;

    return msg;
  }

  /**
   * 📦 Inventory Check
   */
  private async handleInventory(
    merchantId: string,
    productName?: string,
  ): Promise<string> {
    if (productName) {
      // Search for specific product
      const products = await this.prisma.product.findMany({
        where: {
          merchantId,
          deletedAt: null,
          name: { contains: productName, mode: "insensitive" },
        },
        include: { productStockCache: true },
        take: 5,
      });

      if (products.length === 0) {
        return `📦 No products matching "${productName}" found.\n\n💡 Say *"my products"* to see all your listings.`;
      }

      let msg = `📦 *Stock for "${productName}":*\n`;
      for (const p of products) {
        const stock = p.productStockCache?.stock ?? 0;
        const lowStock = stock <= 10 ? " ⚠️ _Low stock!_" : "";
        msg += `\n• ${p.name} — *${stock} ${p.unit}s*${lowStock}`;
      }
      msg += `\n\nWant to update? Just say: "add 50 ${products[0].unit}s ${products[0].name}"`;
      return msg;
    }

    // All products
    const products = await this.prisma.product.findMany({
      where: { merchantId, deletedAt: null, isActive: true },
      include: { productStockCache: true },
      orderBy: { name: "asc" },
    });

    if (products.length === 0) {
      return "📦 You never list any product yet.\n\nAdd products on the SwiftTrade web app to get started! 🛒";
    }

    let msg = "📦 *Your Stock Levels:*\n";
    const lowStockItems: string[] = [];

    for (const p of products) {
      const stock = p.productStockCache?.stock ?? 0;
      const lowStock = stock <= 10 ? " ⚠️" : "";
      msg += `\n• ${p.name} — *${stock} ${p.unit}s*${lowStock}`;
      if (stock <= 10) {
        lowStockItems.push(`${p.name} (${stock} left)`);
      }
    }

    if (lowStockItems.length > 0) {
      msg += `\n\n⚠️ *Low stock alert:* ${lowStockItems.join(", ")} — consider restocking!`;
    }

    msg += `\n\nWant to update any? Just tell me like: "add 50 bags cement"`;

    return msg;
  }

  /**
   * ✅ Respond to RFQ — submit a quote
   */
  private async handleRespondToRfq(
    merchantId: string,
    rfqReference: string,
    unitPriceNaira: number,
    deliveryFeeNaira?: number,
  ): Promise<string> {
    if (!rfqReference || !unitPriceNaira) {
      return RFQ_RESPOND_FOLLOWUP;
    }

    // Find the RFQ by short reference (first chars of UUID)
    const openRfqs = await this.prisma.rfq.findMany({
      where: {
        merchantId,
        status: RFQStatus.OPEN,
      },
      include: { product: true },
    });

    const refLower = rfqReference.toLowerCase();
    const rfq = openRfqs.find((r) => r.id.toLowerCase().startsWith(refLower));

    if (!rfq) {
      return `❌ RFQ #${rfqReference} not found or already responded to.\n\nSay *"check rfq"* to see your pending RFQs.`;
    }

    // Convert Naira to kobo
    const unitPriceKobo = BigInt(Math.round(unitPriceNaira * 100));
    const totalPriceKobo = unitPriceKobo * BigInt(rfq.quantity);
    const deliveryFeeKobo = deliveryFeeNaira
      ? BigInt(Math.round(deliveryFeeNaira * 100))
      : BigInt(0);

    // Set quote valid for 48 hours
    const validUntil = new Date();
    validUntil.setHours(validUntil.getHours() + 48);

    try {
      await this.quoteService.submit(merchantId, {
        rfqId: rfq.id,
        unitPriceKobo,
        totalPriceKobo,
        deliveryFeeKobo,
        validUntil: validUntil.toISOString(),
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      if (errorMsg.includes("not open")) {
        return `❌ This RFQ don close already. E no dey open for quotes again.`;
      }
      throw error;
    }

    const productName = rfq.product?.name || "Custom Item";
    const unit = rfq.product?.unit || "unit";
    const grandTotal = Number(totalPriceKobo + deliveryFeeKobo);

    let msg = `✅ *Done! Quote submitted!* 🤝\n\n`;
    msg += `📦 RFQ #${rfqReference} — ${rfq.quantity} ${unit}s ${productName}\n`;
    msg += `💰 Your price: ${this.formatNaira(Number(unitPriceKobo))}/${unit}\n`;
    if (deliveryFeeNaira && deliveryFeeNaira > 0) {
      msg += `🚛 Delivery: ${this.formatNaira(Number(deliveryFeeKobo))}\n`;
    }
    msg += `💵 Total: *${this.formatNaira(grandTotal)}*\n\n`;
    msg += `The buyer go see your quote now. I go notify you when dem respond! 🤝`;

    return msg;
  }

  /**
   * ✅ Update Stock
   */
  private async handleUpdateStock(
    merchantId: string,
    productName: string,
    quantity: number,
    action?: string,
  ): Promise<string> {
    if (!productName || !quantity) {
      return STOCK_UPDATE_FOLLOWUP;
    }

    // Fuzzy match product by name
    const product = await this.prisma.product.findFirst({
      where: {
        merchantId,
        deletedAt: null,
        name: { startsWith: productName, mode: "insensitive" },
      },
      include: { productStockCache: true },
    });

    if (!product) {
      return `❌ No product matching "${productName}" found.\n\nSay *"my products"* to see your listings.`;
    }

    const isRemove = action === "remove";
    const adjustedQty = isRemove ? -Math.abs(quantity) : Math.abs(quantity);

    try {
      await this.inventoryService.manualAdjustment(
        merchantId,
        product.id,
        adjustedQty,
        `WhatsApp stock update`,
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Stock update failed: ${errorMsg}`);
      return `❌ Couldn't update stock for ${product.name}. ${errorMsg}`;
    }

    const currentStock = (product.productStockCache?.stock ?? 0) + adjustedQty;
    const symbol = isRemove ? "-" : "+";

    let msg = `✅ *Done!*\n\n`;
    msg += `${product.name}: ${symbol}${Math.abs(quantity)} ${product.unit}s\n`;
    msg += `New total: *${currentStock} ${product.unit}s*`;

    if (currentStock <= 20 && currentStock > 0) {
      msg += `\n\n⚠️ Stock dey go down o. Consider restocking soon!`;
    } else if (currentStock <= 0) {
      msg += `\n\n🚨 *Out of stock!* Restock ASAP to avoid missing orders.`;
    }

    return msg;
  }

  /**
   * 📋 List Products
   */
  private async handleGetProducts(merchantId: string): Promise<string> {
    const result = await this.productService.listByMerchant(merchantId, 1, 20);
    const products = result.data;

    if (products.length === 0) {
      return "🏪 You never list any product yet.\n\nAdd products for your SwiftTrade store on the web app! 🛒";
    }

    let msg = `🏪 *Your Products (${products.length}):*\n`;

    for (const p of products) {
      const stock =
        (p as any).productStockCache?.stock ??
        (p as any).stockCache?.stock ??
        "?";
      const status = (p as any).isDeleted ? "🔴" : p.isActive ? "🟢" : "🟡";
      msg += `\n${status} ${p.name} (${p.unit}) — Stock: ${stock}`;
    }

    msg += `\n\n🟢 Active  🟡 Inactive  🔴 Deleted`;
    msg += `\n\n💡 Say *"check stock"* for detailed inventory`;

    return msg;
  }

  /**
   * 🛒 Recent Orders
   */
  private async handleGetRecentOrders(merchantId: string): Promise<string> {
    const orders = await this.prisma.order.findMany({
      where: { merchantId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        product: true,
        quote: { include: { rfq: { include: { product: true } } } },
      },
    });

    if (orders.length === 0) {
      return "🤷 Nobody don buy anything yet.\nKeep sharing your products!";
    }

    let msg = `📦 *Your Recent Orders (Last 10)*\n`;
    for (const o of orders) {
      const pName = o.product?.name || o.quote?.rfq?.product?.name || "Items";
      const q = o.quantity || o.quote?.rfq?.quantity || 1;
      msg += `\n🔹 #${o.id.slice(0, 8).toUpperCase()} - ${o.status}\n`;
      msg += `   ${q} ${pName} | ${this.formatNaira(Number(o.totalAmountKobo))}`;
    }

    msg += `\n\nTo ship, say "dispatch [orderId]"`;
    return msg;
  }

  /**
   * 🚚 Dispatch Order
   */
  private async handleDispatchOrder(
    merchantId: string,
    orderReference?: string,
  ): Promise<string> {
    if (!orderReference) {
      return `Which order you wan dispatch?\n\nSay *dispatch [order_id]* e.g. "dispatch ABC123"`;
    }

    // Fetch recent orders to find matching short ID
    const activeOrders = await this.prisma.order.findMany({
      where: {
        merchantId,
        status: { in: ["PENDING_PAYMENT", "PAID", "DISPATCHED"] },
      },
      select: { id: true },
    });

    const targetOrder = activeOrders.find((o) =>
      o.id.toLowerCase().startsWith(orderReference.toLowerCase()),
    );

    if (!targetOrder) {
      return `❌ I no see any active order with ID "${orderReference}". Check your spelling!`;
    }

    const order = await this.prisma.order.findUnique({
      where: { id: targetOrder.id },
    });

    if (!order) {
      return `❌ I no see any order with ID "${orderReference}". Check your spelling!`;
    }

    try {
      await this.orderService.dispatch(merchantId, order.id);
      return `✅ Order #${orderReference.toUpperCase()} dispatched successfully!\n\nOTP Code don go to the buyer. Dem go give you when dem receive am.`;
    } catch (error: any) {
      return `❌ Couldn't dispatch: ${error.message}`;
    }
  }

  /**
   * 🚚 Update Order Tracking
   */
  private async handleUpdateOrderTracking(
    merchantId: string,
    orderReference?: string,
    status?: string,
    note?: string,
  ): Promise<string> {
    if (!orderReference || !status) {
      return `Please provide the order reference and the new status.\n\nE.g. *"update order ABC123 in transit"*`;
    }

    // Fetch active orders to find matching short ID
    const activeOrders = await this.prisma.order.findMany({
      where: {
        merchantId,
        status: { notIn: ["CANCELLED", "COMPLETED", "DISPUTE"] },
      },
      select: { id: true },
    });

    const matches = activeOrders.filter((o) =>
      o.id.toLowerCase().startsWith(orderReference.toLowerCase()),
    );

    if (matches.length === 0) {
      return `❌ I no see any active order starting with "${orderReference}". Check your spelling!`;
    }

    if (matches.length > 1) {
      return `⚠️ I see ${matches.length} orders matching "${orderReference}". Please provide a longer reference so I know which one you mean!`;
    }

    const targetOrder = matches[0];

    // Normalize incoming status string
    const normalizedStatus = status.trim().toUpperCase().replace(/[\s-]/g, "_");

    // Map common phrases to valid enum values
    const statusMap: Record<string, string> = {
      ON_THE_WAY: "IN_TRANSIT",
      IN_TRANSIT: "IN_TRANSIT",
      DISPATCHED: "DISPATCHED",
      PREPARING: "PREPARING",
    };
    const mappedStatus = statusMap[normalizedStatus] || normalizedStatus;

    // Must map string status back to OrderStatus enum based on what Gemini outputs
    const validStatuses = ["PREPARING", "DISPATCHED", "IN_TRANSIT"];
    if (!validStatuses.includes(mappedStatus)) {
      return `❌ Invalid status. Must be PREPARING, DISPATCHED, or IN_TRANSIT. Use the dashboard to mark an order as DELIVERED after OTP confirmation.`;
    }

    try {
      await this.orderService.addTracking(merchantId, targetOrder.id, {
        status: mappedStatus as OrderStatus,
        note,
      });

      let msg = `✅ Order #${orderReference.toUpperCase()} status updated to *${mappedStatus}*.\n`;
      if (note) msg += `Note: "${note}"\n`;
      msg += `\nThe buyer don get the notification! 🚀`;
      return msg;
    } catch (error: any) {
      return `❌ Couldn't update tracking: ${error.message}`;
    }
  }

  /**
   * ✅ Get Verification Status
   */
  private async handleGetVerificationStatus(
    merchantId: string,
  ): Promise<string> {
    try {
      const merchant = await this.prisma.merchantProfile.findUnique({
        where: { id: merchantId },
        select: { verificationTier: true, businessName: true },
      });

      if (!merchant) {
        return `❌ I no fit find your merchant profile. Contact support abeg.`;
      }

      const tier = (merchant as any).verificationTier || "UNVERIFIED";
      const name = merchant.businessName || "Boss";

      switch (tier) {
        case "UNVERIFIED":
          return `Hey ${name}! 👋\n\nYour account is currently *unverified*.\n\nVisit your dashboard settings to upload your ID and get verified. Verified merchants get lower fees and buyers can pay you directly! 🚀\n\n🔗 Go to: Settings → Get Verified`;
        case "BASIC":
          return `Hey ${name}! 👋\n\nYour account is *Basic* tier.\n\nUpload your government ID on the dashboard to apply for *Verified* status. Benefits include:\n• Lower platform fees (1% vs 2%)\n• Direct payments from buyers\n• Trust badge on your profile ✅`;
        case "VERIFIED":
          return `✅ ${name}, you're a *Verified Merchant*!\n\nYou enjoy:\n• 1% platform fees (lowest tier)\n• Buyers can pay you directly\n• Verified badge on your profile\n\nKeep up the good work! 💪`;
        case "TRUSTED":
          return `⭐ ${name}, you're a *Trusted Merchant*!\n\nHighest trust level with the lowest fees. You're featured in the catalogue and buyers see your ⭐ Trusted badge.\n\nYou don hammer! 🎉`;
        default:
          return `Your verification tier is: *${tier}*. Visit your dashboard for more details.`;
      }
    } catch (error) {
      this.logger.error(
        `Failed to fetch verification status for merchant ${merchantId}`,
        error instanceof Error ? error.stack : "Unknown error",
      );
      return `❌ Something went wrong checking your verification status. Try again later.`;
    }
  }

  /**
   * 🏷️ Update Product Price
   */
  private async handleUpdateProductPrice(
    merchantId: string,
    productName?: string,
    priceNaira?: number,
  ): Promise<string> {
    if (!productName || !priceNaira) {
      return `How much you wan sell am?\n\nSay *update [product] price to [amount]* e.g. "update cement price to 8500"`;
    }

    // Find product fuzzy math
    const target = await this.prisma.product.findFirst({
      where: {
        merchantId,
        deletedAt: null,
        name: { contains: productName, mode: "insensitive" },
      },
    });

    if (!target) {
      return `❌ I no find any product like "${productName}". Say *6* to see your proper product list.`;
    }

    try {
      await this.productService.update(merchantId, target.id, {
        pricePerUnitKobo: (priceNaira * 100).toString(),
      });
      return `✅ Done! I don update *${target.name}* price to *${this.formatNaira(priceNaira * 100)}* per ${target.unit}.`;
    } catch (error: any) {
      return `❌ Couldn't update price: ${error.message}`;
    }
  }

  // =======================================================================
  // RFQ Push Notification — called via BullMQ job
  // =======================================================================
  async sendRfqPushNotification(
    merchantId: string,
    rfqData: {
      rfqId: string;
      buyerName: string;
      productName: string;
      quantity: number;
      deliveryAddress: string;
    },
  ): Promise<void> {
    try {
      const link = await this.prisma.whatsAppLink.findFirst({
        where: {
          OR: [
            { userId: merchantId },
            { user: { merchantProfile: { id: merchantId } } },
          ],
        },
        select: { phone: true, isActive: true },
      });

      if (!link || !link.isActive) return;

      const shortId = rfqData.rfqId.substring(0, 4);

      let msg = `🚨 *New RFQ Alert!*\n\n`;
      msg += `👤 Buyer: ${rfqData.buyerName}\n`;
      msg += `📦 Product: ${rfqData.productName}\n`;
      msg += `🔢 Quantity: ${rfqData.quantity}\n`;
      msg += `📍 Delivery to: ${rfqData.deliveryAddress}\n`;
      msg += `⏰ Expires: 48 hours\n\n`;
      msg += `Reply "quote ${shortId} at [price] per [unit]" to respond now! 💰`;

      await this.sendWhatsAppMessage(link.phone, msg);
      this.logger.log(
        `RFQ push notification sent to merchant ${merchantId} (phone: ${link.phone})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send RFQ push notification to merchant ${merchantId}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  async sendDirectOrderNotification(
    merchantId: string,
    orderData: any,
  ): Promise<void> {
    try {
      const link = await this.prisma.whatsAppLink.findFirst({
        where: {
          OR: [
            { userId: merchantId },
            { user: { merchantProfile: { id: merchantId } } },
          ],
        },
        select: { phone: true, isActive: true },
      });
      if (!link || !link.isActive) return;

      const shortId = orderData.orderId.substring(0, 8).toUpperCase();
      let msg = `📦 *New Order!*\n\n`;
      msg += `${orderData.buyerName} ordered ${orderData.quantity} of ${orderData.productName}\n`;
      msg += `Amount: ${this.formatNaira(Number(orderData.amountKobo))}\n`;
      msg += `Delivery to: ${orderData.deliveryAddress}\n\n`;
      msg += `Reply "dispatch ${shortId}" to ship now, or log in to your dashboard.`;

      await this.sendWhatsAppMessage(link.phone, msg);
      this.logger.log(
        `Direct order push notification sent to merchant ${merchantId} (phone: ${link.phone})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send direct order push notification to merchant ${merchantId}`,
      );
    }
  }

  async sendDeliveryConfirmedNotification(
    merchantId: string,
    payoutData: any,
  ): Promise<void> {
    try {
      const link = await this.prisma.whatsAppLink.findFirst({
        where: {
          OR: [
            { userId: merchantId },
            { user: { merchantProfile: { id: merchantId } } },
          ],
        },
        select: { phone: true, isActive: true },
      });
      if (!link || !link.isActive) return;

      let msg = `✅ *Delivery Confirmed!*\n\n`;
      msg += `Order #${payoutData.orderRef} — ${payoutData.quantity} ${payoutData.productName}\n`;
      msg += `Buyer has confirmed receipt.\n\n`;
      msg += `💰 Payout of ${this.formatNaira(Number(payoutData.payoutAmountKobo))} is being processed to your ${payoutData.bankName} account.`;

      await this.sendWhatsAppMessage(link.phone, msg);
      this.logger.log(
        `Delivery confirmed push notification sent to merchant ${merchantId} (phone: ${link.phone})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send delivery confirmed push notification to merchant ${merchantId}`,
      );
    }
  }

  async sendPayoutCompletedNotification(
    merchantId: string,
    payoutData: any,
  ): Promise<void> {
    try {
      const link = await this.prisma.whatsAppLink.findFirst({
        where: {
          OR: [
            { userId: merchantId },
            { user: { merchantProfile: { id: merchantId } } },
          ],
        },
        select: { phone: true, isActive: true },
      });
      if (!link || !link.isActive) return;

      let msg = `💰 *Payout Received!*\n\n`;
      msg += `${this.formatNaira(Number(payoutData.amountKobo))} has been sent to your ${payoutData.bankName} account for Order #${payoutData.orderRef}.\n`;
      msg += `Transaction complete! 🎉`;

      await this.sendWhatsAppMessage(link.phone, msg);
      this.logger.log(
        `Payout completed push notification sent to merchant ${merchantId} (phone: ${link.phone})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send payout completed push notification to merchant ${merchantId}`,
      );
    }
  }

  async sendPayoutFailedNotification(
    merchantId: string,
    payoutData: any,
  ): Promise<void> {
    try {
      const link = await this.prisma.whatsAppLink.findFirst({
        where: {
          OR: [
            { userId: merchantId },
            { user: { merchantProfile: { id: merchantId } } },
          ],
        },
        select: { phone: true, isActive: true },
      });
      if (!link || !link.isActive) return;

      let msg = `⚠️ *Payout Delayed*\n\n`;
      msg += `Your payout of ${payoutData.amountKobo ? this.formatNaira(Number(payoutData.amountKobo)) : "funds"} for Order #${payoutData.orderRef} is being reviewed. Our team will resolve this shortly. No action needed from you.`;

      await this.sendWhatsAppMessage(link.phone, msg);
      this.logger.log(
        `Payout failed push notification sent to merchant ${merchantId} (phone: ${link.phone})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send payout failed push notification to merchant ${merchantId}`,
      );
    }
  }

  // =======================================================================
  // V4 Unified Notifications
  // =======================================================================

  async sendBuyerLogisticsUpdate(
    phone: string,
    orderId: string,
    status: string,
    trackingUrl?: string,
  ): Promise<void> {
    const shortId = orderId.slice(0, 6).toUpperCase();
    let msg = "";

    switch (status) {
      case "PICKUP_SCHEDULED":
        msg = `🚚 *Pickup Scheduled!*\n\nYour order #${shortId} has been scheduled for pickup from the merchant. We will notify you when it's on the way.`;
        break;
      case "PICKED_UP":
      case "IN_TRANSIT":
        msg = `📦 *Order On The Way!*\n\nYour order #${shortId} has been picked up and is in transit.\n\n📍 Track live: ${trackingUrl || "Unavailable"}`;
        break;
      case "ARRIVING":
        msg = `📍 *Your order is 15 minutes away!*\n\nOrder #${shortId} is arriving shortly. Track live: ${trackingUrl || "Unavailable"}`;
        break;
      case "DELIVERED":
        msg = `✅ *Order Delivered!*\n\nYour order #${shortId} has been successfully delivered. Please reply with your 6-digit Delivery OTP to complete the transaction.`;
        break;
      case "FAILED":
        msg = `⚠️ *Delivery Update*\n\nThere was an issue with the delivery for order #${shortId}. Our support team is investigating.`;
        break;
      default:
        msg = `🚚 *Logistics Update*: Order #${shortId} is now ${status.replace(/_/g, " ").toLowerCase()}.`;
    }

    await this.sendWhatsAppMessage(phone, msg);
  }

  async sendMerchantLogisticsUpdate(
    merchantId: string,
    orderId: string,
    status: string,
  ): Promise<void> {
    try {
      // Find the user associated with this merchant profile
      const merchant = await this.prisma.merchantProfile.findUnique({
        where: { id: merchantId },
        select: { userId: true },
      });
      if (!merchant) return;

      const link = await this.prisma.whatsAppLink.findUnique({
        where: { userId: merchant.userId },
        select: { phone: true, isActive: true },
      });
      if (!link || !link.isActive) return;

      const shortId = orderId.slice(0, 6).toUpperCase();
      let msg = "";

      switch (status) {
        case "PICKUP_SCHEDULED":
          msg = `🚚 *Rider is coming!*\n\nA rider is coming to pick up Order #${shortId}. Please have it ready for collection.`;
          break;
        case "PICKED_UP":
          msg = `✅ *Order Picked Up!*\n\nOrder #${shortId} has been picked up successfully and is now on its way to the buyer.`;
          break;
      }

      if (msg) await this.sendWhatsAppMessage(link.phone, msg);
    } catch (error) {
      this.logger.error(
        `Failed to send merchant logistics update for ${orderId}`,
      );
    }
  }

  async sendSupplierLogisticsUpdate(
    supplierId: string,
    orderId: string,
    status: string,
  ): Promise<void> {
    try {
      const link = await (this.prisma as any).whatsAppSupplierLink.findUnique({
        where: { supplierId, isActive: true },
        select: { phone: true },
      });
      if (!link) return;

      const shortId = orderId.slice(0, 6).toUpperCase();
      let msg = "";

      switch (status) {
        case "PICKUP_SCHEDULED":
          msg = `🚚 *Wholesale Order: Rider coming!*\n\nA rider is coming to pick up Wholesale Order #${shortId}. Please have it ready for collection.`;
          break;
        case "PICKED_UP":
          msg = `✅ *Wholesale Order Picked Up!*\n\nWholesale Order #${shortId} has been collected and is in transit.`;
          break;
        case "DELIVERED":
          msg = `🏢 *Wholesale Order Delivered!*\n\nWholesale Order #${shortId} has been delivered to the merchant.`;
          break;
      }

      if (msg) await this.sendWhatsAppMessage(link.phone, msg);
    } catch (error) {
      this.logger.error(
        `Failed to send supplier logistics update for ${orderId}`,
      );
    }
  }

  async sendSupplierNewOrder(
    supplierId: string,
    orderData: {
      orderId: string;
      buyerName: string;
      productName: string;
      quantity: number;
      amountKobo: bigint;
      deliveryAddress: string;
    },
  ): Promise<void> {
    try {
      const link = await (this.prisma as any).whatsAppSupplierLink.findUnique({
        where: { supplierId, isActive: true },
        select: { phone: true },
      });
      if (!link) return;

      const shortId = orderData.orderId.substring(0, 8).toUpperCase();
      let msg = `🏭 *New Wholesale Order!*\n\n`;
      msg += `Merchant: ${orderData.buyerName}\n`;
      msg += `Product: ${orderData.quantity} x ${orderData.productName}\n`;
      msg += `Total: ${this.formatNaira(Number(orderData.amountKobo))}\n`;
      msg += `Ship to: ${orderData.deliveryAddress}\n\n`;
      msg += `Order #${shortId} is pending fulfillment.`;

      await this.sendWhatsAppMessage(link.phone, msg);
    } catch (error) {
      this.logger.error(
        `Failed to send supplier order notification for supplier ${supplierId}`,
      );
    }
  }

  // =======================================================================
  // Meta Cloud API — Send message
  // =======================================================================
  async sendWhatsAppMessage(phone: string, text: string): Promise<void> {
    const url = `https://graph.facebook.com/${META_API_VERSION}/${this.phoneNumberId}/messages`;

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

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(`Meta API error (${response.status}): ${errorBody}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to send WhatsApp message to ${phone}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  // =======================================================================
  // Helpers
  // =======================================================================

  /** Convert kobo (number) to formatted Naira string: ₦1,500,000 */
  private formatNaira(kobo: number): string {
    const naira = kobo / 100;
    return `₦${naira.toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }

  /** Get date filter for timeframe queries */
  private getDateFilter(timeframe: string): Date | null {
    const now = new Date();
    switch (timeframe) {
      case "today": {
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        return start;
      }
      case "this_week": {
        const start = new Date(now);
        start.setDate(start.getDate() - start.getDay());
        start.setHours(0, 0, 0, 0);
        return start;
      }
      case "this_month": {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return start;
      }
      case "all_time":
        return null;
      default:
        return null;
    }
  }

  /** Friendly label for timeframe */
  private getTimeframeLabel(timeframe: string): string {
    switch (timeframe) {
      case "today":
        return "Today";
      case "this_week":
        return "This Week";
      case "this_month":
        return "This Month";
      case "all_time":
        return "All Time";
      default:
        return "Today";
    }
  }

  /** Format time remaining until a date */
  private formatTimeRemaining(date: Date): string {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();

    if (diffMs <= 0) return "Expired";

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 1) return `Expires in ${days} days`;
    if (days === 1) return "Expires tomorrow";
    if (hours > 1) return `Expires in ${hours}hrs`;
    return "Expires soon ⚡";
  }

  // =======================================================================
  // Wholesale & Trade Financing Handlers (V4)
  // =======================================================================

  private async handleBrowseWholesale(query?: string): Promise<string> {
    const products = await this.prisma.supplierProduct.findMany({
      where: {
        isActive: true,
        supplier: { isVerified: true },
        ...(query && { name: { contains: query, mode: "insensitive" } }),
      },
      include: { supplier: true },
      take: 5,
    });

    if (products.length === 0) {
      return `❌ No wholesale products found${query ? ` matching "${query}"` : ""}. Manufacturer stock will appear here soon!`;
    }

    let msg = `🏭 *Manufacturer Catalogue*${query ? ` for "${query}"` : ""}:\n\n`;
    products.forEach((p, idx) => {
      msg += `*${idx + 1}. ${p.name}*\n`;
      msg += `🏢 ${p.supplier.companyName}\n`;
      msg += `💰 ${this.formatNaira(Number(p.wholesalePriceKobo))} (Min: ${p.minOrderQty} ${p.unit})\n`;
      msg += `🆔 ID: ${p.id.substring(0, 8)}\n\n`;
    });

    msg += `💡 To order, say: *"Buy stock [ID] [quantity] units"*`;
    return msg;
  }

  private async handleBuyWholesale(
    merchantId: string,
    productId: string,
    quantity?: number,
  ): Promise<string> {
    // Prisma doesn't support startsWith on UUID, so we fetch and filter
    const allProducts = await this.prisma.supplierProduct.findMany({
      where: { isActive: true, supplier: { isVerified: true } },
      include: { supplier: true },
    });

    const product = allProducts.find((p) =>
      p.id.toLowerCase().startsWith(productId.toLowerCase()),
    );

    if (!product) {
      return `❌ System ID starting with "${productId}" not found. Check the ID and try again.`;
    }

    const qty = quantity || product.minOrderQty;
    if (qty < product.minOrderQty) {
      return `⚠️ Min order for this item is ${product.minOrderQty} ${product.unit}. Please adjust your quantity.`;
    }

    try {
      const checkoutKey = `wa_pending_wholesale_${merchantId}`;
      const session = {
        productId: product.id,
        quantity: qty,
        unitPriceKobo: product.wholesalePriceKobo.toString(),
        step: "SELECT_PAYMENT",
      };
      await this.redisService.set(checkoutKey, JSON.stringify(session), 3600);

      const merchant = await this.prisma.merchantProfile.findUnique({
        where: { id: merchantId },
        select: { userId: true },
      });
      const eligibility = merchant
        ? await this.tradeFinancingService.checkEligibility(merchant.userId)
        : { eligible: false, reason: "Merchant not found", maxAmount: 0n };

      let msg = `✅ Order started: *${product.name}* (${qty} ${product.unit}).\n\n`;
      msg += `How would you like to pay?\n\n`;
      msg += `1️⃣ *Pay Now* (${this.formatNaira(Number(product.wholesalePriceKobo) * qty)})\n`;

      if (eligibility.eligible) {
        msg += `2️⃣ *Trade Financing* (Approved up to ${this.formatNaira(Number(eligibility.maxAmount))})\n`;
        msg += `   _Repay over 30/60/90 days_`;
      } else {
        msg += `❌ *Trade Financing* locked: ${eligibility.reason}`;
      }

      return msg;
    } catch (e) {
      this.logger.error("Wholesale checkout initialization failed", e);
      return "Something went wrong starting your wholesale order. Please try again on the web dashboard.";
    }
  }

  private async handleWholesaleCheckoutStep(
    merchantId: string,
    session: any,
    text: string,
    key: string,
  ): Promise<string> {
    const input = text.trim();

    if (session.step === "SELECT_PAYMENT") {
      let paymentMethod = "";
      if (input === "1") {
        paymentMethod = "PAY_NOW";
      } else if (input === "2") {
        const merchant = await this.prisma.merchantProfile.findUnique({
          where: { id: merchantId },
          select: { userId: true },
        });
        const eligibility = merchant
          ? await this.tradeFinancingService.checkEligibility(merchant.userId)
          : { eligible: false };
        if (!eligibility.eligible)
          return "Sorry, Trade Financing is not available for your account yet. Please reply 1️⃣ to Pay Now.";
        paymentMethod = "TRADE_FINANCING";
      } else {
        return "Please reply with 1️⃣ or 2️⃣ (if eligible) to select your payment method.";
      }

      // Complete - generate app link
      await this.redisService.del(key);
      const appUrl =
        this.configService.get("FRONTEND_URL") || "https://swifttrade.com";
      const checkoutLink = `${appUrl}/merchant/wholesale?productId=${session.productId}&qty=${session.quantity}&pay=${paymentMethod}`;

      let msg = `✅ *Wholesale Details confirmed!*\n\n`;
      msg += `*Item*: ${session.productId.substring(0, 8)} (${session.quantity} units)\n`;
      msg += `*Payment*: ${paymentMethod.replace(/_/g, " ")}\n\n`;
      msg += `🔗 *Tap below to finalize this order:*\n`;
      msg += checkoutLink;

      return msg;
    }

    return MAIN_MENU;
  }

  // =======================================================================
  // Supplier Push Notifications
  // =======================================================================

  async sendSupplierOrderNotification(
    supplierId: string,
    orderId: string,
    merchantName: string,
    productsSummary: string,
    totalNaira: number,
  ): Promise<void> {
    try {
      const link = await (this.prisma as any).whatsAppSupplierLink.findUnique({
        where: { supplierId, isActive: true },
        select: { phone: true },
      });

      if (!link) return; // Supplier not linked or inactive

      let msg = `🔔 *New Wholesale Order!*\n\n`;
      msg += `Merchant *${merchantName}* just placed a new order (#${orderId}).\n\n`;
      msg += `📦 *Items*: ${productsSummary}\n`;
      msg += `💰 *Total*: ₦${totalNaira.toLocaleString()}\n\n`;
      msg += `Please prepare the items for dispatch. Check your dashboard for full details.`;

      await this.sendWhatsAppMessage(link.phone, msg);
    } catch (error) {
      this.logger.error(`Failed to send supplier order notification: ${error}`);
    }
  }

  async sendSupplierPayoutNotification(
    supplierId: string,
    status: "PROCESSED" | "FAILED",
    amountNaira: number,
    reference: string,
  ): Promise<void> {
    try {
      const link = await (this.prisma as any).whatsAppSupplierLink.findUnique({
        where: { supplierId, isActive: true },
        select: { phone: true },
      });

      if (!link) return;

      let msg = "";
      if (status === "PROCESSED") {
        msg = `✅ *Payout Successful*\n\n`;
        msg += `A settlement of ₦${amountNaira.toLocaleString()} has been sent to your bank account for recent wholesale orders (Ref: ${reference}).\n\n`;
        msg += `Have a great day!`;
      } else {
        msg = `❌ *Payout Failed*\n\n`;
        msg += `We encountered an issue processing your payout of ₦${amountNaira.toLocaleString()} (Ref: ${reference}).\n\n`;
        msg += `Our team is looking into this. You can also check your dashboard for updates.`;
      }

      await this.sendWhatsAppMessage(link.phone, msg);
    } catch (error) {
      this.logger.error(
        `Failed to send supplier payout notification: ${error}`,
      );
    }
  }
}
