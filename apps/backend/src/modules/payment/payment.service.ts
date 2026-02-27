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
import { PrismaService } from "../../prisma/prisma.service";
import { PaystackClient } from "./paystack.client";
import { OrderService } from "../order/order.service";
import { NotificationTriggerService } from "../notification/notification-trigger.service";
import { InitializePaymentDto } from "./dto/initialize-payment.dto";
import { RequestPayoutDto } from "./dto/request-payout.dto";
import {
  PaymentStatus,
  PaymentDirection,
  OrderStatus,
} from "@hardware-os/shared";
import * as crypto from "crypto";

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

    const totalKobo = order.totalAmountKobo + order.deliveryFeeKobo;

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
    const reference = payload.data?.reference;

    if (!transferCode && !reference) {
      this.logger.warn(`Transfer webhook missing transfer_code and reference`);
      return { status: "missing_identifiers" };
    }

    // Find the payout record by transfer code or reference
    const payout = await this.prisma.payment.findFirst({
      where: {
        direction: PaymentDirection.PAYOUT,
        OR: [
          ...(transferCode ? [{ paystackTransferRef: transferCode }] : []),
          ...(reference ? [{ paystackReference: reference }] : []),
        ],
      },
    });

    if (!payout) {
      this.logger.warn(
        `No payout found for transfer_code=${transferCode} / reference=${reference}`,
      );
      return { status: "unknown_transfer" };
    }

    // Map Paystack event to our status
    let newStatus: PaymentStatus;
    let eventType: string;

    if (event === "transfer.success") {
      newStatus = PaymentStatus.SUCCESS;
      eventType = "PAYOUT_CONFIRMED";
    } else if (event === "transfer.failed") {
      newStatus = PaymentStatus.FAILED;
      eventType = "PAYOUT_FAILED";
    } else {
      // transfer.reversed
      newStatus = PaymentStatus.FAILED;
      eventType = "PAYOUT_REVERSED";
    }

    // Update payout status + log event
    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payout.id },
        data: { status: newStatus },
      });

      await tx.paymentEvent.create({
        data: {
          paymentId: payout.id,
          eventType,
          payload: {
            paystackEvent: event,
            transferCode,
            reference,
            amount: payload.data?.amount,
            reason: payload.data?.reason,
          },
        },
      });
    });

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
      }

      // Notifications
      await this.notifications.triggerPaymentConfirmed(
        payment.order.buyerId,
        payment.order.merchantId,
        {
          orderId: payment.orderId,
          reference: reference, // Paystack reference
          amountKobo: payment.order.totalAmountKobo,
        },
      );

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
  //  INITIATE PAYOUT (Paystack Transfer API)
  // ──────────────────────────────────────────────

  async initiatePayout(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { merchantProfile: true },
    });
    if (!order) throw new NotFoundException("Order not found");

    if (order.status !== OrderStatus.COMPLETED) {
      throw new BadRequestException("Payout only allowed for COMPLETED orders");
    }

    // Check if payout already exists (idempotency)
    const existingPayout = await this.prisma.payment.findFirst({
      where: {
        orderId,
        direction: PaymentDirection.PAYOUT,
      },
    });
    if (existingPayout) {
      this.logger.log(`Payout already exists for order ${orderId}`);
      return existingPayout;
    }

    // Merchant must have bank details
    const merchant = order.merchantProfile;
    if (
      !merchant.bankCode ||
      !merchant.bankAccountNo ||
      !merchant.bankAccountName
    ) {
      throw new BadRequestException(
        "Merchant bank details incomplete — cannot process payout",
      );
    }

    const payoutReference = `payout-${crypto.randomUUID()}`;
    const payoutAmount = order.totalAmountKobo;

    // Create transfer recipient
    const recipient = await this.paystack.createTransferRecipient(
      merchant.bankCode,
      merchant.bankAccountNo,
      merchant.bankAccountName,
    );

    // Initiate transfer
    const transfer = await this.paystack.createTransfer(
      recipient.recipient_code,
      payoutAmount,
      payoutReference,
      `Payout for order ${orderId}`,
    );

    // Record payout Payment + event
    const payout = await this.prisma.$transaction(async (tx) => {
      const newPayout = await tx.payment.create({
        data: {
          orderId,
          paystackReference: payoutReference,
          paystackTransferRef: transfer.transfer_code,
          amountKobo: payoutAmount,
          currency: order.currency,
          status: PaymentStatus.SUCCESS,
          direction: PaymentDirection.PAYOUT,
          idempotencyKey: `payout-${orderId}`,
        },
      });

      await tx.paymentEvent.create({
        data: {
          paymentId: newPayout.id,
          eventType: "PAYOUT_INITIATED",
          payload: {
            transferCode: transfer.transfer_code,
            recipientCode: recipient.recipient_code,
            amountKobo: Number(payoutAmount),
            merchantId: merchant.id,
          },
        },
      });

      return newPayout;
    });

    // Notify merchant
    await this.notifications.triggerPayoutInitiated(merchant.id, orderId);

    this.logger.log(`Payout ${payout.id} for order ${orderId} initiated`);
    return payout;
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

    if (!merchantProfile.bankAccountNo || !merchantProfile.bankCode) {
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
        bankName: merchantProfile.bankCode, // Store bank code or name based on your logic
        accountNumber: merchantProfile.bankAccountNo,
        accountName: merchantProfile.bankAccountName,
      },
    });

    return {
      message: "Payout request received and queued for processing",
      amountRequested: dto.amount,
      status: "QUEUED",
      requestId: payoutRequest.id,
    };
  }
}
