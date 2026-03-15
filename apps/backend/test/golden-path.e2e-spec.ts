import request from "supertest";
import { TestSetup } from "./helpers/test-setup";
import { OrderStatus } from "@prisma/client";

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
  
  let productId: string;

  // Track the flow IDs
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
    
    // Seed a product
    const category = await ctx.prisma.category.upsert({
      where: { slug: "building-materials" },
      update: {},
      create: { name: "building-materials", slug: "building-materials" }
    });
    
    const product = await ctx.prisma.product.create({
      data: {
        merchantId: merchantId,
        categoryId: category.id,
        name: "100 Bags of High-Grade Cement",
        categoryTag: category.name,
        pricePerUnitKobo: 500000,
        unit: "bags",
        isActive: true,
      }
    });
    productId = product.id;
  });

  afterAll(async () => {
    // 7. Teardown: Clean up the generated mock users/data to leave DB pristine
    // Clean up dependent tables first
    await ctx.prisma.payment.deleteMany();
    await ctx.prisma.orderEvent.deleteMany();
    await ctx.prisma.inventoryEvent.deleteMany();
    await ctx.prisma.order.deleteMany();
    await ctx.prisma.product.deleteMany();

    if (buyerId) await ctx.prisma.user.delete({ where: { id: buyerId } });
    const m = await ctx.prisma.merchantProfile.findUnique({
      where: { id: merchantId },
    });
    if (m?.userId) await ctx.prisma.user.delete({ where: { id: m.userId } });

    await ctx.close();
  });

  it("Step 1: Buyer creates a direct order", async () => {
    const res = await request(ctx.app.getHttpServer())
      .post("/orders/direct")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({
        productId,
        quantity: 100,
        deliveryAddress: "Lekki Phase 1 Construction Site",
        paymentMethod: "ESCROW",
        deliveryMethod: "MERCHANT_DELIVERY"
      })
      .expect(201); // Created

    expect(res.body).toHaveProperty("id");
    expect(res.body.status).toBe(OrderStatus.PENDING_PAYMENT);
    orderId = res.body.id;
  });

  it("Step 2: Simulate Paystack Webhook Success (Order goes PAID)", async () => {
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

  it("Step 3: Merchant dispatches the Order and extracts the OTP", async () => {
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

  it("Step 4: Buyer verifies the OTP to confirm Delivery", async () => {
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
