import request from "supertest";
import { TestSetup } from "./helpers/test-setup";
import { OrderStatus } from "@prisma/client";
import { PaystackClient } from "../src/modules/payment/paystack.client";
import { PaymentService } from "../src/modules/payment/payment.service";

describe("Stock Integrity (e2e)", () => {
  jest.setTimeout(30000);

  // Patch BigInt serialization
  (BigInt.prototype as any).toJSON = function () {
    return this.toString();
  };

  let ctx: TestSetup;
  let buyerToken: string;
  let productId: string;
  let orderId: string;

  beforeAll(async () => {
    ctx = new TestSetup();
    await ctx.init();

    const buyerData = await ctx.createMockBuyer();
    buyerToken = buyerData.token;

    const merchantData = await ctx.createMockMerchant();
    const merchantId = merchantData.merchantProfile!.id;

    const category = await ctx.prisma.category.upsert({
      where: { slug: "electronics-test" },
      update: {},
      create: { name: "Electronics Test", slug: "electronics-test" },
    });

    const product = await ctx.prisma.product.create({
      data: {
        merchantId: merchantId,
        categoryId: category.id,
        name: "Test Gadget for Stock Test",
        categoryTag: category.name,
        pricePerUnitKobo: 10000,
        retailPriceKobo: 10000,
        wholesalePriceKobo: 8000,
        unit: "piece",
        isActive: true,
        productStockCache: {
          create: { stock: 100 },
        },
      },
    });
    productId = product.id;
  });

  afterAll(async () => {
    if (ctx) {
      await ctx.prisma.paymentEvent.deleteMany();
      await ctx.prisma.payment.deleteMany();
      await ctx.prisma.orderEvent.deleteMany();
      await ctx.prisma.inventoryEvent.deleteMany();
      await ctx.prisma.order.deleteMany();
      await ctx.prisma.productStockCache.deleteMany();
      await ctx.prisma.product.deleteMany();
      await ctx.close();
    }
  });

  it("should decrement stock only once during the entire lifecycle", async () => {
    // 1. Create Order (OrderService.createDirectOrder should decrement stock by 5)
    // We expect 100 -> 95
    const res = await request(ctx.app.getHttpServer())
      .post("/orders/direct")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({
        productId,
        quantity: 5,
        deliveryAddress: "Test Address",
        paymentMethod: "ESCROW",
        deliveryMethod: "MERCHANT_DELIVERY",
      })
      .expect(201);

    orderId = res.body.orderId;
    expect(orderId).toBeDefined();

    // Verify stock is 95
    const stockAfterOrder = await ctx.prisma.productStockCache.findUnique({
      where: { productId },
    });
    expect(Number(stockAfterOrder!.stock)).toBe(95);

    // Verify one inventory event exists for this order
    const eventsAfterOrder = await ctx.prisma.inventoryEvent.findMany({
      where: { productId, eventType: "ORDER_RESERVED" },
    });
    // One from creation
    expect(eventsAfterOrder.length).toBe(1);
    expect(Number(eventsAfterOrder[0].quantity)).toBe(5);

    // 2. Mock Paystack verification
    const paystackClient = ctx.app.get(PaystackClient);
    jest.spyOn(paystackClient, "verifyTransaction").mockResolvedValue({
      status: "success",
      amount: 50000,
      reference: `ref-${orderId}`,
      currency: "NGN",
      gateway_response: "Successful",
    } as any);

    // 3. Trigger Payment Success (Simulate Webhook)
    const paymentService = ctx.app.get(PaymentService);

    // Find the payment record created during OrderService.createDirectOrder -> paymentService.initialize
    const payment = await ctx.prisma.payment.findFirst({
      where: { orderId },
    });
    expect(payment).toBeDefined();

    // Directly call handleWebhook with a mock payload
    // This will trigger processSuccessfulPayment
    await paymentService.handleWebhook({
      event: "charge.success",
      data: { reference: payment!.paystackReference },
    });

    // 4. Verify stock is STILL 95 (Bug fix verification: it was 90 before the fix)
    const finalStock = await ctx.prisma.productStockCache.findUnique({
      where: { productId },
    });
    expect(Number(finalStock!.stock)).toBe(95);

    // Verify NO additional inventory events were created for this product/order
    const finalEvents = await ctx.prisma.inventoryEvent.findMany({
      where: { productId, eventType: "ORDER_RESERVED" },
    });
    expect(finalEvents.length).toBe(1);

    // Verify order status is PAID (transitioned by PaymentService)
    const finalOrder = await ctx.prisma.order.findUnique({
      where: { id: orderId },
    });
    expect(finalOrder!.status).toBe(OrderStatus.PAID);
  });
});
