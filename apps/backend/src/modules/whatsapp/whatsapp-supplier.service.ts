import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import { WhatsAppSupplierIntentService } from "./whatsapp-supplier-intent.service";
import { ParsedIntent } from "./whatsapp-intent.service";
import { RedisService } from "../../redis/redis.service";
import { FRIENDLY_FALLBACK } from "./whatsapp.constants";
import { OrderStatus } from "@twizrr/shared";
import { WhatsAppInteractiveService } from "./whatsapp-interactive.service";

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
    private interactiveService: WhatsAppInteractiveService,
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
    interactiveType?: string,
    interactiveId?: string,
  ): Promise<void> {
    try {
      // Find the supplier link
      const link = await (this.prisma as any).whatsAppSupplierLink.findUnique({
        where: { phone },
        select: { supplierId: true, isActive: true },
      });

      if (!link || !link.isActive) {
        this.logger.error(
          `Supplier link not found for phone ${maskPhone(phone)} during processMessage`,
        );
        return;
      }

      const supplierId = link.supplierId;

      // Handle interactive replies
      if (interactiveId) {
        await this.handleInteractiveReply(supplierId, phone, interactiveId);
        return;
      }

      const intent = await this.intentService.parseIntent(messageText);

      this.logger.debug(
        `Supplier intent parsed | phone=${maskPhone(phone)} | fn=${intent.functionName} | paramKeys=${Object.keys(intent.params ?? {}).join(",")}`,
      );

      await this.executeCommand(supplierId, phone, intent);
    } catch (error) {
      this.logger.error(
        `Error processing supplier message from ${maskPhone(phone)}: ${error instanceof Error ? error.message : error}`,
      );
      await this.interactiveService.sendTextMessage(
        phone,
        "An error occurred while processing your request. Please try again.",
      );
    }
  }

  // =======================================================================
  // Interactive Reply Handler
  // =======================================================================
  private async handleInteractiveReply(
    supplierId: string,
    phone: string,
    interactiveId: string,
  ): Promise<void> {
    if (interactiveId === "show_supplier_menu") {
      await this.sendSupplierMenu(phone);
      return;
    }

    if (interactiveId === "get_supplier_sales") {
      await this.handleSalesSummary(supplierId, phone);
      return;
    }

    if (interactiveId === "get_supplier_orders") {
      await this.handleRecentOrders(supplierId, phone);
      return;
    }

    if (interactiveId === "get_supplier_products") {
      await this.handleGetProducts(supplierId, phone);
      return;
    }

    if (interactiveId === "get_supplier_payouts") {
      await this.handlePayouts(supplierId, phone);
      return;
    }

    if (interactiveId.startsWith("dispatch_order_")) {
      const orderIdShort = interactiveId.replace("dispatch_order_", "");
      await this.handleDispatchOrder(supplierId, phone, orderIdShort);
      return;
    }

    if (interactiveId.startsWith("view_wholesale_order_")) {
      const orderIdShort = interactiveId.replace("view_wholesale_order_", "");
      await this.handleViewWholesaleOrder(supplierId, phone, orderIdShort);
      return;
    }

    if (interactiveId.startsWith("view_supplier_product_")) {
      const productIdShort = interactiveId.replace(
        "view_supplier_product_",
        "",
      );
      await this.handleViewSupplierProduct(supplierId, phone, productIdShort);
      return;
    }

    await this.interactiveService.sendTextMessage(phone, FRIENDLY_FALLBACK);
  }

  private async handleViewSupplierProduct(
    supplierId: string,
    phone: string,
    productIdShort: string,
  ): Promise<void> {
    const allProducts = await this.prisma.supplierProduct.findMany({
      where: { supplierId },
    });
    const product = allProducts.find((p) => p.id.startsWith(productIdShort));

    if (!product) {
      await this.interactiveService.sendTextMessage(
        phone,
        "Product details not found.",
      );
      return;
    }

    let msg = `${product.name}\n\n`;
    msg += `Wholesale Price: ${this.formatNaira(Number(product.wholesalePriceKobo))}\n`;
    msg += `Min Order: ${product.minOrderQty} ${product.unit}\n`;
    msg += `Category: ${product.category}\n`;
    msg += `Status: ${product.isActive ? "Active ✅" : "Inactive"}\n\n`;
    msg += `To update price, say: "update price of ${product.name} to [price]"`;

    await this.interactiveService.sendTextMessage(phone, msg);
  }

  private async sendSupplierMenu(phone: string): Promise<void> {
    await this.interactiveService.sendListMessage(
      phone,
      "Supplier Menu. What would you like to manage?",
      "Open Menu",
      [
        {
          title: "Operations",
          rows: [
            {
              id: "get_supplier_sales",
              title: "Sales Summary",
              description: "View your revenue and performance",
            },
            {
              id: "get_supplier_orders",
              title: "Active Orders",
              description: "Manage pending fulfillments",
            },
            {
              id: "get_supplier_products",
              title: "Product List",
              description: "View and manage your catalogue",
            },
          ],
        },
        {
          title: "Finance & Support",
          rows: [
            {
              id: "get_supplier_payouts",
              title: "Payout History",
              description: "Track your earnings and status",
            },
          ],
        },
      ],
    );
  }

  // =======================================================================
  // Command router
  // =======================================================================
  private async executeCommand(
    supplierId: string,
    phone: string,
    intent: ParsedIntent,
  ): Promise<void> {
    try {
      switch (intent.functionName) {
        case "show_menu":
          await this.sendSupplierMenu(phone);
          break;
        case "get_supplier_sales":
          await this.handleSalesSummary(supplierId, phone);
          break;
        case "get_supplier_orders":
          await this.handleRecentOrders(supplierId, phone);
          break;
        case "get_supplier_products":
          await this.handleGetProducts(supplierId, phone);
          break;
        case "update_supplier_price":
          await this.handleUpdatePrice(
            supplierId,
            phone,
            intent.params.productName,
            intent.params.newPriceNaira,
          );
          break;
        case "get_supplier_payouts":
          await this.handlePayouts(supplierId, phone);
          break;
        case "dispatch_supplier_order":
          await this.handleDispatchOrder(
            supplierId,
            phone,
            intent.params.orderId,
          );
          break;
        default:
          await this.sendSupplierMenu(phone);
      }
    } catch (error) {
      this.logger.error(`Error executing supplier command: ${error}`);
      await this.interactiveService.sendTextMessage(
        phone,
        "An error occurred. Please try again later.",
      );
    }
  }

  // =======================================================================
  // Intent Handlers
  // =======================================================================

  private async handleSalesSummary(
    supplierId: string,
    phone: string,
  ): Promise<void> {
    const orders = await this.prisma.order.findMany({
      where: {
        supplierId,
        status: { in: [OrderStatus.DELIVERED, OrderStatus.COMPLETED] },
      },
      select: { totalAmountKobo: true },
    });

    const totalRevenue = orders.reduce(
      (sum, o) => sum + Number(o.totalAmountKobo || 0),
      0,
    );

    const pendingOrders = await this.prisma.order.count({
      where: { supplierId, status: OrderStatus.PAID },
    });

    let msg = `Performance Summary:\n\n`;
    msg += `Completed Orders: ${orders.length}\n`;
    msg += `Total Revenue: ${this.formatNaira(totalRevenue)}\n`;
    msg += `Pending Fulfillment: ${pendingOrders}`;

    if (pendingOrders > 0) {
      msg += `\nYou have active orders awaiting dispatch.`;
    }

    await this.interactiveService.sendTextMessage(phone, msg);
  }

  private async handleRecentOrders(
    supplierId: string,
    phone: string,
  ): Promise<void> {
    const orders = await this.prisma.order.findMany({
      where: { supplierId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { product: true },
    });

    if (orders.length === 0) {
      await this.interactiveService.sendTextMessage(
        phone,
        "You have no wholesale orders yet.",
      );
      return;
    }

    await this.interactiveService.sendListMessage(
      phone,
      "Wholesale Orders received. 📦",
      "View Orders",
      [
        {
          title: "Recent Orders",
          rows: orders.map((o) => ({
            id: `view_wholesale_order_${o.id.substring(0, 8)}`,
            title: `#${o.id.slice(0, 8).toUpperCase()} - ${o.status}`,
            description: `${o.product?.name || "Product"} | Qty: ${o.quantity || "N/A"} | ${this.formatNaira(Number(o.totalAmountKobo))}`,
          })),
        },
      ],
    );
  }

  private async handleGetProducts(
    supplierId: string,
    phone: string,
  ): Promise<void> {
    const products = await this.prisma.supplierProduct.findMany({
      where: { supplierId, isActive: true },
      take: 10,
    });

    if (products.length === 0) {
      await this.interactiveService.sendTextMessage(
        phone,
        "No active products listed in the manufacturer catalogue.",
      );
      return;
    }

    await this.interactiveService.sendListMessage(
      phone,
      "Manufacturer Catalogue.",
      "View Products",
      [
        {
          title: "Active Products",
          rows: products.map((p) => ({
            id: `view_supplier_product_${p.id.substring(0, 8)}`,
            title: p.name,
            description: `Price: ${this.formatNaira(Number(p.wholesalePriceKobo))} | Min: ${p.minOrderQty} ${p.unit}`,
          })),
        },
      ],
    );
  }

  private async handleUpdatePrice(
    supplierId: string,
    phone: string,
    productName?: string,
    newPriceNaira?: number,
  ): Promise<void> {
    if (!productName || !newPriceNaira) {
      await this.interactiveService.sendTextMessage(
        phone,
        "To update a price, tell me the product and the new price, e.g. 'Update phone to 90000'.",
      );
      return;
    }

    const product = await this.prisma.supplierProduct.findFirst({
      where: {
        supplierId,
        name: { contains: productName, mode: "insensitive" },
      },
    });

    if (!product) {
      await this.interactiveService.sendTextMessage(
        phone,
        `Product "${productName}" not found.`,
      );
      return;
    }

    try {
      await this.prisma.supplierProduct.update({
        where: { id: product.id },
        data: { wholesalePriceKobo: BigInt(newPriceNaira * 100) },
      });
      await this.interactiveService.sendTextMessage(
        phone,
        `Price updated. ✅\n\n${product.name} is now ${this.formatNaira(newPriceNaira * 100)}.`,
      );
    } catch (error) {
      await this.interactiveService.sendTextMessage(
        phone,
        `❌ Failed to update price. Please try again.`,
      );
    }
  }

  private async handlePayouts(
    supplierId: string,
    phone: string,
  ): Promise<void> {
    const payouts = await this.prisma.payout.findMany({
      where: {
        order: { supplierId },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    if (payouts.length === 0) {
      await this.interactiveService.sendTextMessage(
        phone,
        "No payout history found.",
      );
      return;
    }

    let msg = `Recent Payouts:\n\n`;
    payouts.forEach((p) => {
      msg += `• ${this.formatNaira(Number(p.amountKobo))} - ${p.status} (${p.createdAt.toLocaleDateString()})\n`;
    });

    await this.interactiveService.sendTextMessage(phone, msg);
  }

  private async handleDispatchOrder(
    supplierId: string,
    phone: string,
    orderId?: string,
  ): Promise<void> {
    if (!orderId) {
      await this.interactiveService.sendTextMessage(
        phone,
        "Which order do you want to mark as dispatched? Tell me the Order ID.",
      );
      return;
    }

    const activeOrders = await this.prisma.order.findMany({
      where: {
        supplierId,
        status: OrderStatus.PAID,
      },
      select: { id: true },
    });

    const matches = activeOrders.filter((o) =>
      o.id.toLowerCase().startsWith(orderId.toLowerCase()),
    );

    if (matches.length === 0) {
      await this.interactiveService.sendTextMessage(
        phone,
        `Order #${orderId} not found or is not ready for dispatch.`,
      );
      return;
    }

    if (matches.length > 1) {
      await this.interactiveService.sendTextMessage(
        phone,
        `⚠️ Multiple orders (${matches.length}) match "${orderId}". Please provide a more specific reference ID.`,
      );
      return;
    }

    const order = matches[0];

    try {
      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.DISPATCHED },
      });
      await this.interactiveService.sendTextMessage(
        phone,
        `Order #${orderId.toUpperCase()} marked as dispatched. ✅`,
      );
    } catch (error) {
      await this.interactiveService.sendTextMessage(
        phone,
        `❌ Failed to update order status.`,
      );
    }
  }

  private formatNaira(kobo: number): string {
    const naira = kobo / 100;
    return `₦${naira.toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }

  private async handleViewWholesaleOrder(
    supplierId: string,
    phone: string,
    orderIdShort: string,
  ): Promise<void> {
    const allOrders = await this.prisma.order.findMany({
      where: { supplierId },
      include: { product: true, supplierProduct: true },
    });
    const order = allOrders.find((o) => o.id.startsWith(orderIdShort));

    if (!order) {
      await this.interactiveService.sendTextMessage(
        phone,
        "Order details not found.",
      );
      return;
    }

    const itemName =
      (order as any).product?.name ??
      (order as any).supplierProduct?.name ??
      "Unknown Item";
    let msg = `Order #${order.id.substring(0, 8).toUpperCase()}\n\n`;
    msg += `Status: ${order.status.replace(/_/g, " ")}\n`;
    msg += `Item: ${itemName}\n`;
    msg += `Quantity: ${order.quantity || "Not specified"}\n`;
    msg += `Amount: ${this.formatNaira(Number(order.totalAmountKobo))}\n`;
    msg += `Address: ${order.deliveryAddress || "Not specified"}\n\n`;

    const buttons = [];
    if (order.status === OrderStatus.PAID) {
      buttons.push({
        id: `dispatch_order_${orderIdShort}`,
        title: "Dispatch Order",
      });
    }
    buttons.push({ id: "show_supplier_menu", title: "Main Menu" });

    await this.interactiveService.sendReplyButtons(phone, msg, buttons);
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
