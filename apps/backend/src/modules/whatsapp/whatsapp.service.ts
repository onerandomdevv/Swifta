import { Injectable, Logger, Inject, forwardRef } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import { OrderService } from "../order/order.service";
import { WhatsAppOnboardingService } from "./whatsapp-onboarding.service";
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
import { ImageSearchService } from "./image-search.service";
import { WhatsAppInteractiveService } from "./whatsapp-interactive.service";
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
    @Inject(forwardRef(() => OrderService))
    private orderService: OrderService,
    private rfqService: RFQService,
    private quoteService: QuoteService,
    private onboardingService: WhatsAppOnboardingService,
    private productService: ProductService,
    private inventoryService: InventoryService,
    private authService: WhatsAppAuthService,
    private buyerAuthService: WhatsAppBuyerAuthService,
    private intentService: WhatsAppIntentService,
    private buyerService: WhatsAppBuyerService,
    private supplierService: WhatsAppSupplierService,
    private tradeFinancingService: TradeFinancingService,
    private imageSearchService: ImageSearchService,
    private redisService: RedisService,
    private interactiveService: WhatsAppInteractiveService,
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
    messageText?: string,
    messageId?: string,
    interactiveReply?: { type: string; id: string; title: string },
    imageId?: string,
  ): Promise<void> {
    try {
      if (imageId) {
        this.logger.log(`Routing image search (Phone: ${phone})`);
        await this.imageSearchService.handleImageSearch(phone, imageId);
        return;
      }

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

        if (interactiveReply) {
          const response = await this.handleMerchantInteractiveReply(
            merchantId,
            phone,
            interactiveReply,
          );
          if (response) {
            await this.sendWhatsAppMessage(phone, response);
          }
          return;
        }

        const intent = await this.intentService.parseIntent(messageText);
        const response = await this.executeCommand(merchantId, intent, phone);
        await this.sendWhatsAppMessage(phone, response);
        return;
      }

      // 2. Check if phone is linked to a Buyer
      const buyerId = await this.buyerAuthService.resolvePhone(phone);
      if (buyerId) {
        this.logger.log(`Routing message to Buyer Bot (Phone: ${phone})`);
        await this.buyerService.processMessage(
          phone,
          messageText,
          messageId,
          interactiveReply,
        );
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

      // 4. Unknown number — Route to V5 WhatsApp-Only Onboarding
      this.logger.log(`Routing to WhatsApp Onboarding (Phone: ${phone})`);
      await this.onboardingService.handleOnboarding(
        phone,
        messageText,
        interactiveReply,
      );
    } catch (error) {
      this.logger.error(
        `Error processing message from ${phone}: ${error instanceof Error ? error.message : error}`,
      );
      throw error; // Rethrow to allow BullMQ to retry
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
  /**
   * Handle interactive replies for merchants
   */
  private async handleMerchantInteractiveReply(
    merchantId: string,
    phone: string,
    reply: { id: string; title: string },
  ): Promise<string> {
    const { id } = reply;

    if (id === "show_merchant_menu") {
      await this.sendMerchantMenu(phone);
      return "";
    }

    if (id === "menu_sales") {
      return this.handleSalesSummary(merchantId, "today");
    }

    if (id === "menu_rfqs") {
      return this.handlePendingRfqs(merchantId, phone);
    }

    if (id === "menu_inventory") {
      return this.handleInventory(merchantId, phone);
    }

    if (id === "menu_orders") {
      return this.handleGetRecentOrders(merchantId, phone);
    }

    if (id === "menu_products") {
      return this.handleGetProducts(merchantId, phone);
    }

    if (id === "menu_verify") {
      return this.handleGetVerificationStatus(merchantId);
    }

    if (id === "menu_help") {
      return `🤝 *SwiftTrade Merchant Support*\n\nYou can manage your business by using the menu or via natural language commands:\n\n• *"sales summary"* - View performance\n• *"my orders"* - Manage latest orders\n• *"check inventory"* - Monitor stock\n• *"update price of [item] to [amount]"*\n• *"add [qty] to [item] stock"*\n\nNeed more help? Visit our web dashboard or contact support at support@swifttrade.store`;
    }

    if (id.startsWith("view_product_")) {
      const productIdShort = id.replace("view_product_", "");
      // Use findMany + filter instead of startsWith for UUID fields
      const products = await this.prisma.product.findMany({
        where: { merchantId },
        include: { category: true },
      });
      const product = products.find((p) => p.id.startsWith(productIdShort));

      if (!product) return "❌ Product details not found.";
      return `🏪 *${product.name}*\n\nPrice: ${this.formatNaira(Number(product.pricePerUnitKobo))}\nCategory: ${product.category?.name || "General"}\nUnit: ${product.unit}\nStatus: ${product.isActive ? "Active ✅" : "Inactive ⭕"}\n\nTo update price, say: "update price of ${product.name} to [price]"`;
    }

    if (id.startsWith("manage_stock_")) {
      const productIdShort = id.replace("manage_stock_", "");
      const products = await this.prisma.product.findMany({
        where: { merchantId },
        include: { productStockCache: true },
      });
      const product = products.find((p) => p.id.startsWith(productIdShort));

      if (!product) return "❌ Inventory details not found.";

      const stock = product.productStockCache?.stock || 0;
      await this.interactiveService.sendReplyButtons(
        phone,
        `📦 *Manage Stock: ${product.name}*\n\nCurrent Level: *${stock} ${product.unit}s*\n\nWould you like to add or remove stock?`,
        [
          { id: `stock_add_${productIdShort}`, title: "Add Stock" },
          { id: `stock_rem_${productIdShort}`, title: "Remove Stock" },
          { id: "show_merchant_menu", title: "Back to Menu" },
        ],
      );
      return "";
    }

    if (id.startsWith("stock_add_") || id.startsWith("stock_rem_")) {
      const isAdd = id.startsWith("stock_add_");
      const productIdShort = id.replace(
        isAdd ? "stock_add_" : "stock_rem_",
        "",
      );
      const products = await this.prisma.product.findMany({
        where: { merchantId },
      });
      const product = products.find((p) => p.id.startsWith(productIdShort));
      if (!product) return "❌ Product not found.";

      return `To ${isAdd ? "add to" : "remove from"} *${product.name}* stock, please reply with the quantity.\n\nExample: "${isAdd ? "add" : "remove"} 50"`;
    }

    if (id.startsWith("manage_order_")) {
      const orderIdShort = id.replace("manage_order_", "");
      const orders = await this.prisma.order.findMany({
        where: { merchantId },
        include: { product: true },
      });
      const order = orders.find((o) => o.id.startsWith(orderIdShort));
      if (!order) return "❌ Order details not found.";

      const status = order.status;
      const canDispatch = status === "PAID" || status === "PREPARING";

      let msg = `📦 *Order #${order.id.slice(0, 8).toUpperCase()}*\n`;
      msg += `Status: *${status}*\n`;
      msg += `Product: ${order.product?.name || "Multiple items"}\n`;
      msg += `Total: ${this.formatNaira(Number(order.totalAmountKobo))}\n`;
      msg += `Address: ${order.deliveryAddress || "Not specified"}\n`;

      const buttons: Array<{ id: string; title: string }> = [];
      if (canDispatch) {
        buttons.push({
          id: `dispatch_${orderIdShort}`,
          title: "Mark Dispatched",
        });
      }
      buttons.push({
        id: `track_update_${orderIdShort}`,
        title: "Update Status",
      });
      buttons.push({ id: "show_merchant_menu", title: "Back to Menu" });

      await this.interactiveService.sendReplyButtons(phone, msg, buttons);
      return "";
    }

    if (id.startsWith("dispatch_")) {
      const orderIdShort = id.replace("dispatch_", "");
      return this.handleDispatchOrder(merchantId, phone, orderIdShort);
    }

    if (id.startsWith("track_update_")) {
      const orderIdShort = id.replace("track_update_", "");
      await this.interactiveService.sendListMessage(
        phone,
        `Update status for Order #${orderIdShort.toUpperCase()}:`,
        "Select Status",
        [
          {
            title: "Internal States",
            rows: [
              {
                id: `status_PREPARING_${orderIdShort}`,
                title: "Preparing",
                description: "Order is being packed",
              },
              {
                id: `status_DISPATCHED_${orderIdShort}`,
                title: "Dispatched",
                description: "Picked up for delivery",
              },
              {
                id: `status_IN_TRANSIT_${orderIdShort}`,
                title: "In Transit",
                description: "On the way to buyer",
              },
            ],
          },
        ],
      );
      return "";
    }

    if (id.startsWith("buy_wholesale_")) {
      const productIdShort = id.replace("buy_wholesale_", "");
      return this.handleBuyWholesale(merchantId, phone, productIdShort);
    }

    if (
      id === "confirm_wholesale_pay_now" ||
      id === "confirm_wholesale_trade_finance"
    ) {
      const checkoutKey = `wa_pending_wholesale_${merchantId}`;
      const checkoutSessionRaw = await this.redisService.get(checkoutKey);
      if (!checkoutSessionRaw)
        return "❌ Checkout session has expired. Please start over.";
      const session = JSON.parse(checkoutSessionRaw);
      const isPayNow = id === "confirm_wholesale_pay_now";
      return this.handleWholesaleCheckoutStep(
        merchantId,
        session,
        isPayNow ? "1" : "2",
        checkoutKey,
      );
    }

    if (id.startsWith("view_rfq_")) {
      const rfqIdShort = id.replace("view_rfq_", "");
      const rfqs = await this.prisma.rfq.findMany({
        where: { merchantId, status: RFQStatus.OPEN },
        include: { product: true, user: true },
      });
      const rfq = rfqs.find((r) => r.id.startsWith(rfqIdShort));
      if (!rfq) return "❌ Request details not found or already closed.";

      let msg = `📋 *Request for Quote: ${rfq.product?.name || "Product"}*\n\n`;
      msg += `Quantity: *${rfq.quantity} ${rfq.product?.unit || "unit(s)"}*\n`;
      msg += `Buyer: ${rfq.user?.firstName || "Customer"}\n`;
      msg += `Location: ${rfq.deliveryAddress || "Not specified"}\n\n`;
      msg += `To respond, please type: "quote ${rfqIdShort} at [price]"`;
      return msg;
    }

    if (id.startsWith("status_")) {
      const parts = id.split("_");
      const status = parts[1];
      const orderIdShort = parts[2];
      return this.handleUpdateOrderTracking(merchantId, orderIdShort, status);
    }

    return `Unrecognized action: ${id}`;
  }

  /**
   * Send the professional merchant main menu
   */
  private async sendMerchantMenu(phone: string): Promise<void> {
    await this.interactiveService.sendListMessage(
      phone,
      "Welcome back to SwiftTrade! 🤝\n\nManage your business efficiently through this menu or simply tell me what you need in plain English (or Pidgin).",
      "Main Menu",
      [
        {
          title: "Business Insights",
          rows: [
            {
              id: "menu_sales",
              title: "Sales Summary",
              description: "View today's performance",
            },
            {
              id: "menu_rfqs",
              title: "Pending RFQs",
              description: "Check new requests",
            },
          ],
        },
        {
          title: "Operations",
          rows: [
            {
              id: "menu_inventory",
              title: "Inventory Check",
              description: "Monitor stock levels",
            },
            {
              id: "menu_orders",
              title: "My Orders",
              description: "Manage customer orders",
            },
            {
              id: "menu_products",
              title: "My Products",
              description: "Portfolio overview",
            },
          ],
        },
        {
          title: "Account",
          rows: [
            {
              id: "menu_verify",
              title: "Verification Status",
              description: "Check tier level",
            },
            {
              id: "menu_help",
              title: "Help & Support",
              description: "How to use the bot",
            },
          ],
        },
      ],
    );
  }

  private async executeCommand(
    merchantId: string,
    intent: ParsedIntent,
    phone: string,
  ): Promise<string> {
    try {
      switch (intent.functionName) {
        case "get_sales_summary":
          return this.handleSalesSummary(merchantId, intent.params.timeframe);
        case "get_pending_rfqs":
          return this.handlePendingRfqs(merchantId, phone);
        case "get_inventory":
          return this.handleInventory(
            merchantId,
            phone,
            intent.params.productName,
          );
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
          return this.handleGetProducts(merchantId, phone);
        case "get_recent_orders":
          return this.handleGetRecentOrders(merchantId, phone);
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
          return this.handleBrowseWholesale(phone, intent.params.query);
        case "buy_wholesale":
          return this.handleBuyWholesale(
            merchantId,
            phone,
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
  // Command handlers — professional English responses (Pidgin/Lagos input understood, English output always)
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

    let msg = `📊 *Business Performance Summary* (${timeframeLabel}):\n\n`;

    if (orders.length === 0) {
      msg += `There are no completed orders recorded ${timeframe === "today" ? "today" : "for this period"}.\n`;
    } else {
      msg += `✅ Orders Completed: *${orders.length}*\n`;
      msg += `💰 Total Revenue: *${this.formatNaira(totalRevenue)}*\n`;
      if (topSeller) {
        msg += `🏆 Top-selling Product: ${topSeller[0]} (${topSeller[1]} orders)\n`;
      }
    }

    msg += `\n📋 Pending RFQs: *${pendingRfqs}*`;
    if (pendingRfqs > 0) {
      msg += `\nYou have active requests awaiting your quote. Please use the menu below to view them.`;
    }

    return msg;
  }

  /**
   * 📋 Pending RFQs
   */
  private async handlePendingRfqs(
    merchantId: string,
    phone: string,
  ): Promise<string> {
    const result = await this.rfqService.listByMerchant(merchantId, 1, 10);
    const rfqs = result.data.filter((r: any) => r.status === RFQStatus.OPEN);

    if (rfqs.length === 0) {
      return "📋 You have no pending RFQs at the moment. All requests have been addressed or have expired. ✅";
    }

    await this.interactiveService.sendListMessage(
      phone,
      `📋 You have *${rfqs.length}* pending request${rfqs.length > 1 ? "s" : ""} awaiting your quote.`,
      "View Requests",
      [
        {
          title: "Pending Quotes",
          rows: rfqs.map((rfq: any) => ({
            id: `view_rfq_${rfq.id.substring(0, 8)}`,
            title: `${rfq.quantity} ${rfq.product?.unit || "units"} ${rfq.product?.name || "Product"}`,
            description: `From: ${rfq.user?.firstName || "Buyer"} | Loc: ${rfq.deliveryAddress?.split(",")[0] || "Nigeria"}`,
          })),
        },
      ],
    );

    return ""; // Response handled via interactive service
  }

  /**
   * 📦 Inventory Check
   */
  private async handleInventory(
    merchantId: string,
    phone: string,
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
        take: 10,
      });

      if (products.length === 0) {
        return `📦 No products matching "${productName}" were found in your inventory.`;
      }

      await this.interactiveService.sendListMessage(
        phone,
        `📦 Inventory matches for "${productName}":`,
        "View Products",
        [
          {
            title: "Inventory Search Results",
            rows: products.map((p) => ({
              id: `manage_stock_${p.id.substring(0, 8)}`,
              title: p.name,
              description: `Stock: ${p.productStockCache?.stock || 0} ${p.unit}s | Tap to manage`,
            })),
          },
        ],
      );
      return "";
    }

    // All products
    const products = await this.prisma.product.findMany({
      where: { merchantId, deletedAt: null, isActive: true },
      include: { productStockCache: true },
      orderBy: { name: "asc" },
      take: 10,
    });

    if (products.length === 0) {
      return "📦 You do not have any active product listings. Please add products via the SwiftTrade web dashboard to begin selling. 🛒";
    }

    await this.interactiveService.sendListMessage(
      phone,
      "📦 *Current Inventory Levels*",
      "Manage Stock",
      [
        {
          title: "My Products",
          rows: products.map((p) => ({
            id: `manage_stock_${p.id.substring(0, 8)}`,
            title: p.name,
            description: `Stock: ${p.productStockCache?.stock || 0} ${p.unit}s ${p.productStockCache?.stock <= 10 ? "⚠️ Low Stock" : ""}`,
          })),
        },
      ],
    );

    return "";
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
        return `❌ This RFQ is no longer open for quotes.`;
      }
      throw error;
    }

    const productName = rfq.product?.name || "Custom Item";
    const unit = rfq.product?.unit || "unit";
    const grandTotal = Number(totalPriceKobo + deliveryFeeKobo);

    let msg = `✅ *Quote Submitted Successfully* 🤝\n\n`;
    msg += `📦 RFQ #${rfqReference.toUpperCase()} - ${rfq.quantity} ${unit}(s) of ${productName}\n`;
    msg += `💰 Unit Price: ${this.formatNaira(Number(unitPriceKobo))}/${unit}\n`;
    if (deliveryFeeNaira && deliveryFeeNaira > 0) {
      msg += `🚛 Delivery Fee: ${this.formatNaira(Number(deliveryFeeKobo))}\n`;
    }
    msg += `💵 Total Amount: *${this.formatNaira(grandTotal)}*\n\n`;
    msg += `The buyer has been notified. We will alert you when they respond to your quote.`;

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
      return `❌ No product matching "${productName}" was found in your inventory.`;
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
      return `❌ Could not update stock for ${product.name}: ${errorMsg}`;
    }

    const currentStock = (product.productStockCache?.stock ?? 0) + adjustedQty;
    const symbol = isRemove ? "-" : "+";

    let msg = `✅ *Stock Update Successful*\n\n`;
    msg += `Product: *${product.name}*\n`;
    msg += `Adjustment: ${symbol}${Math.abs(quantity)} ${product.unit}(s)\n`;
    msg += `Updated Balance: *${currentStock} ${product.unit}(s)*`;

    if (currentStock <= 20 && currentStock > 0) {
      msg += `\n\n⚠️ *Low Stock Alert*: Your inventory for this product is low. Please consider restocking.`;
    } else if (currentStock <= 0) {
      msg += `\n\n🚨 *Out of Stock*: This product is now out of stock and will be hidden from buyers.`;
    }

    return msg;
  }

  /**
   * 📋 List Products
   */
  private async handleGetProducts(
    merchantId: string,
    phone: string,
  ): Promise<string> {
    const result = await this.productService.listByMerchant(merchantId, 1, 20);
    const products = result.data;

    if (products.length === 0) {
      return "🏪 You have no products listed currently. Please add products via the SwiftTrade web dashboard to begin selling. 🛒";
    }

    // Meta interactive list supports max 10 rows
    const displayedProducts = products.slice(0, 10);

    await this.interactiveService.sendListMessage(
      phone,
      `🏪 *Your Product Portfolio* (${products.length} items)`,
      "View Details",
      [
        {
          title: "My Active Listings",
          rows: displayedProducts.map((p) => ({
            id: `view_product_${p.id.substring(0, 8)}`,
            title: p.name,
            description: `Price: ${this.formatNaira(Number(p.pricePerUnitKobo || 0))} | Category: ${(p as any).category?.name || "General"}`,
          })),
        },
      ],
    );

    return "";
  }

  /**
   * 🛒 Recent Orders
   */
  private async handleGetRecentOrders(
    merchantId: string,
    phone: string,
  ): Promise<string> {
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
      return "📦 No orders have been placed yet. Your recent orders will appear here once customers start purchasing your products.";
    }

    await this.interactiveService.sendListMessage(
      phone,
      "📦 *Recent Customer Orders*",
      "View Orders",
      [
        {
          title: "Orders (Last 10)",
          rows: orders.map((o) => ({
            id: `manage_order_${o.id.substring(0, 8)}`,
            title: `#${o.id.slice(0, 8).toUpperCase()} - ${o.status}`,
            description: `${o.product?.name || o.quote?.rfq?.product?.name || "Product"} | ${this.formatNaira(Number(o.totalAmountKobo))}`,
          })),
        },
      ],
    );

    return "";
  }

  /**
   * 🚚 Dispatch Order
   */
  private async handleDispatchOrder(
    merchantId: string,
    phone: string,
    orderReference?: string,
  ): Promise<string> {
    if (!orderReference) {
      return `Which order would you like to dispatch? Please provide the order ID or short reference.`;
    }

    // Fetch recent orders to find matching short ID
    const activeOrders = await this.prisma.order.findMany({
      where: {
        merchantId,
        status: { in: ["PENDING_PAYMENT", "PAID"] },
      },
      select: { id: true },
    });

    const targetOrder = activeOrders.find((o) =>
      o.id.toLowerCase().startsWith(orderReference.toLowerCase()),
    );

    if (!targetOrder) {
      return `❌ No active order matching ID "${orderReference}" was found. Please verify the ID and try again.`;
    }

    try {
      await this.orderService.dispatch(merchantId, targetOrder.id);
      return `✅ *Order #${orderReference.toUpperCase()} Dispatched*\n\nA verification code has been sent to the buyer. Please request this code upon delivery to confirm receipt.`;
    } catch (error: any) {
      return `❌ Dispatch failed: ${error.message}`;
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

      let msg = `✅ *Tracking Updated Successfuly*\n`;
      msg += `Order #${orderReference.toUpperCase()}\n`;
      msg += `New Status: *${mappedStatus.replace(/_/g, " ")}*\n`;
      if (note) msg += `Note: "${note}"\n`;
      msg += `\nThe buyer has been notified of this update. 🚀`;
      return msg;
    } catch (error: any) {
      return `❌ Tracking update failed: ${error.message}`;
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
          return `Hello ${name}! 👋\n\nYour account is currently *unverified*.\n\nPlease visit your dashboard settings to upload your ID and complete verification. Verified merchants benefit from lower fees and more direct customer trust. 🚀\n\n🔗 Dashboard: Settings → Verification`;
        case "BASIC":
          return `Hello ${name}! 👋\n\nYour account is currently in the *Basic* tier.\n\nCompleting your government ID verification will upgrade your status to *Verified*, offering:\n• Reduced platform fees (1%)\n• Direct customer payments\n• Enhanced profile trust ✅`;
        case "VERIFIED":
          return `✅ *Verified Merchant Status* — ${name}\n\nYou are currently enjoying:\n• Competitive 1% platform fees\n• Direct customer payments\n• Verified badge on your profile\n\nThank you for choosing SwiftTrade! 💪`;
        case "TRUSTED":
          return `⭐ *Trusted Merchant Status* — ${name}\n\nYou have achieved the highest trust level! You benefit from minimal fees, featured listings, and a ⭐ Trusted merchant badge.\n\nExcellent work! 🎉`;
        default:
          return `Your current verification tier is: *${tier}*. Please visit your dashboard for more detailed information.`;
      }
    } catch (error) {
      this.logger.error(
        `Failed to fetch verification status for merchant ${merchantId}`,
        error instanceof Error ? error.stack : "Unknown error",
      );
      return `❌ An error occurred while checking your verification status. Please try again later.`;
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
      return `To update a product's price, please provide the name and the new amount.\n\nExample: *"update price of cement to 9000"*`;
    }

    // Find product fuzzy match
    const target = await this.prisma.product.findFirst({
      where: {
        merchantId,
        deletedAt: null,
        name: { contains: productName, mode: "insensitive" },
      },
    });

    if (!target) {
      return `❌ Product "${productName}" was not found in your inventory. Please check your product list.`;
    }

    try {
      await this.productService.update(merchantId, target.id, {
        pricePerUnitKobo: (priceNaira * 100).toString(),
      });
      return `✅ *Price Updated Successfuly*\n\nThe price of *${target.name}* has been updated to *${this.formatNaira(priceNaira * 100)}* per ${target.unit}.`;
    } catch (error: any) {
      return `❌ Price update failed: ${error.message}`;
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

      const shortId = rfqData.rfqId.substring(0, 8);

      const bodyText =
        `🚨 *New Request for Quote*\n\n` +
        `Product: *${rfqData.productName}*\n` +
        `Quantity: *${rfqData.quantity}*\n` +
        `Delivery: ${rfqData.deliveryAddress}\n\n` +
        `Please provide your best price to secure this order.`;

      await this.interactiveService.sendReplyButtons(link.phone, bodyText, [
        { id: `view_rfq_${shortId}`, title: "View & Quote" },
        { id: "show_merchant_menu", title: "Main Menu" },
      ]);

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

      const shortId = orderData.orderId.substring(0, 8);
      const bodyText =
        `📦 *New Customer Order!*\n\n` +
        `Product: *${orderData.productName}*\n` +
        `Quantity: *${orderData.quantity}*\n` +
        `Total: *${this.formatNaira(Number(orderData.amountKobo))}*\n\n` +
        `Please prepare this order for dispatch as soon as possible.`;

      await this.interactiveService.sendReplyButtons(link.phone, bodyText, [
        { id: `manage_order_${shortId}`, title: "Manage Order" },
        { id: "show_merchant_menu", title: "Main Menu" },
      ]);

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
    const shortId = orderId.slice(0, 8);
    let msg = "";

    switch (status) {
      case "PICKUP_SCHEDULED":
        msg = `🚚 *Logistics Update*\n\nYour order #${shortId.toUpperCase()} has been scheduled for pickup. We will notify you once it is in transit.`;
        break;
      case "PICKED_UP":
      case "IN_TRANSIT":
        msg = `📦 *Order in Transit*\n\nYour order #${shortId.toUpperCase()} has been collected and is on its way to your delivery address.`;
        break;
      case "ARRIVING":
        msg = `📍 *Arriving Shortly*\n\nYour order #${shortId.toUpperCase()} is nearby and should arrive within 15 minutes.`;
        break;
      case "DELIVERED":
        msg = `✅ *Order Delivered Successfully*\n\nYour order #${shortId.toUpperCase()} has been delivered. Please share the 6-digit Delivery OTP with the rider to confirm receipt.`;
        break;
      case "FAILED":
        msg = `⚠️ *Logistics Alert*\n\nThere was an issue delivering order #${shortId.toUpperCase()}. Our support team has been notified and will contact you shortly.`;
        break;
      default:
        msg = `🚚 *Logistics Update*: Your order #${shortId.toUpperCase()} status is now ${status.replace(/_/g, " ").toLowerCase()}.`;
    }

    if (trackingUrl) {
      await this.interactiveService.sendCTAUrlButton(
        phone,
        msg,
        "Track Live Location",
        trackingUrl,
      );
    } else {
      await this.sendWhatsAppMessage(phone, msg);
    }
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
      const link = await (this.prisma as any).whatsAppSupplierLink.findFirst({
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
      const link = await (this.prisma as any).whatsAppSupplierLink.findFirst({
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

  private async handleBrowseWholesale(
    phone: string,
    query?: string,
  ): Promise<string> {
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
      return `❌ No wholesale products found${query ? ` matching "${query}"` : ""}. Manufacturer listings will appear here soon.`;
    }

    await this.interactiveService.sendListMessage(
      phone,
      `🏭 *Manufacturer Catalogue*${query ? ` for "${query}"` : ""}\n\nSelect a product to initiate a wholesale purchase.`,
      "View Products",
      [
        {
          title: "Available Stock",
          rows: products.map((p) => ({
            id: `buy_wholesale_${p.id.substring(0, 8)}`,
            title: p.name,
            description: `${this.formatNaira(Number(p.wholesalePriceKobo))} | Min: ${p.minOrderQty} ${p.unit} | ${p.supplier.companyName}`,
          })),
        },
      ],
    );

    return "";
  }

  private async handleBuyWholesale(
    merchantId: string,
    phone: string,
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

      const buttons: Array<{ id: string; title: string }> = [
        { id: "confirm_wholesale_pay_now", title: "Pay Now" },
      ];

      let msg = `✅ Wholesale Order Initiated: *${product.name}*\nQuantity: *${qty} ${product.unit}s*\n\nHow would you like to proceed with payment?`;

      if (eligibility.eligible) {
        buttons.push({
          id: "confirm_wholesale_trade_finance",
          title: "Trade Finance",
        });
        msg += `\n\nTrade Financing available up to ${this.formatNaira(Number(eligibility.maxAmount))}.`;
      } else {
        msg += `\n\n_Note: Trade Financing is currently unavailable: ${eligibility.reason}_`;
      }

      await this.interactiveService.sendReplyButtons(phone, msg, buttons);
      return "";
    } catch (e) {
      this.logger.error("Wholesale checkout initialization failed", e);
      return "An error occurred while initiating your wholesale order. Please try again or use the merchant dashboard.";
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

    await this.redisService.del(key);
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
      const link = await (this.prisma as any).whatsAppSupplierLink.findFirst({
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
      const link = await (this.prisma as any).whatsAppSupplierLink.findFirst({
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

  /**
   * ⭐️ Review Prompt (Interactive) — called via BullMQ
   */
  async sendReviewPrompt(
    buyerId: string,
    orderId: string,
    merchantName: string,
    productName: string,
  ): Promise<void> {
    try {
      const link = await this.prisma.whatsAppLink.findFirst({
        where: { userId: buyerId, isActive: true },
      });

      if (!link) return;

      const bodyText = `⭐️ *How was your order for ${productName}?*\n\nYour experience with *${merchantName}* matters! Please rate them below:`;

      await this.buyerService.sendWhatsAppReviewPrompt(
        link.phone,
        bodyText,
        orderId,
      );
    } catch (error) {
      this.logger.error(`Failed to send review prompt to ${buyerId}: ${error}`);
    }
  }
}
