import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import { OrderService } from "../order/order.service";
import { RFQService } from "../rfq/rfq.service";
import { QuoteService } from "../quote/quote.service";
import { ProductService } from "../product/product.service";
import { InventoryService } from "../inventory/inventory.service";
import { WhatsAppAuthService } from "./whatsapp-auth.service";
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
    private intentService: WhatsAppIntentService,
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
      // 1. Check if phone is linked
      const merchantId = await this.authService.resolvePhone(phone);

      if (!merchantId) {
        // Not linked — run the linking flow
        const response = await this.authService.handleLinkingFlow(
          phone,
          messageText,
        );
        await this.sendWhatsAppMessage(phone, response);
        return;
      }

      // 2. Parse intent (numbers → AI → keyword fallback)
      const intent = await this.intentService.parseIntent(messageText);
      this.logger.log(
        `Intent: ${intent.functionName} | Params: ${JSON.stringify(intent.params)} | Phone: ${phone}`,
      );

      // 3. Execute command
      const response = await this.executeCommand(merchantId, intent);

      // 4. Send response
      await this.sendWhatsAppMessage(phone, response);
    } catch (error) {
      this.logger.error(
        `Error processing message from ${phone}: ${error instanceof Error ? error.message : error}`,
      );
      // Send a friendly error — never leave the merchant hanging
      try {
        await this.sendWhatsAppMessage(phone, GENERIC_ERROR);
      } catch {
        // If even error response fails, just log it
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
        name: { contains: productName, mode: "insensitive" },
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

    const targetOrder = activeOrders.find((o) =>
      o.id.toLowerCase().startsWith(orderReference.toLowerCase()),
    );

    if (!targetOrder) {
      return `❌ I no see any active order with ID "${orderReference}". Check your spelling!`;
    }

    // Normalize incoming status string
    const normalizedStatus = status.trim().toUpperCase().replace(/[\s-]/g, '_');
    
    // Map common phrases to valid enum values
    const statusMap: Record<string, string> = {
      'ON_THE_WAY': 'IN_TRANSIT',
      'IN_TRANSIT': 'IN_TRANSIT',
      'DISPATCHED': 'DISPATCHED',
      'PREPARING': 'PREPARING'
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

      const tier = (merchant as any).verificationTier || 'UNVERIFIED';
      const name = merchant.businessName || 'Boss';

      switch (tier) {
        case 'UNVERIFIED':
          return `Hey ${name}! 👋\n\nYour account is currently *unverified*.\n\nVisit your dashboard settings to upload your ID and get verified. Verified merchants get lower fees and buyers can pay you directly! 🚀\n\n🔗 Go to: Settings → Get Verified`;
        case 'BASIC':
          return `Hey ${name}! 👋\n\nYour account is *Basic* tier.\n\nUpload your government ID on the dashboard to apply for *Verified* status. Benefits include:\n• Lower platform fees (1% vs 2%)\n• Direct payments from buyers\n• Trust badge on your profile ✅`;
        case 'VERIFIED':
          return `✅ ${name}, you're a *Verified Merchant*!\n\nYou enjoy:\n• 1% platform fees (lowest tier)\n• Buyers can pay you directly\n• Verified badge on your profile\n\nKeep up the good work! 💪`;
        case 'TRUSTED':
          return `⭐ ${name}, you're a *Trusted Merchant*!\n\nHighest trust level with the lowest fees. You're featured in the catalogue and buyers see your ⭐ Trusted badge.\n\nYou don hammer! 🎉`;
        default:
          return `Your verification tier is: *${tier}*. Visit your dashboard for more details.`;
      }
    } catch (error) {
      this.logger.error(
        `Failed to fetch verification status for merchant ${merchantId}`,
        error instanceof Error ? error.stack : 'Unknown error',
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
      const link = await this.prisma.whatsAppLink.findUnique({
        where: { merchantId },
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
      const link = await this.prisma.whatsAppLink.findUnique({
        where: { merchantId },
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
      const link = await this.prisma.whatsAppLink.findUnique({
        where: { merchantId },
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
      const link = await this.prisma.whatsAppLink.findUnique({
        where: { merchantId },
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
      const link = await this.prisma.whatsAppLink.findUnique({
        where: { merchantId },
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
}
