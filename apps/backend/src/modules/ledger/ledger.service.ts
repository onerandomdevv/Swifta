import { Injectable, Logger } from "@nestjs/common";
import { LedgerDirection, LedgerEntryType, Prisma } from "@prisma/client";

import { PlatformConfig } from "../../config/platform.config";
import { PrismaService } from "../../prisma/prisma.service";

type PaymentMethodInput = "DIRECT" | "ESCROW" | string | undefined | null;

export interface CheckoutTotalsInput {
  subtotalKobo: bigint;
  deliveryFeeKobo?: bigint;
  merchantTier?: string | null;
  requestedPaymentMethod?: PaymentMethodInput;
}

export interface CheckoutTotals {
  subtotalKobo: bigint;
  deliveryFeeKobo: bigint;
  platformFeeKobo: bigint;
  platformFeePercent: number;
  totalAmountKobo: bigint;
  paymentMethod: "DIRECT" | "ESCROW";
}

export interface OrderPayoutInput {
  id?: string;
  totalAmountKobo: bigint | number | string;
  platformFeeKobo?: bigint | number | string | null;
}

export interface OrderPayoutBreakdown {
  grossAmountKobo: bigint;
  platformFeeKobo: bigint;
  payoutAmountKobo: bigint;
  usedLegacyFeeFallback: boolean;
}

export interface AvailableBalanceInput {
  grossOrdersKobo: bigint;
  platformFeesKobo: bigint;
  completedOrProcessingPayoutsKobo: bigint;
  pendingPayoutRequestsKobo: bigint;
}

export interface RecordLedgerEntryInput {
  entryType: LedgerEntryType;
  direction: LedgerDirection;
  amountKobo: bigint;
  currency?: string;
  orderId?: string | null;
  paymentId?: string | null;
  payoutId?: string | null;
  merchantId?: string | null;
  userId?: string | null;
  reference?: string | null;
  idempotencyKey?: string;
  metadata?: Prisma.InputJsonValue;
}

@Injectable()
export class LedgerService {
  private readonly logger = new Logger(LedgerService.name);

  constructor(private readonly prisma?: PrismaService) {}

  calculateCheckoutTotals(input: CheckoutTotalsInput): CheckoutTotals {
    const paymentMethod = this.resolvePaymentMethod(
      input.merchantTier,
      input.requestedPaymentMethod,
    );
    const merchantTier = input.merchantTier || "UNVERIFIED";
    const platformFeePercent = PlatformConfig.getPlatformFeePercent(
      merchantTier,
      paymentMethod,
    );
    const platformFeeKobo = PlatformConfig.calculateFeeKobo(
      input.subtotalKobo,
      merchantTier,
      paymentMethod,
    );
    const deliveryFeeKobo = input.deliveryFeeKobo ?? 0n;

    return {
      subtotalKobo: input.subtotalKobo,
      deliveryFeeKobo,
      platformFeeKobo,
      platformFeePercent,
      totalAmountKobo: input.subtotalKobo + platformFeeKobo + deliveryFeeKobo,
      paymentMethod,
    };
  }

  calculateOrderPayout(order: OrderPayoutInput): OrderPayoutBreakdown {
    const grossAmountKobo = BigInt(order.totalAmountKobo);
    const usedLegacyFeeFallback =
      order.platformFeeKobo === null || order.platformFeeKobo === undefined;
    const platformFeeKobo = usedLegacyFeeFallback
      ? 0n
      : BigInt(order.platformFeeKobo as bigint | number | string);
    const payoutAmountKobo = grossAmountKobo - platformFeeKobo;

    if (usedLegacyFeeFallback) {
      this.logger.warn(
        `Missing platformFeeKobo on order ${order.id || "unknown"}. Defaulting to 0 for legacy order payout.`,
      );
    }

    return {
      grossAmountKobo,
      platformFeeKobo,
      payoutAmountKobo,
      usedLegacyFeeFallback,
    };
  }

  calculateAvailableBalance(input: AvailableBalanceInput): bigint {
    return (
      input.grossOrdersKobo -
      input.platformFeesKobo -
      input.completedOrProcessingPayoutsKobo -
      input.pendingPayoutRequestsKobo
    );
  }

  async recordEntry(
    input: RecordLedgerEntryInput,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    if (!client) {
      throw new Error("LedgerService requires PrismaService to record entries");
    }

    const idempotencyKey =
      input.idempotencyKey || this.buildLedgerIdempotencyKey(input);

    return client.ledgerEntry.upsert({
      where: { idempotencyKey },
      update: {},
      create: {
        entryType: input.entryType,
        direction: input.direction,
        amountKobo: input.amountKobo,
        currency: input.currency || "NGN",
        orderId: input.orderId || null,
        paymentId: input.paymentId || null,
        payoutId: input.payoutId || null,
        merchantId: input.merchantId || null,
        userId: input.userId || null,
        reference: input.reference || null,
        idempotencyKey,
        metadata: input.metadata || {},
      },
    });
  }

  async recordCheckoutCreated(
    input: {
      orderId: string;
      buyerId: string;
      merchantId?: string | null;
      totals: CheckoutTotals;
      idempotencyKey: string;
    },
    tx?: Prisma.TransactionClient,
  ) {
    return this.recordEntry(
      {
        entryType: LedgerEntryType.CHECKOUT_CREATED,
        direction: LedgerDirection.INFO,
        amountKobo: input.totals.totalAmountKobo,
        orderId: input.orderId,
        merchantId: input.merchantId,
        userId: input.buyerId,
        reference: input.idempotencyKey,
        idempotencyKey: `checkout:${input.orderId}`,
        metadata: {
          subtotalKobo: input.totals.subtotalKobo.toString(),
          deliveryFeeKobo: input.totals.deliveryFeeKobo.toString(),
          platformFeeKobo: input.totals.platformFeeKobo.toString(),
          platformFeePercent: input.totals.platformFeePercent,
          paymentMethod: input.totals.paymentMethod,
        },
      },
      tx,
    );
  }

  async recordPaymentInitialized(
    input: {
      paymentId: string;
      orderId: string;
      buyerId: string;
      merchantId?: string | null;
      amountKobo: bigint;
      reference: string;
    },
    tx?: Prisma.TransactionClient,
  ) {
    return this.recordEntry(
      {
        entryType: LedgerEntryType.PAYMENT_INITIALIZED,
        direction: LedgerDirection.INFO,
        amountKobo: input.amountKobo,
        orderId: input.orderId,
        paymentId: input.paymentId,
        merchantId: input.merchantId,
        userId: input.buyerId,
        reference: input.reference,
        idempotencyKey: `payment-initialized:${input.paymentId}`,
      },
      tx,
    );
  }

  async recordPaymentReceived(
    input: {
      paymentId: string;
      orderId: string;
      buyerId: string;
      merchantId?: string | null;
      amountKobo: bigint;
      platformFeeKobo?: bigint | null;
      paymentMethod?: string | null;
      reference: string;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const platformFeeKobo = input.platformFeeKobo ?? 0n;
    const escrowHeldKobo = input.amountKobo - platformFeeKobo;

    await this.recordEntry(
      {
        entryType: LedgerEntryType.PAYMENT_RECEIVED,
        direction: LedgerDirection.CREDIT,
        amountKobo: input.amountKobo,
        orderId: input.orderId,
        paymentId: input.paymentId,
        merchantId: input.merchantId,
        userId: input.buyerId,
        reference: input.reference,
        idempotencyKey: `payment-received:${input.paymentId}`,
      },
      tx,
    );

    await this.recordEntry(
      {
        entryType: LedgerEntryType.PLATFORM_FEE_ASSESSED,
        direction: LedgerDirection.CREDIT,
        amountKobo: platformFeeKobo,
        orderId: input.orderId,
        paymentId: input.paymentId,
        merchantId: input.merchantId,
        userId: input.buyerId,
        reference: input.reference,
        idempotencyKey: `platform-fee-assessed:${input.paymentId}`,
      },
      tx,
    );

    if (input.paymentMethod === "ESCROW") {
      await this.recordEntry(
        {
          entryType: LedgerEntryType.ESCROW_HELD,
          direction: LedgerDirection.HOLD,
          amountKobo: escrowHeldKobo,
          orderId: input.orderId,
          paymentId: input.paymentId,
          merchantId: input.merchantId,
          userId: input.buyerId,
          reference: input.reference,
          idempotencyKey: `escrow-held:${input.paymentId}`,
        },
        tx,
      );
    }
  }

  async recordPayoutInitiated(
    input: {
      payoutId: string;
      orderId: string;
      merchantId: string;
      amountKobo: bigint;
      platformFeeKobo: bigint;
    },
    tx?: Prisma.TransactionClient,
  ) {
    return this.recordEntry(
      {
        entryType: LedgerEntryType.PAYOUT_INITIATED,
        direction: LedgerDirection.DEBIT,
        amountKobo: input.amountKobo,
        orderId: input.orderId,
        payoutId: input.payoutId,
        merchantId: input.merchantId,
        idempotencyKey: `payout-initiated:${input.payoutId}`,
        metadata: {
          platformFeeKobo: input.platformFeeKobo.toString(),
        },
      },
      tx,
    );
  }

  async recordPayoutFailed(
    input: {
      payoutId: string;
      orderId: string;
      merchantId: string;
      amountKobo: bigint;
      reason?: string | null;
    },
    tx?: Prisma.TransactionClient,
  ) {
    return this.recordEntry(
      {
        entryType: LedgerEntryType.PAYOUT_FAILED,
        direction: LedgerDirection.INFO,
        amountKobo: input.amountKobo,
        orderId: input.orderId,
        payoutId: input.payoutId,
        merchantId: input.merchantId,
        idempotencyKey: `payout-failed:${input.payoutId}`,
        metadata: { reason: input.reason || "unknown" },
      },
      tx,
    );
  }

  async recordPayoutCompleted(
    input: {
      payoutId: string;
      orderId: string;
      merchantId: string;
      amountKobo: bigint;
      reference?: string | null;
    },
    tx?: Prisma.TransactionClient,
  ) {
    return this.recordEntry(
      {
        entryType: LedgerEntryType.PAYOUT_COMPLETED,
        direction: LedgerDirection.RELEASE,
        amountKobo: input.amountKobo,
        orderId: input.orderId,
        payoutId: input.payoutId,
        merchantId: input.merchantId,
        reference: input.reference,
        idempotencyKey: `payout-completed:${input.payoutId}`,
      },
      tx,
    );
  }

  async getOrderTimeline(orderId: string) {
    if (!this.prisma) {
      throw new Error("LedgerService requires PrismaService to read timeline");
    }

    return this.prisma.ledgerEntry.findMany({
      where: { orderId },
      orderBy: { createdAt: "asc" },
    });
  }

  private buildLedgerIdempotencyKey(input: RecordLedgerEntryInput): string {
    return [
      input.entryType,
      input.direction,
      input.orderId || "no-order",
      input.paymentId || "no-payment",
      input.payoutId || "no-payout",
      input.reference || "no-reference",
      input.amountKobo.toString(),
    ].join(":");
  }

  private resolvePaymentMethod(
    merchantTier: string | null | undefined,
    requestedPaymentMethod: PaymentMethodInput,
  ): "DIRECT" | "ESCROW" {
    const isTier2Or3 = merchantTier === "TIER_2" || merchantTier === "TIER_3";
    return requestedPaymentMethod === "DIRECT" && isTier2Or3
      ? "DIRECT"
      : "ESCROW";
  }
}
