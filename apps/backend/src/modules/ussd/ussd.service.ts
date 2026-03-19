import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { SmsService } from "../notification/sms.service";
import { UssdCallbackDto } from "./ussd.dto";
import { PaymentService } from "../payment/payment.service";

@Injectable()
export class UssdService {
  private readonly logger = new Logger(UssdService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
    private readonly smsService: SmsService,
  ) {}

  async processSession(dto: UssdCallbackDto): Promise<string> {
    const { sessionId, text } = dto;
    const inputs = text ? text.split("*") : [];
    const level = inputs.length;

    this.logger.log(`Session ${sessionId} | level ${level} | text: ${text}`);

    try {
      // Level 0: Welcome menu
      if (level === 0) {
        return "CON Welcome to Swifta\n1. Pay for an order\n2. Check order status";
      }

      const mainChoice = inputs[0];

      if (mainChoice === "1") return this.paymentFlow(inputs, sessionId);
      if (mainChoice === "2") return this.statusFlow(inputs);

      return "END Invalid selection. Please try again.";
    } catch (error) {
      this.logger.error(
        `USSD error: ${error instanceof Error ? error.message : error}`,
        error instanceof Error ? error.stack : undefined,
      );
      return "END An error occurred. Please try again later.";
    }
  }

  // ═══ PAYMENT FLOW ═══

  private async paymentFlow(
    inputs: string[],
    sessionId: string,
  ): Promise<string> {
    const level = inputs.length;

    // Level 1: Ask for phone
    if (level === 1) {
      return "CON Enter the phone number linked to your Swifta account:";
    }

    // Level 2: Show pending orders
    if (level === 2) {
      const phone = this.toE164(inputs[1]);
      const user = await this.prisma.user.findFirst({ where: { phone } });

      if (!user) {
        return "END No Swifta account found for this number. Visit swifta.store to register.";
      }

      const orders = await this.getPendingOrders(user.id);

      if (orders.length === 0) {
        return "END You have no pending orders. Visit swifta.store to place an order.";
      }

      let response = "CON Your pending orders:\n";
      orders.forEach((order, i) => {
        const name = this.getOrderProductName(order);
        const amount = this.koboToNaira(order.totalAmountKobo);
        const shortId = order.id.slice(-4).toUpperCase();
        response += `${i + 1}. #${shortId} - ${name} - N${amount}\n`;
      });

      return response;
    }

    // Level 3: Confirmation screen
    if (level === 3) {
      const phone = this.toE164(inputs[1]);
      const user = await this.prisma.user.findFirst({ where: { phone } });
      if (!user) return "END Session expired. Please try again.";

      const orders = await this.getPendingOrders(user.id);
      const idx = parseInt(inputs[2], 10) - 1;

      if (idx < 0 || idx >= orders.length) {
        return "END Invalid selection. Please try again.";
      }

      const order = orders[idx];
      const name = this.getOrderProductName(order);
      const amount = this.koboToNaira(order.totalAmountKobo);
      const shortId = order.id.slice(-4).toUpperCase();

      return [
        "CON Confirm payment for:",
        `Order #${shortId} - ${name}`,
        `Amount: N${amount}`,
        "",
        "1. Confirm and pay",
        "2. Cancel",
      ].join("\n");
    }

    // Level 4: Process payment or cancel
    if (level === 4) {
      if (inputs[3] === "2") {
        return "END Payment cancelled. Your order is still pending.";
      }

      if (inputs[3] === "1") {
        const phone = this.toE164(inputs[1]);
        const user = await this.prisma.user.findFirst({ where: { phone } });
        if (!user) return "END Session expired. Please try again.";

        const orders = await this.getPendingOrders(user.id);
        const idx = parseInt(inputs[2], 10) - 1;
        const order = orders[idx];
        if (!order) return "END Order not found. Please try again.";

        // Use central PaymentService to initialize (ensures consistent idempotency/events)
        const paymentData = await this.paymentService.initialize(
          user.id,
          { orderId: order.id },
          `ussd-pay-${order.id}-${sessionId}`, // Stable idempotency key for the USSD session
        );

        // Send payment link via SMS using existing SmsService
        try {
          await this.smsService.sendSms(
            phone,
            `Swifta: Complete your payment of N${this.koboToNaira(order.totalAmountKobo)} here: ${paymentData.authorization_url}`,
          );
        } catch (smsErr) {
          this.logger.warn(
            `SMS send failed: ${smsErr instanceof Error ? smsErr.message : smsErr}`,
          );
        }

        const shortId = order.id.slice(-4).toUpperCase();
        return [
          `END Payment initiated for Order #${shortId}.`,
          "You will receive a payment link via SMS shortly.",
          "Thank you for using Swifta.",
        ].join("\n");
      }

      return "END Invalid selection.";
    }

    return "END Session ended.";
  }

  // ═══ STATUS FLOW ═══

  private async statusFlow(inputs: string[]): Promise<string> {
    const level = inputs.length;

    if (level === 1) {
      return "CON Enter the phone number linked to your Swifta account:";
    }

    if (level === 2) {
      const phone = this.toE164(inputs[1]);
      const user = await this.prisma.user.findFirst({ where: { phone } });

      if (!user) return "END No Swifta account found for this number.";

      const orders = await this.prisma.order.findMany({
        where: { buyerId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
      });

      if (orders.length === 0) return "END No orders found.";

      let response = "END Your recent orders:\n";
      orders.forEach((order) => {
        const shortId = order.id.slice(-4).toUpperCase();
        response += `- #${shortId}: ${this.formatStatus(order.status)}\n`;
      });

      return response;
    }

    return "END Session ended.";
  }

  // ═══ HELPERS ═══

  private async getPendingOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { buyerId: userId, status: "PENDING_PAYMENT" },
      include: { product: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 3,
    });
  }

  /**
   * Get product name from order.
   * Direct purchases: order.product.name (via productId relation)
   * Cart purchases: order.items is a Json array, use first item's name
   */
  private getOrderProductName(order: any): string {
    if (order.product?.name) {
      return this.truncate(order.product.name, 20);
    }

    if (order.items && Array.isArray(order.items) && order.items.length > 0) {
      const firstItem = order.items[0] as any;
      const name = firstItem.productName || firstItem.name || "Product";
      const suffix =
        order.items.length > 1 ? ` +${order.items.length - 1} more` : "";
      return this.truncate(name + suffix, 20);
    }

    return "Order";
  }

  /**
   * Convert any phone format to E.164 to match User.phone in database.
   * DB stores: +2348012345678
   * User might enter: 08012345678, 2348012345678, +2348012345678, 8012345678
   */
  private toE164(phone: string): string {
    const cleaned = phone.replace(/[\s\-()]/g, "");
    if (cleaned.startsWith("+")) return cleaned;
    if (cleaned.startsWith("234")) return "+" + cleaned;
    if (cleaned.startsWith("0")) return "+234" + cleaned.slice(1);
    return "+234" + cleaned;
  }

  private koboToNaira(kobo: bigint | number): string {
    return (Number(kobo) / 100).toLocaleString("en-NG");
  }

  private truncate(text: string, max: number): string {
    return text.length > max ? text.slice(0, max - 3) + "..." : text;
  }

  private formatStatus(status: string): string {
    const map: Record<string, string> = {
      PENDING_PAYMENT: "Awaiting payment",
      PAID: "Paid - awaiting dispatch",
      PREPARING: "Preparing",
      DISPATCHED: "Dispatched",
      IN_TRANSIT: "In transit",
      DELIVERED: "Delivered",
      COMPLETED: "Completed",
      CANCELLED: "Cancelled",
      DISPUTE: "Under dispute",
    };
    return map[status] || status;
  }
}
