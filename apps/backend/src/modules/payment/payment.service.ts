import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { PrismaService } from "../../prisma/prisma.service";
import { PaystackClient } from "./paystack.client";
import { OrderService } from "../order/order.service";
import { DvaService } from "../dva/dva.service";
import { NotificationTriggerService } from "../notification/notification-trigger.service";
import { InitializePaymentDto } from "./dto/initialize-payment.dto";
import { RequestPayoutDto } from "./dto/request-payout.dto";
import {
  PaymentStatus,
  PaymentDirection,
  OrderStatus,
  UserRole,
} from "@hardware-os/shared";
import * as crypto from "crypto";
import { PAYOUT_QUEUE, LOGISTICS_QUEUE } from "../../queue/queue.constants";

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private prisma: PrismaService,
    private paystack: PaystackClient,
    @Inject(forwardRef(() => OrderService))
    private orderService: OrderService,
    private notifications: NotificationTriggerService,
    private config: ConfigService,
    @InjectQueue(PAYOUT_QUEUE) private payoutQueue: Queue,
    @InjectQueue(LOGISTICS_QUEUE) private logisticsQueue: Queue,
    @Inject(forwardRef(() => DvaService))
    private dvaService: DvaService,
  ) {}

  // ──────────────────────────────────────────────
  //  INITIALIZE PAYMENT (idempotent by orderId)
  // ──────────────────────────────────────────────

  async initialize(
    buyerId: string,
    dto: InitializePaymentDto,
    idempotencyKey: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });
    if (!order) throw new NotFoundException("Order not found");

    // Ownership check: only the buyer can pay
    if (order.buyerId !== buyerId) {
      throw new ForbiddenException("Access denied");
    }

    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new BadRequestException("Order is not in pending payment state");
    }

    // Generate reference and get buyer email
    const buyer = await this.prisma.user.findUnique({
      where: { id: buyerId },
    });
    if (!buyer) throw new NotFoundException("Buyer not found");

    // Callback URL from config (not hardcoded)
    const frontendUrl = this.config.get<string>(
      "app.frontendUrl",
      "http://localhost:3000",
    );
    const callbackUrl = `${frontendUrl}/buyer/orders/payment/callback`;

    // Total amount in kobo (subtotal + platform fee + shipping)
    // IMPORTANT: order.totalAmountKobo already includes the delivery fee in the current logic.
    // Adding it again here would double-charge the shipping cost.
    const totalKobo = order.totalAmountKobo;

    // Idempotency: if payment already exists for this order, return existing
    const existingPayment = await this.prisma.payment.findFirst({
      where: {
        orderId: dto.orderId,
        direction: PaymentDirection.INFLOW,
        status: PaymentStatus.INITIALIZED,
      },
    });

    if (existingPayment) {
      this.logger.log(
        `Updating existing payment ${existingPayment.id} for order ${dto.orderId} with new reference`,
      );

      const newReference = `tx-${crypto.randomUUID()}`;

      // We must fetch a fresh access_code from Paystack using a NEW reference
      // because access_codes expire and Paystack rejects duplicate references.
      const freshPaystackResponse = await this.paystack.initializeTransaction(
        buyer.email,
        totalKobo,
        newReference,
        callbackUrl,
      );

      // Update the database to reflect the new reference for the retry
      await this.prisma.payment.update({
        where: { id: existingPayment.id },
        data: { paystackReference: newReference },
      });

      return {
        ...freshPaystackResponse,
        reference: newReference,
        paymentId: existingPayment.id,
        message:
          "Payment already initialized — returning fresh access code with new reference",
      };
    }

    const paymentReference = `tx-${crypto.randomUUID()}`;

    // Initialize with Paystack
    const paystackResponse = await this.paystack.initializeTransaction(
      buyer.email,
      totalKobo,
      paymentReference,
      callbackUrl,
    );

    // Create Payment record + PaymentEvent
    const payment = await this.prisma.$transaction(async (tx) => {
      const newPayment = await tx.payment.create({
        data: {
          orderId: order.id,
          paystackReference: paymentReference,
          amountKobo: totalKobo,
          currency: order.currency,
          status: PaymentStatus.INITIALIZED,
          direction: PaymentDirection.INFLOW,
          idempotencyKey: idempotencyKey || paymentReference,
        },
      });

      await tx.paymentEvent.create({
        data: {
          paymentId: newPayment.id,
          eventType: "INITIALIZED",
          payload: {
            reference: paymentReference,
            amountKobo: Number(totalKobo),
            orderId: order.id,
          },
        },
      });

      return newPayment;
    });

    this.logger.log(`Payment ${payment.id} initialized for order ${order.id}`);

    return {
      ...paystackResponse,
      paymentReference,
      paymentId: payment.id,
    };
  }

  // ──────────────────────────────────────────────
  //  WEBHOOK HANDLER (idempotent processing)
  // ──────────────────────────────────────────────

  async handleWebhook(payload: any) {
    const event = payload.event;
    this.logger.log(`Webhook received: ${event}`);

    // ── CHARGE SUCCESS (buyer payment) ──
    if (event === "charge.success") {
      return this.handleChargeSuccess(payload);
    }

    // ── DVA EVENTS ──
    if (event === "dedicatedaccount.assign.success") {
      await this.dvaService.handleDvaAssignSuccess(payload.data);
      return { status: "received" };
    }
    if (event === "dedicatedaccount.assign.failed") {
      await this.dvaService.handleDvaAssignFailed(payload.data);
      return { status: "received" };
    }

    // ── TRANSFER EVENTS (merchant payout) ──
    if (
      event === "transfer.success" ||
      event === "transfer.failed" ||
      event === "transfer.reversed"
    ) {
      return this.handleTransferEvent(payload);
    }

    this.logger.log(`Ignoring webhook event: ${event}`);
    return { status: "ignored" };
  }

  /**
   * Handle charge.success — buyer payment confirmed by Paystack.
   */
  private async handleChargeSuccess(payload: any) {
    const reference = payload.data?.reference;
    if (!reference) {
      this.logger.warn("Webhook missing reference");
      return { status: "missing_reference" };
    }

    const payment = await this.prisma.payment.findUnique({
      where: { paystackReference: reference },
    });

    if (!payment) {
      this.logger.warn(`No payment found for reference: ${reference}`);
      return { status: "unknown_reference" };
    }

    // Idempotency: skip if already processed
    if (payment.status === PaymentStatus.SUCCESS) {
      this.logger.log(`Payment ${payment.id} already processed, skipping`);
      return { status: "already_processed" };
    }

    try {
      await this.processSuccessfulPayment(payment.id, reference);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      this.logger.error(
        `Webhook processing failed for ${reference}: ${message}`,
      );
    }

    return { status: "received" };
  }

  /**
   * Handle transfer.success / transfer.failed / transfer.reversed
   * These fire after the platform initiates a payout to a merchant's bank.
   */
  private async handleTransferEvent(payload: any) {
    const event = payload.event as string;
    const transferCode = payload.data?.transfer_code;

    if (!transferCode) {
      this.logger.warn(`Transfer webhook missing transfer_code`);
      return { status: "missing_identifiers" };
    }

    // Find the payout record by transfer code
    const payout = await this.prisma.payout.findFirst({
      where: {
        paystackTransferCode: transferCode,
      },
      include: {
        order: {
          select: { id: true },
        },
        merchant: {
          select: { id: true, bankCode: true, bankAccountNumber: true },
        },
      },
    });

    if (!payout) {
      this.logger.warn(`No payout found for transfer_code=${transferCode}`);
      return { status: "unknown_transfer" };
    }

    if (event === "transfer.success") {
      await this.prisma.payout.update({
        where: { id: payout.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      await this.prisma.order.update({
        where: { id: payout.orderId },
        data: { payoutStatus: "COMPLETED" },
      });

      await this.notifications.triggerPayoutCompleted(payout.merchantId, {
        amountKobo: payout.amountKobo.toString(),
        orderRef: payout.orderId.slice(0, 8).toUpperCase(),
        bankName: "Bank Account", // Can be dynamically expanded
      });
    } else {
      // transfer.failed or transfer.reversed
      await this.prisma.payout.update({
        where: { id: payout.id },
        data: {
          status: "FAILED",
          failureReason: payload.data?.reason || event,
        },
      });

      await this.prisma.order.update({
        where: { id: payout.orderId },
        data: { payoutStatus: "FAILED" },
      });

      await this.notifications.triggerPayoutFailed(payout.merchantId, {
        orderRef: payout.orderId.slice(0, 8).toUpperCase(),
      });
    }

    this.logger.log(
      `Transfer ${event} processed for payout ${payout.id} (order: ${payout.orderId})`,
    );

    return { status: "received" };
  }

  // ──────────────────────────────────────────────
  //  MANUAL VERIFICATION (Fallback for no webhook)
  // ──────────────────────────────────────────────

  async verifyPayment(reference: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { paystackReference: reference },
    });
    if (!payment) throw new NotFoundException("Payment not found");

    if (payment.status === PaymentStatus.SUCCESS) {
      return { status: "already_verified", paymentId: payment.id };
    }

    try {
      await this.processSuccessfulPayment(payment.id, reference);
      return { status: "verified", paymentId: payment.id };
    } catch (err) {
      this.logger.error(`Manual verification failed for ${reference}`, err);
      throw new BadRequestException("Verification failed");
    }
  }

  // ──────────────────────────────────────────────
  //  PROCESS SUCCESSFUL PAYMENT (verify + transition)
  // ──────────────────────────────────────────────

  private async processSuccessfulPayment(paymentId: string, reference: string) {
    // Verify with Paystack API
    const verification = await this.paystack.verifyTransaction(reference);

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });

    if (!payment) throw new NotFoundException("Payment not found");

    if (verification.status === "success") {
      // Amount verification: Paystack returns amount in kobo
      const paystackAmountKobo = BigInt(verification.amount);
      if (paystackAmountKobo !== payment.amountKobo) {
        this.logger.error(
          `Amount mismatch! Paystack: ${paystackAmountKobo}, Expected: ${payment.amountKobo}`,
        );

        await this.prisma.paymentEvent.create({
          data: {
            paymentId: payment.id,
            eventType: "AMOUNT_MISMATCH",
            payload: {
              paystackAmount: Number(paystackAmountKobo),
              expectedAmount: Number(payment.amountKobo),
              reference,
            },
          },
        });

        throw new BadRequestException("Payment amount mismatch");
      }

      // Update payment status + log event
      await this.prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.SUCCESS,
            verifiedAt: new Date(),
          },
        });

        await tx.paymentEvent.create({
          data: {
            paymentId: payment.id,
            eventType: "SUCCESS",
            payload: {
              reference,
              amountKobo: Number(paystackAmountKobo),
              gatewayResponse: verification.gateway_response,
              verifiedAt: new Date().toISOString(),
            },
          },
        });
      });

      // Transition order via state machine (PENDING_PAYMENT → PAID)
      if (payment.order.status === OrderStatus.PENDING_PAYMENT) {
        await this.orderService.transitionBySystem(
          payment.orderId,
          OrderStatus.PENDING_PAYMENT,
          OrderStatus.PAID,
          { paymentId: payment.id, reference },
        );

        // Clear cart items for the products in this order
        const orderItems = payment.order.items as any[];
        if (Array.isArray(orderItems) && orderItems.length > 0) {
          const productIds = orderItems
            .map((item: any) => item.productId)
            .filter(Boolean);
          if (productIds.length > 0) {
            const deleted = await this.prisma.cartItem.deleteMany({
              where: {
                buyerId: payment.order.buyerId,
                productId: { in: productIds },
              },
            });
            this.logger.log(
              `Cleared ${deleted.count} cart items for order ${payment.orderId}`,
            );
          }
        }
      }

      const orderData = await this.prisma.order.findUnique({
        where: { id: payment.orderId },
        include: { product: true, user: true },
      });

      if (
        orderData &&
        orderData.quoteId === null &&
        orderData.productId !== null &&
        orderData.quantity !== null
      ) {
        // DIRECT PURCHASE LOGIC
        const deliveryOtp = crypto.randomInt(100000, 999999).toString();

        await this.prisma.$transaction(async (tx) => {
          // Reserve inventory
          await tx.inventoryEvent.create({
            data: {
              productId: orderData.productId!,
              merchantId: orderData.merchantId,
              eventType: "ORDER_RESERVED",
              quantity: -orderData.quantity!,
              referenceId: orderData.id,
              notes: "Direct order reservation",
            },
          });

          await tx.productStockCache.upsert({
            where: { productId: orderData.productId! },
            create: {
              productId: orderData.productId!,
              stock: -orderData.quantity!,
            },
            update: { stock: { decrement: orderData.quantity! } },
          });

          // Save OTP on the Order
          await tx.order.update({
            where: { id: orderData.id },
            data: { deliveryOtp },
          });
        });

        // Notifications
        await this.notifications.triggerDirectPurchaseConfirmed(
          payment.order.buyerId,
          payment.order.merchantId,
          {
            orderId: payment.orderId,
            reference: reference,
            productName: orderData.product?.name || "Product",
            buyerName:
              `${orderData.user?.firstName || "Buyer"} ${orderData.user?.lastName || ""}`.trim(),
            quantity: orderData.quantity,
            amountKobo: payment.order.totalAmountKobo,
            deliveryAddress: orderData.deliveryAddress || undefined,
          },
        );

        // DIRECT PAYMENT: Queue immediate payout (don't wait for OTP delivery confirmation)
        if (orderData.paymentMethod === "DIRECT") {
          try {
            this.logger.log(
              `DIRECT payment — queueing immediate payout for order ${orderData.id}`,
            );
            await this.payoutQueue.add(
              "process-payout",
              { orderId: orderData.id },
              { jobId: `payout-${orderData.id}` },
            );
          } catch (payoutErr) {
            this.logger.error(
              `Failed to queue immediate payout for DIRECT order ${orderData.id}: ${
                payoutErr instanceof Error ? payoutErr.message : "Unknown"
              }`,
            );
          }
        }
      } else {
        // STANDARD RFQ QUOTE ACCEPTANCE LOGIC
        await this.notifications.triggerPaymentConfirmed(
          payment.order.buyerId,
          payment.order.merchantId,
          {
            orderId: payment.orderId,
            reference: reference, // Paystack reference
            amountKobo: payment.order.totalAmountKobo,
          },
        );
      }

      // DISPATCH LOGISTICS IF PLATFORM LOGISTICS IS SELECTED
      if (payment.order.deliveryMethod === "PLATFORM_LOGISTICS") {
        this.logger.log(
          `Order ${payment.orderId} uses platform logistics. Auto-queueing booking.`,
        );
        try {
          await this.logisticsQueue.add(
            "book-pickup",
            { orderId: payment.orderId },
            { jobId: `book-logistics-${payment.orderId}` },
          );
        } catch (queueErr) {
          this.logger.error(
            `Failed to queue logistics booking for order ${payment.orderId}`,
            queueErr,
          );
        }
      }

      this.logger.log(
        `Payment ${payment.id} SUCCESS for order ${payment.orderId}`,
      );
    } else {
      // Payment failed
      this.logger.error(
        `Paystack verification failed for ${reference}: ${verification.status}`,
      );
      await this.prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.FAILED },
        });

        await tx.paymentEvent.create({
          data: {
            paymentId: payment.id,
            eventType: "FAILED",
            payload: {
              reference,
              verificationStatus: verification.status,
              gatewayResponse: verification.gateway_response,
            },
          },
        });
      });

      this.logger.warn(
        `Payment ${payment.id} FAILED for order ${payment.orderId}`,
      );
    }
  }

  // ──────────────────────────────────────────────
  //  RESOLVE ACCOUNT (Proxy to Paystack)
  // ──────────────────────────────────────────────

  async resolveAccount(accountNumber: string, bankCode: string) {
    try {
      return await this.paystack.resolveAccount(accountNumber, bankCode);
    } catch (err) {
      if (err instanceof Error) {
        throw new BadRequestException(err.message);
      }
      throw new BadRequestException("Could not resolve account");
    }
  }

  async getBanks() {
    try {
      return await this.paystack.getBanks();
    } catch (err) {
      this.logger.error("Failed to fetch banks", err);
      throw new BadRequestException("Could not fetch banks");
    }
  }

  // ──────────────────────────────────────────────
  //  REQUEST PAYOUT (Manual request by Merchant)
  // ──────────────────────────────────────────────

  async requestPayout(merchantId: string, dto: RequestPayoutDto) {
    this.logger.log(
      `Payout requested by merchant ${merchantId} for amount ${dto.amount}`,
    );

    const merchantProfile = await this.prisma.merchantProfile.findUnique({
      where: { id: merchantId },
    });

    if (!merchantProfile) {
      throw new NotFoundException("Merchant profile not found");
    }

    // 4. Validate merchant has bank details
    if (!merchantProfile.bankAccountNumber || !merchantProfile.bankCode) {
      throw new BadRequestException(
        "Please set your bank details in settings before requesting a payout.",
      );
    }

    // Create the payout request in the database
    const payoutRequest = await this.prisma.payoutRequest.create({
      data: {
        merchantId,
        amountKobo: dto.amount,
        status: "PENDING",
        bankName: merchantProfile.bankCode, // Note: This might need resolving to real bank name
        accountNumber: merchantProfile.bankAccountNumber,
        accountName: merchantProfile.settlementAccountName,
      },
    });

    // Notify Admins
    const admins = await this.prisma.user.findMany({
      where: {
        role: { in: [UserRole.SUPER_ADMIN, UserRole.OPERATOR] },
      },
      select: { id: true },
    });

    const adminIds = admins.map((a) => a.id);
    if (adminIds.length > 0) {
      await this.notifications.triggerPayoutRequested(adminIds, {
        merchantId,
        merchantName: merchantProfile.businessName || "Unknown Merchant",
        amountKobo: dto.amount.toString(),
        requestId: payoutRequest.id,
      });
    }

    // Notify Merchant
    await this.notifications.triggerMerchantPayoutRequestedConfirmation(
      merchantProfile.userId,
      {
        amountKobo: dto.amount.toString(),
        requestId: payoutRequest.id,
      },
    );

    return {
      message: "Payout request received and queued for processing",
      amountRequested: dto.amount,
      status: "QUEUED",
      requestId: payoutRequest.id,
    };
  }
}
