import request = require("supertest");
import { TestSetup } from "./helpers/test-setup";
import { OrderStatus, RFQStatus } from "@prisma/client";

describe("The Golden Path (e2e)", () => {
  jest.setTimeout(30000);

  // Patch BigInt serialization for the NestJS testing container
  (BigInt.prototype as any).toJSON = function () {
    return Number(this);
  };

  let ctx: TestSetup;

  let buyerToken: string;
  let buyerId: string;

  let merchantToken: string;
  let merchantId: string;

  // Track the flow IDs
  let rfqId: string;
  let quoteId: string;
  let orderId: string;
  let deliveryOtp: string;

  beforeAll(async () => {
    ctx = new TestSetup();
    await ctx.init();

    // 1. Seed Database with isolated test users
    const buyerData = await ctx.createMockBuyer();
    buyerToken = buyerData.token;
    buyerId = buyerData.user.id;

    const merchantData = await ctx.createMockMerchant();
    merchantToken = merchantData.token;
    merchantId = merchantData.merchantProfile!.id;
  });

  afterAll(async () => {
    // 7. Teardown: Clean up the generated mock users/data to leave DB pristine
    // Clean up dependent tables first
    await ctx.prisma.payment.deleteMany();
    await ctx.prisma.orderEvent.deleteMany();
    await ctx.prisma.inventoryEvent.deleteMany();
    await ctx.prisma.order.deleteMany();
    await ctx.prisma.quote.deleteMany();
    await ctx.prisma.rfq.deleteMany();

    if (buyerId) await ctx.prisma.user.delete({ where: { id: buyerId } });
    const m = await ctx.prisma.merchantProfile.findUnique({
      where: { id: merchantId },
    });
    if (m?.userId) await ctx.prisma.user.delete({ where: { id: m.userId } });

    await ctx.close();
  });

  it("Step 1: Buyer creates a custom RFQ", async () => {
    const res = await request(ctx.app.getHttpServer())
      .post("/rfqs")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({
        targetMerchantId: merchantId,
        unlistedItemDetails: {
          name: "100 Bags of High-Grade Cement",
          description: "Needed for commercial foundation",
          unit: "bags",
        },
        quantity: 100,
        deliveryAddress: "Lekki Phase 1 Construction Site",
        notes: "Please quote ASAP",
      })
      .expect(201); // Created

    expect(res.body).toHaveProperty("id");
    expect(res.body.status).toBe(RFQStatus.OPEN);
    rfqId = res.body.id;
  });

  it("Step 2: Merchant views the RFQ and submits a Quote", async () => {
    // Optional: View the RFQ first
    await request(ctx.app.getHttpServer())
      .get(`/rfqs/${rfqId}`)
      .set("Authorization", `Bearer ${merchantToken}`)
      .expect(200);

    // Submit Quote (100 bags @ 5,000 NGN each = 500k total + 20k delivery)
    const res = await request(ctx.app.getHttpServer())
      .post(`/quotes`)
      .set("Authorization", `Bearer ${merchantToken}`)
      .send({
        rfqId,
        unitPriceKobo: 500000, // 5000 * 100
        totalPriceKobo: 50000000, // (5000 * 100) * 100 bags
        deliveryFeeKobo: 2000000, // 20000 * 100
        notes: "Price guaranteed for next 24 hours.",
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
      .expect(201);

    expect(res.body).toHaveProperty("id");
    expect(res.body.totalPriceKobo).toBe(50000000); // (5000 * 100) * 100 bags
    quoteId = res.body.id;
  });

  it("Step 3: Buyer accepts the Quote and an Order is generated", async () => {
    const res = await request(ctx.app.getHttpServer())
      .post(`/quotes/${quoteId}/accept`)
      .set("Authorization", `Bearer ${buyerToken}`)
      .expect(201);

    expect(res.body).toHaveProperty("id");
    expect(res.body.status).toBe(OrderStatus.PENDING_PAYMENT);
    orderId = res.body.id;
  });

  it("Step 4: Simulate Paystack Webhook Success (Order goes PAID)", async () => {
    // Since we cant actually bounce through Paystack in an E2E test,
    // we simulate the backend state transition directly on the DB.
    await ctx.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.PAID },
    });

    const verify = await ctx.prisma.order.findUnique({
      where: { id: orderId },
    });
    expect(verify!.status).toBe(OrderStatus.PAID);
  });

  it("Step 5: Merchant dispatches the Order and extracts the OTP", async () => {
    const res = await request(ctx.app.getHttpServer())
      .post(`/orders/${orderId}/dispatch`)
      .set("Authorization", `Bearer ${merchantToken}`)
      .expect(201);

    // The dispatch response should return the OTP to the merchant
    expect(res.body).toHaveProperty("deliveryOtp");
    expect(res.body.deliveryOtp.length).toBe(6);
    deliveryOtp = res.body.deliveryOtp;

    // Validate DB status
    const verify = await ctx.prisma.order.findUnique({
      where: { id: orderId },
    });
    expect(verify!.status).toBe(OrderStatus.DISPATCHED);
  });

  it("Step 6: Buyer verifies the OTP to confirm Delivery", async () => {
    const res = await request(ctx.app.getHttpServer())
      .post(`/orders/${orderId}/confirm-delivery`)
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ otp: deliveryOtp })
      .expect(201);

    expect(res.body.message).toBe("Delivery confirmed");

    // Verify final DB conditions
    const finalOrder = await ctx.prisma.order.findUnique({
      where: { id: orderId },
    });
    expect(finalOrder!.status).toBe(OrderStatus.COMPLETED);
  });
});
