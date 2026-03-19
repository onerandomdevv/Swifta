import { Injectable, Logger, Inject, forwardRef } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import { OrderService } from "../order/order.service";
import { WhatsAppOnboardingService } from "./whatsapp-onboarding.service";
import { ProductService } from "../product/product.service";
import { InventoryService } from "../inventory/inventory.service";
import { WhatsAppAuthService } from "./whatsapp-auth.service";
import { WhatsAppBuyerAuthService } from "./whatsapp-buyer-auth.service";
import { WhatsAppBuyerService } from "./whatsapp-buyer.service";
import { TradeFinancingService } from "../trade-financing/trade-financing.service";
import { RedisService } from "../../redis/redis.service";
import { WhatsAppSupplierService } from "./whatsapp-supplier.service";
import { SupplierService } from "../supplier/supplier.service";
import { WhatsAppIntentService, ParsedIntent } from "./whatsapp-intent.service";
import { ImageSearchService } from "./image-search.service";
import { WhatsAppInteractiveService } from "./whatsapp-interactive.service";
import {
  GENERIC_ERROR,
  FRIENDLY_FALLBACK,
  STOCK_UPDATE_FOLLOWUP,
  META_API_VERSION,
  MENU_BUYER_MODE,
  MENU_MERCHANT_MODE,
} from "./whatsapp.constants";
import { OrderStatus, VerificationTier } from "@swifta/shared";

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
    private onboardingService: WhatsAppOnboardingService,
    private productService: ProductService,
    private inventoryService: InventoryService,
    private authService: WhatsAppAuthService,
    private buyerAuthService: WhatsAppBuyerAuthService,
    private intentService: WhatsAppIntentService,
    private buyerService: WhatsAppBuyerService,
    private supplierService: WhatsAppSupplierService,
    @Inject(forwardRef(() => SupplierService))
    private wholesaleSupplierService: SupplierService,
    private tradeFinancingService: TradeFinancingService,
    private imageSearchService: ImageSearchService,
    private redisService: RedisService,
    private interactiveService: WhatsAppInteractiveService,
  ) {
    this.accessToken =
      this.configService.get<string>("whatsapp.accessToken") || "";
    this.phoneNumberId =
      this.configService.get<string>("whatsapp.phoneNumberId") || "";
  }

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

      // 2. Check for Mode Override (Merchant in Buyer Mode)
      const mode = await this.redisService.get(`wa_mode_${phone}`);
      if (
        mode === "buyer" &&
        (!interactiveReply || interactiveReply.id !== MENU_MERCHANT_MODE)
      ) {
        this.logger.log(
          `Routing message to Buyer Bot via Mode Override (Phone: ${phone})`,
        );
        await this.buyerService.processMessage(
          phone,
          messageText || "",
          messageId || "",
          interactiveReply,
        );
        return;
      }

      // 2. Check if phone is linked to a Merchant
      const merchantId = await this.authService.resolvePhone(phone);
      if (merchantId) {
        // Merchant path
        this.logger.log(
          `Routing message to Merchant Bot (Merchant ID: ${merchantId})`,
        );

        if (interactiveReply) {
          await this.handleMerchantInteractiveReply(
            merchantId,
            phone,
            interactiveReply,
          );
          return;
        }

        // 1. Check for pending wholesale checkout flow
        const checkoutKey = `wa_pending_wholesale_${merchantId}`;
        const checkoutSessionRaw = await this.redisService.get(checkoutKey);
        if (checkoutSessionRaw) {
          try {
            const session = JSON.parse(checkoutSessionRaw);
            await (this as any).handleWholesaleCheckoutStep(
              merchantId,
              session,
              messageText,
              checkoutKey,
              phone,
            );
            return;
          } catch (parseErr) {
            this.logger.error(
              `Malformed wholesale checkout session for ${merchantId}`,
            );
            await this.redisService.del(checkoutKey);
          }
        }

        // 2. Check for pending product creation flow
        const prodCreationKey = `wa_product_creation_${merchantId}`;
        const prodCreationSessionRaw =
          await this.redisService.get(prodCreationKey);
        if (prodCreationSessionRaw) {
          try {
            const session = JSON.parse(prodCreationSessionRaw);
            await this.handleProductCreationStep(
              merchantId,
              session,
              messageText,
              interactiveReply,
              imageId,
              prodCreationKey,
              phone,
            );
            return;
          } catch (parseErr) {
            this.logger.error(
              `Malformed product creation session for ${merchantId}`,
            );
            await this.redisService.del(prodCreationKey);
          }
        }

        const intent = await this.intentService.parseIntent(messageText);
        await (this as any).executeCommand(merchantId, intent, phone);
        return;
      }

      // 3. Check if phone is linked to a Buyer
      const buyerId = await this.buyerAuthService.resolvePhone(phone);
      if (buyerId) {
        this.logger.log(`Routing message to Buyer Bot (Phone: ${phone})`);
        await this.buyerService.processMessage(
          phone,
          messageText || "",
          messageId || "",
          interactiveReply,
        );
        return;
      }

      // 4. Unknown number — Route to Onboarding
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

      // Send a friendly error before rethrowing for BullMQ retry — only once per 5 mins
      try {
        const fallbackKey = `whatsapp:fallback:${messageId ?? phone}`;
        const canSend = await this.redisService.set(
          fallbackKey,
          "1",
          300,
          true, // NX
        );

        if (canSend) {
          await this.interactiveService.sendTextMessage(
            phone,
            "⚠️ We're having trouble processing your request right now. Please wait a moment while we retry, or try sending your message again.",
          );
        }
      } catch (sendError) {
        this.logger.error(
          `Failed to send fallback error message to ${phone}: ${sendError instanceof Error ? sendError.message : sendError}`,
        );
      }

      throw error; // Rethrow to allow BullMQ to retry
    }
  }



  // =======================================================================
  // Command router
  // =======================================================================
  private async handleMerchantInteractiveReply(
    merchantId: string,
    phone: string,
    reply: { id: string; title: string },
  ): Promise<void> {
    const { id } = reply;

    if (id === "show_merchant_menu") {
      await this.sendMerchantMenu(phone);
      return;
    }

    if (id === "menu_sales") {
      await this.handleSalesSummary(merchantId, phone, "today");
      return;
    }

    if (id === "menu_inventory") {
      await this.handleInventory(merchantId, phone);
      return;
    }

    if (id === "menu_orders") {
      await this.handleGetRecentOrders(merchantId, phone);
      return;
    }

    if (id === "menu_products") {
      await this.handleGetProducts(merchantId, phone);
      return;
    }

    if (id === "menu_verify") {
      await this.handleGetVerificationStatus(merchantId, phone);
      return;
    }

    if (id === "menu_help") {
      await this.interactiveService.sendTextMessage(
        phone,
        `🤝 *Swifta Merchant Support*\n\nYou can manage your business by using the menu or via natural language commands:\n\n• *"sales summary"* - View performance\n• *"my orders"* - Manage latest orders\n• *"check inventory"* - Monitor stock\n• *"update price of [item] to [amount]"*\n• *"add [qty] to [item] stock"*\n\nNeed more help? Visit our web dashboard or contact support at support@swifta.store`,
      );
      return;
    }

    if (id === "add_product") {
      await this.redisService.set(
        `wa_product_creation_${merchantId}`,
        JSON.stringify({ step: "NAME", data: {} }),
        30 * 60, // 30 minutes
      );
      await this.interactiveService.sendTextMessage(
        phone,
        "Great! Let's add a new product. 🛒\n\nWhat is the *Name* of the product?",
      );
      return;
    }

    if (id === "menu_buyer_mode") {
      await this.redisService.set(`wa_mode_${phone}`, "buyer", 24 * 3600); // 24 hours
      await this.interactiveService.sendReplyButtons(
        phone,
        "Switching to *Buyer Mode*. ✅\n\nYou can now browse products and place orders. To switch back to Merchant Mode, use the menu button below.",
        [{ id: "menu_merchant_mode", title: "Merchant Mode" }],
      );
      return;
    }

    if (id === "menu_merchant_mode") {
      await this.redisService.del(`wa_mode_${phone}`);
      await this.interactiveService.sendTextMessage(
        phone,
        "Switching back to *Merchant Mode*. ✅\n\nHow can I help you today?",
      );
      await this.sendMerchantMenu(phone);
      return;
    }

    if (id.startsWith("view_product_")) {
      const productIdShort = id.replace("view_product_", "");
      const products = await this.prisma.product.findMany({
        where: { merchantId },
        include: { category: true },
      });
      const product = products.find((p) => p.id.startsWith(productIdShort));

      if (!product) {
        await this.interactiveService.sendTextMessage(
          phone,
          "❌ Product details not found.",
        );
        return;
      }

      await this.interactiveService.sendTextMessage(
        phone,
        `🏪 *${product.name}*\n\nRetail Price: ${this.formatNaira(Number(product.retailPriceKobo || product.pricePerUnitKobo))}\nCategory: ${(product as any).category?.name || "General"}\nUnit: ${product.unit}\nStatus: ${product.isActive ? "Active ✅" : "Inactive ⭕"}\n\nTo update price, say: "update price of ${product.name} to [price]"`,
      );
      return;
    }

    if (id.startsWith("manage_stock_")) {
      const productIdShort = id.replace("manage_stock_", "");
      const products = await this.prisma.product.findMany({
        where: { merchantId },
        include: { productStockCache: true },
      });
      const product = products.find((p) => p.id.startsWith(productIdShort));

      if (!product) {
        await this.interactiveService.sendTextMessage(
          phone,
          "Inventory details not found. ❌",
        );
        return;
      }

      const stock = (product as any).productStockCache?.stock || 0;
      await this.interactiveService.sendReplyButtons(
        phone,
        `📦 *Manage Stock: ${product.name}*\n\nCurrent Level: *${stock} ${product.unit}s*\n\nWould you like to add or remove stock?`,
        [
          { id: `stock_add_${productIdShort}`, title: "Add Stock" },
          { id: `stock_rem_${productIdShort}`, title: "Remove Stock" },
          { id: "show_merchant_menu", title: "Back to Menu" },
        ],
      );
      return;
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
      if (!product) {
        await this.interactiveService.sendTextMessage(
          phone,
          "Product not found.",
        );
        return;
      }

      await this.interactiveService.sendTextMessage(
        phone,
        `To ${isAdd ? "add to" : "remove from"} *${product.name}* stock, please reply with the quantity.\n\nExample: "${isAdd ? "add" : "remove"} 50"`,
      );
      return;
    }

    if (id.startsWith("manage_order_")) {
      const orderIdShort = id.replace("manage_order_", "");
      const orders = await this.prisma.order.findMany({
        where: { merchantId },
        include: { product: true },
      });
      const order = orders.find((o) => o.id.startsWith(orderIdShort));
      if (!order) {
        await this.interactiveService.sendTextMessage(
          phone,
          "Order details not found.",
        );
        return;
      }

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
      return;
    }

    if (id.startsWith("dispatch_")) {
      const orderIdShort = id.replace("dispatch_", "");
      await this.handleDispatchOrder(merchantId, phone, orderIdShort);
      return;
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
      return;
    }

    if (id.startsWith("buy_wholesale_")) {
      const productIdShort = id.replace("buy_wholesale_", "");
      await this.handleBuyWholesale(merchantId, phone, productIdShort);
      return;
    }

    if (
      id === "confirm_wholesale_pay_now" ||
      id === "confirm_wholesale_trade_finance"
    ) {
      const checkoutKey = `wa_pending_wholesale_${merchantId}`;
      const checkoutSessionRaw = await this.redisService.get(checkoutKey);
      if (!checkoutSessionRaw) {
        await this.interactiveService.sendTextMessage(
          phone,
          "Checkout session expired. Please start over.",
        );
        return;
      }
      const session = JSON.parse(checkoutSessionRaw);
      const isPayNow = id === "confirm_wholesale_pay_now";
      await this.handleWholesaleCheckoutStep(
        merchantId,
        session,
        isPayNow ? "1" : "2",
        checkoutKey,
        phone,
      );
      return;
    }

    if (id.startsWith("status_")) {
      const parts = id.split("_");
      const status = parts[1];
      const orderIdShort = parts[2];
      await this.handleUpdateOrderTracking(
        merchantId,
        phone,
        orderIdShort,
        status,
      );
      return;
    }
  }

  /**
   * Send the professional merchant main menu
   */
  private async sendMerchantMenu(phone: string): Promise<void> {
    await this.interactiveService.sendListMessage(
      phone,
      "Welcome back. What do you need?",
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
              id: "menu_inventory",
              title: "Inventory Check",
              description: "Monitor stock levels",
            },
          ],
        },
        {
          title: "Operations",
          rows: [
            {
              id: "menu_orders",
              title: "Recent Orders",
              description: "Manage your active sales",
            },
            {
              id: "menu_products",
              title: "Listings",
              description: "Manage your product portfolio",
            },
            {
              id: MENU_BUYER_MODE,
              title: "Switch to Buyer Mode",
              description: "Search and buy products",
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
              description: "How to use the Swifta",
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
  ): Promise<void> {
    try {
      switch (intent.functionName) {
        case "get_sales_summary":
          await this.handleSalesSummary(
            merchantId,
            phone,
            intent.params.timeframe,
          );
          break;
        case "update_product_price":
          await (this as any).handleUpdateProductPrice(
            merchantId,
            phone,
            intent.params.productName,
            intent.params.newPrice || intent.params.newPriceNaira,
          );
          break;
        case "update_stock":
          await this.handleUpdateStock(
            merchantId,
            phone,
            intent.params.productName,
            intent.params.quantity,
            intent.params.action,
          );
          break;
        case "get_products":
          await this.handleGetProducts(merchantId, phone);
          break;
        case "get_recent_orders":
          await this.handleGetRecentOrders(merchantId, phone);
          break;
        case "update_order_tracking":
          await this.handleUpdateOrderTracking(
            merchantId,
            phone,
            intent.params.orderReference,
            intent.params.status,
            intent.params.note,
          );
          break;
        case "get_verification_status":
          await this.handleGetVerificationStatus(merchantId, phone);
          break;
        case "friendly_fallback":
          await this.interactiveService.sendTextMessage(
            phone,
            FRIENDLY_FALLBACK,
          );
          break;
        case "show_menu":
        default:
          await this.sendMerchantMenu(phone);
          break;
      }
    } catch (error) {
      this.logger.error(
        `Command execution error (${intent.functionName}): ${error instanceof Error ? error.message : error}`,
      );
      await this.interactiveService.sendTextMessage(phone, GENERIC_ERROR);
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
    phone: string,
    timeframe?: string,
  ): Promise<void> {
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
        product: { select: { name: true } },
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
      const name = o.product?.name || "Unnamed";
      productCounts[name] = (productCounts[name] || 0) + 1;
    }
    const topSeller = Object.entries(productCounts).sort(
      (a, b) => b[1] - a[1],
    )[0];
    let msg = `Performance Summary (${timeframeLabel}):\n\n`;

    if (orders.length === 0) {
      msg += `No completed orders recorded ${timeframe === "today" ? "today" : "for this period"}.\n`;
    } else {
      msg += `Status: ${orders.length} orders completed\n`;
      msg += `Revenue: ${this.formatNaira(totalRevenue)}\n`;
      if (topSeller) {
        msg += `Top Product: ${topSeller[0]} (${topSeller[1]} orders)\n`;
      }
    }

    await this.interactiveService.sendTextMessage(phone, msg);
  }

  /**
   * 📦 Inventory Check
   */
  private async handleInventory(
    merchantId: string,
    phone: string,
    productName?: string,
  ): Promise<void> {
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
        await this.interactiveService.sendTextMessage(
          phone,
          `No products matching "${productName}" were found.`,
        );
        return;
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
      return;
    }

    // All products
    const products = await this.prisma.product.findMany({
      where: { merchantId, deletedAt: null, isActive: true },
      include: { productStockCache: true },
      orderBy: { name: "asc" },
      take: 10,
    });

    if (products.length === 0) {
      await this.interactiveService.sendTextMessage(
        phone,
        "No active product listings found.",
      );
      return;
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
  }

  /**
   * ✅ Update Stock
   */
  private async handleUpdateStock(
    merchantId: string,
    phone: string,
    productName: string,
    quantity: number,
    action?: string,
  ): Promise<void> {
    if (!productName || !quantity) {
      await this.interactiveService.sendTextMessage(
        phone,
        STOCK_UPDATE_FOLLOWUP,
      );
      return;
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
      await this.interactiveService.sendTextMessage(
        phone,
        `No product matching "${productName}" found.`,
      );
      return;
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
      await this.interactiveService.sendTextMessage(
        phone,
        `❌ Could not update stock for ${product.name}: ${errorMsg}`,
      );
      return;
    }

    const currentStock = (product.productStockCache?.stock ?? 0) + adjustedQty;
    const symbol = isRemove ? "-" : "+";

    let msg = `Stock updated. ✅\n\n`;
    msg += `Product: ${product.name}\n`;
    msg += `Adjustment: ${symbol}${Math.abs(quantity)}\n`;
    msg += `Balance: ${currentStock} units`;

    if (currentStock <= 20 && currentStock > 0) {
      msg += `\n\n⚠️ Low stock: ${product.name} — ${currentStock} units remaining.`;
    } else if (currentStock <= 0) {
      msg += `\n\n⚠️ Out of stock: ${product.name}. Listings hidden.`;
    }

    await this.interactiveService.sendTextMessage(phone, msg);
  }

  /**
   * 📋 List Products
   */
  private async handleGetProducts(
    merchantId: string,
    phone: string,
  ): Promise<void> {
    const result = await this.productService.listByMerchant(merchantId, 1, 20);
    const products = result.data;

    if (products.length === 0) {
      await this.interactiveService.sendTextMessage(
        phone,
        "🏪 You have no products listed currently. Please add products via the Swifta web dashboard to begin selling. 🛒",
      );
      return;
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
  }

  /**
   * 🛒 Recent Orders
   */
  private async handleGetRecentOrders(
    merchantId: string,
    phone: string,
  ): Promise<void> {
    const orders = await this.prisma.order.findMany({
      where: { merchantId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        product: true,
      },
    });

    if (orders.length === 0) {
      await this.interactiveService.sendTextMessage(
        phone,
        "📦 No orders have been placed yet. Your recent orders will appear here once customers start purchasing your products.",
      );
      return;
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
            description: `${o.product?.name || "Product"} | ${this.formatNaira(Number(o.totalAmountKobo))}`,
          })),
        },
      ],
    );
  }

  /**
   * 🚚 Dispatch Order
   */
  private async handleDispatchOrder(
    merchantId: string,
    phone: string,
    orderReference?: string,
  ): Promise<void> {
    if (!orderReference) {
      await this.interactiveService.sendTextMessage(
        phone,
        `Which order would you like to dispatch? Please provide the order ID or short reference.`,
      );
      return;
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
      await this.interactiveService.sendTextMessage(
        phone,
        `❌ No active order matching ID "${orderReference}" was found. Please verify the ID and try again.`,
      );
      return;
    }

    try {
      await this.orderService.dispatch(merchantId, targetOrder.id);
      await this.interactiveService.sendTextMessage(
        phone,
        `✅ *Order #${orderReference.toUpperCase()} Dispatched*\n\nA verification code has been sent to the buyer. Please request this code upon delivery to confirm receipt.`,
      );
    } catch (error: any) {
      await this.interactiveService.sendTextMessage(
        phone,
        `❌ Dispatch failed: ${error.message}`,
      );
    }
  }

  /**
   * 🚚 Update Order Tracking
   */
  private async handleUpdateOrderTracking(
    merchantId: string,
    phone: string,
    orderReference?: string,
    status?: string,
    note?: string,
  ): Promise<void> {
    if (!orderReference || !status) {
      await this.interactiveService.sendTextMessage(
        phone,
        `Please provide the order reference and the new status.\n\nE.g. *"update order ABC123 in transit"*`,
      );
      return;
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
      await this.interactiveService.sendTextMessage(
        phone,
        `❌ No active order matching "${orderReference}" was found. Please check your spelling.`,
      );
      return;
    }

    if (matches.length > 1) {
      await this.interactiveService.sendTextMessage(
        phone,
        `⚠️ Multiple orders (${matches.length}) match "${orderReference}". Please provide a more specific reference ID.`,
      );
      return;
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
      await this.interactiveService.sendTextMessage(
        phone,
        `Invalid status. Options: PREPARING, DISPATCHED, IN_TRANSIT.`,
      );
      return;
    }

    try {
      await this.orderService.addTracking(merchantId, targetOrder.id, {
        status: mappedStatus as OrderStatus,
        note,
      });

      let msg = `Tracking updated. ✅\n`;
      msg += `Order #${orderReference.toUpperCase()}\n`;
      msg += `Status: ${mappedStatus.replace(/_/g, " ")}\n`;
      if (note) msg += `Note: "${note}"\n`;
      await this.interactiveService.sendTextMessage(phone, msg);
    } catch (error: any) {
      await this.interactiveService.sendTextMessage(
        phone,
        `❌ Tracking update failed: ${error.message}`,
      );
    }
  }

  /**
   * ✅ Get Verification Status
   */
  private async handleGetVerificationStatus(
    merchantId: string,
    phone: string,
  ): Promise<void> {
    try {
      const merchant = await this.prisma.merchantProfile.findUnique({
        where: { id: merchantId },
        select: { verificationTier: true, businessName: true },
      });

      if (!merchant) {
        await this.interactiveService.sendTextMessage(
          phone,
          `Merchant profile not found.`,
        );
        return;
      }

      const tier = (merchant as any).verificationTier || "UNVERIFIED";

      let msg = "";
      switch (tier) {
        case VerificationTier.UNVERIFIED:
          msg = `Unverified Account. ⚠️\n\nVisit your dashboard settings to complete verification. Verified merchants receive lower fees and higher customer trust.\n\nDashboard: swifta.store/settings`;
          break;
        case VerificationTier.TIER_1:
          msg = `Verification Tier: Basic.\n\nUpgrade your status to Verified to enjoy lower platform fees and direct customer payments.`;
          break;
        case VerificationTier.TIER_2:
          msg = `Account Verified. ✅\n\nYou currently enjoy 1% platform fees and direct customer payments. Thank you for using Swifta.`;
          break;
        case VerificationTier.TIER_3:
          msg = `Trusted Merchant Account. ✅\n\nYou have achieved the highest trust level. You benefit from minimal fees and featured listings.`;
          break;
        default:
          msg = `Verification status: ${tier}. Please visit your dashboard for more details.`;
      }
      await this.interactiveService.sendTextMessage(phone, msg);
    } catch (error) {
      this.logger.error(
        `Failed to fetch verification status for merchant ${merchantId}`,
        error instanceof Error ? error.stack : "Unknown error",
      );
      await this.interactiveService.sendTextMessage(
        phone,
        `❌ An error occurred while checking your verification status. Please try again later.`,
      );
    }
  }

  /**
   * 🏷️ Update Product Price
   */
  private async handleUpdateProductPrice(
    merchantId: string,
    phone: string,
    productName?: string,
    priceNaira?: number,
  ): Promise<void> {
    if (!productName || !priceNaira) {
      await this.interactiveService.sendTextMessage(
        phone,
        `To update a product's price, please provide the name and the new amount.\n\nExample: *"update price of iPhone to 900000"*`,
      );
      return;
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
      await this.interactiveService.sendTextMessage(
        phone,
        `❌ Product "${productName}" was not found in your inventory. Please check your product list.`,
      );
      return;
    }

    try {
      await this.productService.update(merchantId, target.id, {
        pricePerUnitKobo: (priceNaira * 100).toString(),
      });
      await this.interactiveService.sendTextMessage(
        phone,
        `Price updated. ✅\n\n${target.name} price is now ${this.formatNaira(priceNaira * 100)} per ${target.unit}.`,
      );
    } catch (error: any) {
      await this.interactiveService.sendTextMessage(
        phone,
        `❌ Price update failed: ${error.message}`,
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
        `New order received. 📦\n\n` +
        `Product: ${orderData.productName}\n` +
        `Quantity: ${orderData.quantity}\n` +
        `Total: ${this.formatNaira(Number(orderData.amountKobo))}\n\n` +
        `Please prepare this order for dispatch.`;

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

      let msg = `Delivery confirmed. ✅\n\n`;
      msg += `Order #${payoutData.orderRef} — ${payoutData.quantity} ${payoutData.productName}\n`;
      msg += `Buyer has confirmed receipt.\n\n`;
      msg += `Payout of ${this.formatNaira(Number(payoutData.payoutAmountKobo))} sent to your ${payoutData.bankName} account.`;

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

      let msg = `Payout complete. ✅\n\n`;
      msg += `₦${Number(payoutData.amountKobo) / 100} sent to your ${payoutData.bankName} account for Order #${payoutData.orderRef}.`;

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

      let msg = `Payout delayed. ⚠️\n\n`;
      msg += `Payout for Order #${payoutData.orderRef} is being reviewed. Our team will resolve this shortly.`;

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

  /**
   * Send a WhatsApp message using a pre-approved template.
   * Required for initiating conversations outside the 24h window.
   */
  async sendWhatsAppTemplateMessage(
    phone: string,
    templateName: string,
    parameters: { type: "text"; text: string }[] = [],
  ): Promise<void> {
    const otpCode = parameters.length > 0 ? parameters[0].text : "";
    this.logger.log(`Dispatching template '${templateName}' to ${phone}`);
    await this.interactiveService.sendTemplateMessage(
      phone,
      templateName,
      otpCode,
    );
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

  private async handleBuyWholesale(
    merchantId: string,
    phone: string,
    productId: string,
    quantity?: number,
  ): Promise<void> {
    // Prisma doesn't support startsWith on UUID, so we fetch and filter
    const allProducts = await this.prisma.supplierProduct.findMany({
      where: { isActive: true, supplier: { isVerified: true } },
      include: { supplier: true },
    });

    const product = allProducts.find((p) =>
      p.id.toLowerCase().startsWith(productId.toLowerCase()),
    );

    if (!product) {
      await this.interactiveService.sendTextMessage(
        phone,
        `❌ System ID starting with "${productId}" not found. Check the ID and try again.`,
      );
      return;
    }

    const qty = quantity || product.minOrderQty;
    if (qty < product.minOrderQty) {
      await this.interactiveService.sendTextMessage(
        phone,
        `⚠️ Min order for this item is ${product.minOrderQty} ${product.unit}. Please adjust your quantity.`,
      );
      return;
    }

    try {
      const checkoutKey = `wa_pending_wholesale_${merchantId}`;
      const session = {
        productId: product.id,
        quantity: qty,
        unitPriceKobo: product.wholesalePriceKobo.toString(),
        step: "SELECT_PAYMENT",
        phone,
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
    } catch (e) {
      this.logger.error("Wholesale checkout initialization failed", e);
      await this.interactiveService.sendTextMessage(
        phone,
        "An error occurred while initiating your wholesale order. Please try again or use the merchant dashboard.",
      );
    }
  }

  private async handleWholesaleCheckoutStep(
    merchantId: string,
    session: any,
    text: string,
    key: string,
    phone: string,
  ): Promise<void> {
    const input = text.trim();

    if (session.step === "SELECT_PAYMENT") {
      let paymentMethod = "";
      if (input === "confirm_wholesale_pay_now") {
        paymentMethod = "PAY_NOW";
      } else if (input === "confirm_wholesale_trade_finance") {
        const merchant = await this.prisma.merchantProfile.findUnique({
          where: { id: merchantId },
          select: { userId: true },
        });
        const eligibility = merchant
          ? await this.tradeFinancingService.checkEligibility(merchant.userId)
          : { eligible: false };
        if (!eligibility.eligible) {
          await this.interactiveService.sendTextMessage(
            phone,
            "Sorry, Trade Financing is not available for your account yet. Please select Pay Now.",
          );
          return;
        }
        paymentMethod = "TRADE_FINANCING";
      } else {
        await this.interactiveService.sendTextMessage(
          phone,
          "Please select your payment method using the buttons provided.",
        );
        return;
      }

      // Complete - generate app link or pay stack link
      await this.redisService.del(key);
      const appUrl =
        this.configService.get("FRONTEND_URL") || "https://Swifta.com";

      if (paymentMethod === "PAY_NOW") {
        const merchant = await this.prisma.merchantProfile.findUnique({
          where: { id: merchantId },
          select: { userId: true, businessAddress: true },
        });

        if (!merchant) {
          await this.interactiveService.sendTextMessage(
            phone,
            "❌ Merchant profile not found.",
          );
          return;
        }

        if (!merchant.businessAddress) {
          await this.interactiveService.sendTextMessage(
            phone,
            "❌ Your business address is not set. Please update your profile with a valid address before placing orders.",
          );
          return;
        }

        try {
          const orderResponse = await this.wholesaleSupplierService.createOrder(
            merchant.userId,
            {
              productId: session.productId,
              quantity: session.quantity,
              deliveryAddress: merchant.businessAddress,
            },
          );

          let msg = `✅ *Wholesale Details confirmed!*\n\n`;
          msg += `*Item*: ${session.productId.substring(0, 8)} (${session.quantity} units)\n`;
          msg += `*Payment*: ${paymentMethod.replace(/_/g, " ")}\n\n`;

          await this.interactiveService.sendCTAUrlButton(
            phone,
            msg + `🔗 *Tap below to securely pay via Paystack:*`,
            "Pay Now",
            orderResponse.authorizationUrl,
          );
        } catch (error: any) {
          this.logger.error("Wholesale order creation failed", error);
          await this.interactiveService.sendTextMessage(
            phone,
            `❌ Failed to initiate order: ${error.message || "Unknown error"}`,
          );
        }
      } else {
        // Trade financing usually needs a web checkout to sign terms
        const checkoutLink = `${appUrl}/merchant/wholesale?productId=${session.productId}&qty=${session.quantity}&pay=${paymentMethod}`;

        let msg = `✅ *Wholesale Details confirmed!*\n\n`;
        msg += `*Item*: ${session.productId.substring(0, 8)} (${session.quantity} units)\n`;
        msg += `*Payment*: ${paymentMethod.replace(/_/g, " ")}\n\n`;

        await this.interactiveService.sendCTAUrlButton(
          phone,
          msg + `🔗 *Tap below to finalize this order:*`,
          "Finalize Financing",
          checkoutLink,
        );
      }
      return;
    }

    await this.redisService.del(key);
    await this.sendMerchantMenu(phone);
  }

  // =======================================================================
  // Supplier Push Notifications
  // =======================================================================

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
      // V5: Use WhatsAppBuyerLink for proper buyer resolution
      const link = await this.prisma.whatsAppBuyerLink.findUnique({
        where: { buyerId },
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
  /**
   * 🏪 Handle Multi-step Product Creation
   */
  private async handleProductCreationStep(
    merchantId: string,
    session: any,
    messageText: string | undefined,
    interactiveReply: any,
    imageId: string | undefined,
    sessionKey: string,
    phone: string,
  ): Promise<void> {
    const { step, data } = session;

    try {
      if (step === "NAME") {
        if (!messageText) {
          await this.interactiveService.sendTextMessage(
            phone,
            "Please reply with the *Name* of the product.",
          );
          return;
        }
        data.name = messageText;
        session.step = "CATEGORY";

        // Fetch categories for selection
        const categories = await this.prisma.category.findMany({
          where: { isActive: true },
          take: 10,
        });
        const rows = categories.map((c) => ({
          id: `prod_cat_${c.id}`,
          title: (c.name || "Category").substring(0, 24),
        }));

        await this.redisService.set(
          sessionKey,
          JSON.stringify(session),
          30 * 60,
        );
        await this.interactiveService.sendListMessage(
          phone,
          `Product: *${data.name}*\n\nNext, select the *Category*:`,
          "Select Category",
          [{ title: "Categories", rows }],
        );
        return;
      }

      if (step === "CATEGORY") {
        if (!interactiveReply || !interactiveReply.id.startsWith("prod_cat_")) {
          await this.interactiveService.sendTextMessage(
            phone,
            "Please select a category from the list.",
          );
          return;
        }
        data.categoryId = interactiveReply.id.replace("prod_cat_", "");
        data.categoryName = interactiveReply.title;

        // NEW: Check for category attributes
        const category = (await this.prisma.category.findUnique({
          where: { id: data.categoryId },
        })) as any;

        const attrDefs = (category?.attributes as any[]) || [];
        if (attrDefs.length > 0) {
          session.step = "ATTRIBUTES";
          data.attributeIndex = 0;
          data.attributes = {};

          const firstAttr = attrDefs[0];
          await this.redisService.set(
            sessionKey,
            JSON.stringify(session),
            30 * 60,
          );

          let msg = `Category: *${data.categoryName}*\n\n`;
          msg += `Please provide the *${firstAttr.name}*:`;
          if (firstAttr.options && firstAttr.options.length > 0) {
            const rows = firstAttr.options.slice(0, 10).map((opt: string) => ({
              id: `attr_opt_${opt.substring(0, 12)}`,
              title: opt.substring(0, 24),
            }));
            await this.interactiveService.sendListMessage(
              phone,
              msg,
              "Select Option",
              [{ title: "Options", rows }],
            );
          } else {
            await this.interactiveService.sendTextMessage(phone, msg);
          }
        } else {
          session.step = "UNIT";
          await this.redisService.set(
            sessionKey,
            JSON.stringify(session),
            30 * 60,
          );
          await this.interactiveService.sendTextMessage(
            phone,
            "What is the *Unit* of measurement? (e.g., Bag, Piece, Set, Kg)",
          );
        }
        return;
      }

      if (step === "ATTRIBUTES") {
        const category = (await this.prisma.category.findUnique({
          where: { id: data.categoryId },
        })) as any;
        const attrDefs = (category?.attributes as any[]) || [];
        const currentIndex = data.attributeIndex || 0;
        const currentAttr = attrDefs[currentIndex];

        if (!currentAttr) {
          // Fallback if index gets out of sync
          session.step = "UNIT";
          await this.redisService.set(
            sessionKey,
            JSON.stringify(session),
            30 * 60,
          );
          await this.interactiveService.sendTextMessage(
            phone,
            "What is the *Unit* of measurement?",
          );
          return;
        }

        // Store value
        const val = interactiveReply ? interactiveReply.title : messageText;
        if (!val) {
          await this.interactiveService.sendTextMessage(
            phone,
            `Please provide the *${currentAttr.name}*.`,
          );
          return;
        }

        data.attributes[currentAttr.name] = val;
        data.attributeIndex = currentIndex + 1;

        if (data.attributeIndex < attrDefs.length) {
          const nextAttr = attrDefs[data.attributeIndex];
          await this.redisService.set(
            sessionKey,
            JSON.stringify(session),
            30 * 60,
          );

          const msg = `Next, *${nextAttr.name}*:`;
          if (nextAttr.options && nextAttr.options.length > 0) {
            const rows = nextAttr.options.slice(0, 10).map((opt: string) => ({
              id: `attr_opt_${opt.substring(0, 12)}`,
              title: opt.substring(0, 24),
            }));
            await this.interactiveService.sendListMessage(
              phone,
              msg,
              "Select Option",
              [{ title: "Options", rows }],
            );
          } else {
            await this.interactiveService.sendTextMessage(phone, msg);
          }
        } else {
          session.step = "UNIT";
          await this.redisService.set(
            sessionKey,
            JSON.stringify(session),
            30 * 60,
          );
          await this.interactiveService.sendTextMessage(
            phone,
            "Got it! What is the *Unit* of measurement? (e.g., Bag, Piece, Set, Kg)",
          );
        }
        return;
      }

      if (step === "UNIT") {
        if (!messageText) {
          await this.interactiveService.sendTextMessage(
            phone,
            "Please reply with the *Unit* (e.g., Bag).",
          );
          return;
        }
        data.unit = messageText;
        session.step = "WHOLESALE_PRICE";

        await this.redisService.set(
          sessionKey,
          JSON.stringify(session),
          30 * 60,
        );
        await this.interactiveService.sendTextMessage(
          phone,
          "What is the *Wholesale Price* per unit in Naira? (Numbers only)",
        );
        return;
      }

      if (step === "WHOLESALE_PRICE") {
        const price = parseFloat(messageText || "");
        if (isNaN(price)) {
          await this.interactiveService.sendTextMessage(
            phone,
            "Please enter a valid *Wholesale Price* (Numbers only, e.g. 8500).",
          );
          return;
        }
        data.wholesalePriceNaira = price;
        session.step = "RETAIL_PRICE";

        await this.redisService.set(
          sessionKey,
          JSON.stringify(session),
          30 * 60,
        );
        await this.interactiveService.sendTextMessage(
          phone,
          "What is the *Retail Price* (for individual consumers) in Naira? (Numbers only)",
        );
        return;
      }

      if (step === "RETAIL_PRICE") {
        const price = parseFloat(messageText || "");
        if (isNaN(price)) {
          await this.interactiveService.sendTextMessage(
            phone,
            "Please enter a valid *Retail Price* (Numbers only).",
          );
          return;
        }
        data.retailPriceNaira = price;
        session.step = "SHORT_DESCRIPTION";

        await this.redisService.set(
          sessionKey,
          JSON.stringify(session),
          30 * 60,
        );
        await this.interactiveService.sendTextMessage(
          phone,
          "Please provide a *Short Description* for consumers (approx. 60-100 characters).",
        );
        return;
      }

      if (step === "SHORT_DESCRIPTION") {
        if (!messageText) {
          await this.interactiveService.sendTextMessage(
            phone,
            "Please provide a *Short Description* description. (or reply 'skip')",
          );
          return;
        }
        data.shortDescription =
          messageText.toLowerCase() === "skip" ? null : messageText;
        session.step = "IMAGE";

        await this.redisService.set(
          sessionKey,
          JSON.stringify(session),
          30 * 60,
        );
        await this.interactiveService.sendTextMessage(
          phone,
          "Great! Finally, please send a *Photo* of the product (or reply 'skip' to use a placeholder).",
        );
        return;
      }

      if (step === "IMAGE") {
        if (messageText?.toLowerCase() === "skip") {
          data.imageUrl = null;
        } else if (imageId) {
          // Simplified placeholder logic
          data.imageUrl = `https://graph.facebook.com/v21.0/${imageId}`;
        } else if (!messageText) {
          await this.interactiveService.sendTextMessage(
            phone,
            "Please send a photo or reply 'skip'.",
          );
          return;
        }

        session.step = "CONFIRMATION";
        await this.redisService.set(
          sessionKey,
          JSON.stringify(session),
          30 * 60,
        );

        let summary = `📋 *Product Summary*\n\n`;
        summary += `Name: *${data.name}*\n`;
        summary += `Category: *${data.categoryName}*\n`;
        summary += `Unit: *${data.unit}*\n`;
        summary += `Wholesale Price: *₦${data.wholesalePriceNaira}*\n`;
        summary += `Retail Price: *₦${data.retailPriceNaira}*\n`;
        if (data.shortDescription) {
          summary += `Description: _${data.shortDescription}_\n`;
        }

        if (data.attributes && Object.keys(data.attributes).length > 0) {
          summary += `\n*Specs:*\n`;
          for (const [key, val] of Object.entries(data.attributes)) {
            summary += `• ${key}: ${val}\n`;
          }
        }

        summary += `\nImage: *${data.imageUrl ? "✅ Provided" : "❌ Skipped"}*\n\n`;
        summary += `Does everything look correct?`;

        await this.interactiveService.sendReplyButtons(phone, summary, [
          { id: "prod_confirm", title: "Confirm & Create" },
          { id: "prod_cancel", title: "Cancel" },
        ]);
        return;
      }

      if (step === "CONFIRMATION") {
        if (interactiveReply?.id === "prod_cancel") {
          await this.redisService.del(sessionKey);
          await this.interactiveService.sendTextMessage(
            phone,
            "❌ Product creation cancelled.",
          );
          return;
        }
        if (interactiveReply?.id === "prod_confirm") {
          // Create product
          await this.prisma.product.create({
            data: {
              merchantId,
              name: data.name,
              unit: data.unit,
              categoryId: data.categoryId,
              categoryTag: data.categoryName,
              pricePerUnitKobo: BigInt(
                Math.round(data.wholesalePriceNaira * 100),
              ),
              retailPriceKobo: BigInt(Math.round(data.retailPriceNaira * 100)),
              shortDescription: data.shortDescription,
              imageUrl: data.imageUrl,
              attributes: data.attributes || {},
              isActive: true,
            } as any,
          });

          await this.redisService.del(sessionKey);
          await this.interactiveService.sendTextMessage(
            phone,
            `✅ *Success!* "${data.name}" is now live on Swifta.`,
          );
          return;
        }
        await this.interactiveService.sendTextMessage(
          phone,
          "Please tap 'Confirm' or 'Cancel'.",
        );
      }
    } catch (error) {
      this.logger.error(`Error in product creation step ${step}:`, error);
      await this.interactiveService.sendTextMessage(
        phone,
        "Something went wrong. Let's try again.",
      );
      await this.redisService.del(sessionKey);
    }
  }
}
