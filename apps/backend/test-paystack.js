const secretKey = process.env.PAYSTACK_SECRET_KEY;
if (!secretKey) {
  console.error("❌ ERROR: PAYSTACK_SECRET_KEY environment variable is not set.");
  process.exit(1);
}
const baseUrl = "https://api.paystack.co";

async function testPaystack() {
  const response = await fetch(`${baseUrl}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: "test@example.com",
      amount: 500000,
      reference: `tx-${Date.now()}`,
    }),
  });

  const json = await response.json();
  console.log("Paystack response:", JSON.stringify(json, null, 2));
}

testPaystack().catch(console.error);
