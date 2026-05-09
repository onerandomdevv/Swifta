import { LedgerService } from "./ledger.service";
import { LedgerDirection, LedgerEntryType } from "@prisma/client";

describe("LedgerService", () => {
  let service: LedgerService;

  beforeEach(() => {
    service = new LedgerService();
  });

  it("calculates escrow checkout totals", () => {
    const totals = service.calculateCheckoutTotals({
      subtotalKobo: 10_000n,
      deliveryFeeKobo: 1_500n,
      merchantTier: "UNVERIFIED",
      requestedPaymentMethod: "ESCROW",
    });

    expect(totals.paymentMethod).toBe("ESCROW");
    expect(totals.platformFeePercent).toBe(2);
    expect(totals.platformFeeKobo).toBe(200n);
    expect(totals.totalAmountKobo).toBe(11_700n);
  });

  it("allows direct payment only for tier 2 and tier 3 merchants", () => {
    const tierOneTotals = service.calculateCheckoutTotals({
      subtotalKobo: 10_000n,
      merchantTier: "TIER_1",
      requestedPaymentMethod: "DIRECT",
    });
    const tierTwoTotals = service.calculateCheckoutTotals({
      subtotalKobo: 10_000n,
      merchantTier: "TIER_2",
      requestedPaymentMethod: "DIRECT",
    });

    expect(tierOneTotals.paymentMethod).toBe("ESCROW");
    expect(tierTwoTotals.paymentMethod).toBe("DIRECT");
    expect(tierTwoTotals.platformFeePercent).toBe(1.5);
    expect(tierTwoTotals.platformFeeKobo).toBe(150n);
  });

  it("calculates payout using saved platform fee with legacy fallback", () => {
    expect(
      service.calculateOrderPayout({
        id: "order-with-fee",
        totalAmountKobo: 10_000n,
        platformFeeKobo: 200n,
      }),
    ).toMatchObject({
      grossAmountKobo: 10_000n,
      platformFeeKobo: 200n,
      payoutAmountKobo: 9_800n,
      usedLegacyFeeFallback: false,
    });

    expect(
      service.calculateOrderPayout({
        id: "legacy-order",
        totalAmountKobo: 10_000n,
        platformFeeKobo: null,
      }),
    ).toMatchObject({
      grossAmountKobo: 10_000n,
      platformFeeKobo: 0n,
      payoutAmountKobo: 10_000n,
      usedLegacyFeeFallback: true,
    });
  });

  it("calculates available merchant payout balance", () => {
    const balance = service.calculateAvailableBalance({
      grossOrdersKobo: 100_000n,
      platformFeesKobo: 2_000n,
      completedOrProcessingPayoutsKobo: 25_000n,
      pendingPayoutRequestsKobo: 10_000n,
    });

    expect(balance).toBe(63_000n);
  });

  it("uses deterministic idempotency keys for payment-received entries", async () => {
    const upsert = jest.fn().mockResolvedValue({ id: "ledger-entry-1" });
    const serviceWithPrisma = new LedgerService({
      ledgerEntry: { upsert },
    } as any);

    const input = {
      paymentId: "payment-1",
      orderId: "order-1",
      buyerId: "buyer-1",
      merchantId: "merchant-1",
      amountKobo: 10_000n,
      platformFeeKobo: 200n,
      paymentMethod: "ESCROW",
      reference: "tx-1",
    };

    await serviceWithPrisma.recordPaymentReceived(input);
    await serviceWithPrisma.recordPaymentReceived(input);

    const keys = upsert.mock.calls.map(([call]) => call.where.idempotencyKey);
    expect(keys).toEqual([
      "payment-received:payment-1",
      "platform-fee-assessed:payment-1",
      "escrow-held:payment-1",
      "payment-received:payment-1",
      "platform-fee-assessed:payment-1",
      "escrow-held:payment-1",
    ]);
  });

  it("records custom entries via idempotent upsert", async () => {
    const upsert = jest.fn().mockResolvedValue({ id: "custom-entry" });
    const serviceWithPrisma = new LedgerService({
      ledgerEntry: { upsert },
    } as any);

    await serviceWithPrisma.recordEntry({
      entryType: LedgerEntryType.PAYOUT_COMPLETED,
      direction: LedgerDirection.RELEASE,
      amountKobo: 9_800n,
      orderId: "order-1",
      payoutId: "payout-1",
      reference: "trf-1",
    });

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          idempotencyKey:
            "PAYOUT_COMPLETED:RELEASE:order-1:no-payment:payout-1:trf-1:9800",
        },
        create: expect.objectContaining({
          idempotencyKey:
            "PAYOUT_COMPLETED:RELEASE:order-1:no-payment:payout-1:trf-1:9800",
        }),
        update: {},
      }),
    );
  });

  it("reads an order ledger timeline chronologically", async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const serviceWithPrisma = new LedgerService({
      ledgerEntry: { findMany },
    } as any);

    await serviceWithPrisma.getOrderTimeline("order-1");

    expect(findMany).toHaveBeenCalledWith({
      where: { orderId: "order-1" },
      orderBy: { createdAt: "asc" },
    });
  });
});
