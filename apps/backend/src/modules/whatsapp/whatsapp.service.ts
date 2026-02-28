import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderService } from '../order/order.service';
import { RFQService } from '../rfq/rfq.service';
import { QuoteService } from '../quote/quote.service';
import { ProductService } from '../product/product.service';
import { InventoryService } from '../inventory/inventory.service';
import { WhatsAppAuthService } from './whatsapp-auth.service';
import { WhatsAppIntentService, ParsedIntent } from './whatsapp-intent.service';
import {
  MAIN_MENU,
  GENERIC_ERROR,
  META_API_VERSION,
} from './whatsapp.constants';
import { RFQStatus, OrderStatus } from '@hardware-os/shared';

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
    this.accessToken = this.configService.get<string>('WHATSAPP_ACCESS_TOKEN') || '';
    this.phoneNumberId = this.configService.get<string>('WHATSAPP_PHONE_NUMBER_ID') || '';
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
        const response = await this.authService.handleLinkingFlow(phone, messageText);
        await this.sendWhatsAppMessage(phone, response);
        return;
      }

      // 2. Parse intent
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
        case 'get_sales_summary':
          return this.handleSalesSummary(merchantId, intent.params.timeframe);
        case 'get_pending_rfqs':
          return this.handlePendingRfqs(merchantId);
        case 'get_inventory':
          return this.handleInventory(merchantId, intent.params.productName);
        case 'respond_to_rfq':
          return this.handleRespondToRfq(
            merchantId,
            intent.params.rfqReference,
            intent.params.unitPriceNaira,
            intent.params.deliveryFeeNaira,
          );
        case 'update_stock':
          return this.handleUpdateStock(
            merchantId,
            intent.params.productName,
            intent.params.quantity,
            intent.params.action,
          );
        case 'get_products':
          return this.handleGetProducts(merchantId);
        case 'show_menu':
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
  // Command handlers
  // =======================================================================

  /**
   * 📊 Sales Summary — uses direct Prisma query for timeframe filtering
   * (OrderService.getMerchantSummary doesn't support timeframes)
   */
  private async handleSalesSummary(
    merchantId: string,
    timeframe?: string,
  ): Promise<string> {
    const dateFilter = this.getDateFilter(timeframe || 'today');
    const timeframeLabel = this.getTimeframeLabel(timeframe || 'today');

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
      (sum, o) => sum + Number(o.totalAmountKobo || 0) + Number(o.deliveryFeeKobo || 0),
      0,
    );

    // Count products for "top seller"
    const productCounts: Record<string, number> = {};
    for (const o of orders) {
      const name = o.quote?.rfq?.product?.name || 'Unnamed';
      productCounts[name] = (productCounts[name] || 0) + 1;
    }
    const topSeller = Object.entries(productCounts).sort((a, b) => b[1] - a[1])[0];

    // Get pending RFQ count
    const pendingRfqs = await this.prisma.rfq.count({
      where: { merchantId, status: RFQStatus.OPEN },
    });

    let msg = `📊 *Your Sales Summary* (${timeframeLabel})\n\n`;
    msg += `Orders completed: *${orders.length}*\n`;
    msg += `Total revenue: *${this.formatNaira(totalRevenue)}*\n`;
    if (topSeller) {
      msg += `Top seller: ${topSeller[0]} (${topSeller[1]} orders)\n`;
    }
    msg += `\nPending RFQs: *${pendingRfqs}*`;
    if (pendingRfqs > 0) {
      msg += `\n💡 Reply *2* to view pending RFQs`;
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
      return '📋 No pending RFQs right now. You\'re all caught up! ✅\n\n💡 Reply *1* for sales summary';
    }

    let msg = `📋 You have *${rfqs.length}* pending RFQ${rfqs.length > 1 ? 's' : ''}:\n`;

    rfqs.forEach((rfq: any, i: number) => {
      const shortId = rfq.id.substring(0, 4);
      const productName = rfq.product?.name || 'Custom Item';
      const unit = rfq.product?.unit || 'units';
      const expiresAt = new Date(rfq.expiresAt);
      const expiresIn = this.formatTimeRemaining(expiresAt);
      const address = rfq.deliveryAddress || 'Not specified';
      const location = address.split(',')[0].trim(); // First part of address

      msg += `\n${i + 1}. RFQ #${shortId} — ${rfq.quantity} ${unit} ${productName}`;
      msg += `\n   📍 ${location} | ⏰ ${expiresIn}`;
    });

    msg += `\n\nReply: "quote [RFQ#] at [price] per [unit]"`;
    msg += `\nExample: "quote ${rfqs[0].id.substring(0, 4)} at 8500 per bag"`;

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
          name: { contains: productName, mode: 'insensitive' },
        },
        include: { productStockCache: true },
        take: 5,
      });

      if (products.length === 0) {
        return `📦 No products matching "${productName}" found.\n\n💡 Reply *6* to see all your products`;
      }

      let msg = `📦 *Inventory for "${productName}":*\n`;
      for (const p of products) {
        const stock = p.productStockCache?.stock ?? 0;
        msg += `\n${p.name} — *${stock} ${p.unit}s*`;
      }
      msg += `\n\n💡 Reply *5* to update stock`;
      return msg;
    }

    // All products
    const products = await this.prisma.product.findMany({
      where: { merchantId, deletedAt: null, isActive: true },
      include: { productStockCache: true },
      orderBy: { name: 'asc' },
    });

    if (products.length === 0) {
      return '📦 You haven\'t listed any products yet.\n\nAdd products on the SwiftTrade web app to get started!';
    }

    let msg = '📦 *Your Inventory:*\n';
    for (const p of products) {
      const stock = p.productStockCache?.stock ?? 0;
      const lowStock = stock <= 10 ? ' ⚠️' : '';
      msg += `\n${p.name} — *${stock} ${p.unit}s*${lowStock}`;
    }
    msg += `\n\n💡 Reply *5* to update stock`;

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
      return `To respond to an RFQ, I need:\n• The RFQ reference (e.g. "a3f2")\n• Your price per unit in Naira\n\nExample: "quote a3f2 at 8500 per bag"\n\nReply *2* to see your pending RFQs first.`;
    }

    // Find the RFQ by short reference (first chars of UUID)
    // UUID fields don't support startsWith in Prisma, so we fetch open RFQs and filter
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
      return `❌ RFQ #${rfqReference} not found or already responded to.\n\nReply *2* to see your pending RFQs.`;
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
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      if (errorMsg.includes('not open')) {
        return `❌ This RFQ is no longer open for quotes.`;
      }
      throw error;
    }

    const productName = rfq.product?.name || 'Custom Item';
    const unit = rfq.product?.unit || 'unit';
    const grandTotal = Number(totalPriceKobo + deliveryFeeKobo);

    let msg = `✅ *Quote submitted!*\n\n`;
    msg += `RFQ: #${rfqReference} — ${rfq.quantity} ${unit}s ${productName}\n`;
    msg += `Your price: ${this.formatNaira(Number(unitPriceKobo))}/${unit}\n`;
    if (deliveryFeeNaira && deliveryFeeNaira > 0) {
      msg += `Delivery: ${this.formatNaira(Number(deliveryFeeKobo))}\n`;
    }
    msg += `Total: *${this.formatNaira(grandTotal)}*\n\n`;
    msg += `The buyer will be notified. You'll hear back when they respond! 🤝`;

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
      return `To update stock, I need:\n• Product name\n• Quantity to add or remove\n\nExample: "add 50 bags cement" or "remove 10 iron rods"\n\nReply *6* to see your products first.`;
    }

    // Fuzzy match product by name
    const product = await this.prisma.product.findFirst({
      where: {
        merchantId,
        deletedAt: null,
        name: { contains: productName, mode: 'insensitive' },
      },
      include: { productStockCache: true },
    });

    if (!product) {
      return `❌ No product matching "${productName}" found.\n\nReply *6* to see your products.`;
    }

    const isRemove = action === 'remove';
    const adjustedQty = isRemove ? -Math.abs(quantity) : Math.abs(quantity);

    try {
      await this.inventoryService.manualAdjustment(
        merchantId,
        product.id,
        adjustedQty,
        `WhatsApp stock update`,
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Stock update failed: ${errorMsg}`);
      return `❌ Couldn't update stock for ${product.name}. ${errorMsg}`;
    }

    const currentStock = (product.productStockCache?.stock ?? 0) + adjustedQty;
    const symbol = isRemove ? '-' : '+';

    let msg = `✅ *Stock updated!*\n\n`;
    msg += `${product.name}: ${symbol}${Math.abs(quantity)} ${product.unit}s\n`;
    msg += `New total: *${currentStock} ${product.unit}s*`;

    return msg;
  }

  /**
   * 📋 List Products
   */
  private async handleGetProducts(merchantId: string): Promise<string> {
    const result = await this.productService.listByMerchant(merchantId, 1, 20);
    const products = result.data;

    if (products.length === 0) {
      return '📋 You haven\'t listed any products yet.\n\nAdd products on the SwiftTrade web app!';
    }

    let msg = `📋 *Your Products (${products.length}):*\n`;

    for (const p of products) {
      const stock = (p as any).stockCache?.stock ?? 0;
      const status = (p as any).isDeleted ? '🔴' : p.isActive ? '🟢' : '🟡';
      msg += `\n${status} ${p.name} — ${stock} ${p.unit}s`;
    }

    msg += `\n\n🟢 Active  🟡 Inactive  🔴 Deleted`;
    msg += `\n\n💡 Reply *3* to check inventory details`;

    return msg;
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
      msg += `Buyer: ${rfqData.buyerName}\n`;
      msg += `Product: ${rfqData.productName}\n`;
      msg += `Quantity: ${rfqData.quantity}\n`;
      msg += `Delivery to: ${rfqData.deliveryAddress}\n`;
      msg += `Expires: 48 hours\n\n`;
      msg += `Reply "quote ${shortId} at [price] per [unit]" to respond now!`;

      await this.sendWhatsAppMessage(link.phone, msg);
      this.logger.log(`RFQ push notification sent to merchant ${merchantId} (phone: ${link.phone})`);
    } catch (error) {
      this.logger.error(
        `Failed to send RFQ push notification to merchant ${merchantId}: ${error instanceof Error ? error.message : error}`,
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
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone,
          type: 'text',
          text: { body: text },
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(
          `Meta API error (${response.status}): ${errorBody}`,
        );
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
    return `₦${naira.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }

  /** Get date filter for timeframe queries */
  private getDateFilter(timeframe: string): Date | null {
    const now = new Date();
    switch (timeframe) {
      case 'today': {
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        return start;
      }
      case 'this_week': {
        const start = new Date(now);
        start.setDate(start.getDate() - start.getDay());
        start.setHours(0, 0, 0, 0);
        return start;
      }
      case 'this_month': {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return start;
      }
      case 'all_time':
        return null;
      default:
        return null;
    }
  }

  /** Friendly label for timeframe */
  private getTimeframeLabel(timeframe: string): string {
    switch (timeframe) {
      case 'today':
        return 'Today';
      case 'this_week':
        return 'This Week';
      case 'this_month':
        return 'This Month';
      case 'all_time':
        return 'All Time';
      default:
        return 'Today';
    }
  }

  /** Format time remaining until a date */
  private formatTimeRemaining(date: Date): string {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();

    if (diffMs <= 0) return 'Expired';

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 1) return `Expires in ${days} days`;
    if (days === 1) return 'Expires tomorrow';
    if (hours > 1) return `Expires in ${hours} hours`;
    return 'Expires soon';
  }
}
