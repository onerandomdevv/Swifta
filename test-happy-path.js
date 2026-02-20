const BASE_URL = "http://localhost:4000";
const MERCHANT_EMAIL = `merchant-${Date.now()}@test.com`;
const BUYER_EMAIL = `buyer-${Date.now()}@test.com`;
const PASSWORD = "Password123!";

async function request(method, path, body = null, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  console.log(`\n[${method}] ${path}`);
  console.log("Status:", res.status);

  if (!res.ok) {
    console.error("ERROR RESPONSE:", JSON.stringify(data, null, 2));
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }

  return data;
}

async function run() {
  try {
    console.log("Starting Happy Path Test...\n");

    // ─── 1. Register Merchant ───
    console.log("--- 1. Register Merchant ---");
    const merchantAuth = await request("POST", "/auth/register", {
      email: MERCHANT_EMAIL,
      password: PASSWORD,
      role: "MERCHANT",
      firstName: "Test",
      lastName: "Merchant",
      phone: `080${Math.floor(Math.random() * 100000000)}`,
      businessName: `Test Hardware Store ${Date.now()}`,
      address: "123 Market St",
    });
    const merchantToken = merchantAuth.data.accessToken;
    console.log("✓ Merchant registered");

    // ─── 2. Login Merchant ───
    console.log("--- 2. Login Merchant ---");
    const merchantLogin = await request("POST", "/auth/login", {
      email: MERCHANT_EMAIL,
      password: PASSWORD,
    });
    const loginToken = merchantLogin.data.accessToken;
    console.log(
      "✓ Merchant login OK, token:",
      loginToken ? "present" : "MISSING",
    );

    // ─── 3. Update Profile ───
    console.log("--- 3. Update Merchant Profile ---");
    await request(
      "PATCH",
      "/merchants/me",
      {
        businessName: "Updated Hardware Store",
      },
      loginToken,
    );
    console.log("✓ Profile updated");

    // ─── 4. Create Product ───
    console.log("--- 4. Create Product ---");
    const product = await request(
      "POST",
      "/products",
      {
        name: "Cement 50kg",
        description: "High quality dangote cement",
        unit: "bag",
        categoryTag: "building_materials",
        minOrderQuantity: 1,
      },
      loginToken,
    );
    const productId = product.data.id;
    console.log("✓ Product created:", productId);

    // ─── 5. Register Buyer ───
    console.log("--- 5. Register Buyer ---");
    const buyerAuth = await request("POST", "/auth/register", {
      email: BUYER_EMAIL,
      password: PASSWORD,
      role: "BUYER",
      firstName: "Test",
      lastName: "Buyer",
      phone: `090${Math.floor(Math.random() * 100000000)}`,
    });
    const buyerToken = buyerAuth.data.accessToken;
    console.log("✓ Buyer registered");

    // ─── 6. Get Catalogue ───
    console.log("--- 6. Get Catalogue ---");
    const catalogue = await request(
      "GET",
      "/products/catalogue",
      null,
      buyerToken,
    );
    const catalogueItems = catalogue.data || catalogue;
    console.log(
      `✓ Catalogue: ${Array.isArray(catalogueItems) ? catalogueItems.length : "?"} products`,
    );

    // ─── 7. Create RFQ ───
    console.log("--- 7. Create RFQ ---");
    const rfq = await request(
      "POST",
      "/rfqs",
      {
        productId: productId,
        quantity: 10,
        deliveryAddress: "456 Buyer Lane, Lagos",
        notes: "Need urgent delivery",
      },
      buyerToken,
    );
    const rfqId = rfq.data.id;
    console.log("✓ RFQ created:", rfqId);

    // ─── 8. Submit Quote (Merchant) ───
    console.log("--- 8. Submit Quote ---");
    const quote = await request(
      "POST",
      "/quotes",
      {
        rfqId: rfqId,
        unitPriceKobo: 500000, // ₦5000 per bag
        totalPriceKobo: 5000000, // ₦50,000 for 10 bags
        deliveryFeeKobo: 200000, // ₦2000 delivery
        validUntil: new Date(Date.now() + 86400000).toISOString(),
        notes: "Best price for bulk order",
      },
      loginToken,
    );
    const quoteId = quote.data.id;
    console.log("✓ Quote submitted:", quoteId);

    // ─── 9. Accept Quote (Buyer → creates Order) ───
    console.log("--- 9. Accept Quote ---");
    const order = await request(
      "POST",
      `/quotes/${quoteId}/accept`,
      {},
      buyerToken,
    );
    const orderId = order.data.id;
    console.log("✓ Order created:", orderId, "| Status:", order.data.status);

    if (order.data.status !== "PENDING_PAYMENT") {
      console.warn("⚠ Expected PENDING_PAYMENT, got", order.data.status);
    }

    // ─── 10. Initialize Payment ───
    console.log("--- 10. Initialize Payment ---");
    const paymentInit = await request(
      "POST",
      "/payments/initialize",
      {
        orderId: orderId,
      },
      buyerToken,
    );
    const payUrl =
      paymentInit.data?.authorization_url || paymentInit.data?.authorizationUrl;
    console.log("✓ Payment initialized. URL:", payUrl ? "present" : "N/A");

    // ─── 11. Check Notifications ───
    console.log("--- 11. Check Notifications ---");
    const buyerNotifs = await request(
      "GET",
      "/notifications",
      null,
      buyerToken,
    );
    const merchantNotifs = await request(
      "GET",
      "/notifications",
      null,
      loginToken,
    );
    const bLen = Array.isArray(buyerNotifs.data)
      ? buyerNotifs.data.length
      : "?";
    const mLen = Array.isArray(merchantNotifs.data)
      ? merchantNotifs.data.length
      : "?";
    console.log(
      `✓ Buyer notifications: ${bLen}, Merchant notifications: ${mLen}`,
    );

    console.log("\n✅ HAPPY PATH TEST COMPLETED SUCCESSFULLY");
  } catch (error) {
    console.error("\n❌ TEST FAILED:", error.message);
    process.exit(1);
  }
}

run();
