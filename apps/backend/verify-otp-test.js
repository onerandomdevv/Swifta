const Redis = require("ioredis");
const http = require("http");

async function triggerVerification(email) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ email });
    const options = {
      hostname: "localhost",
      port: 4000,
      path: "/auth/resend-verification",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": data.length,
      },
    };

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => resolve(JSON.parse(body)));
    });

    req.on("error", (error) => reject(error));
    req.write(data);
    req.end();
  });
}

async function verifyEmail(email, code) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ email, code });
    const options = {
      hostname: "localhost",
      port: 4000,
      path: "/auth/verify-email",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": data.length,
      },
    };

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () =>
        resolve({ status: res.statusCode, body: JSON.parse(body) }),
      );
    });

    req.on("error", (error) => reject(error));
    req.write(data);
    req.end();
  });
}

async function runTest() {
  const redis = new Redis("redis://localhost:6379");
  const email = "abdulkareemalameen75@gmail.com";

  try {
    console.log(`1. Triggering OTP for ${email}...`);
    const triggerRes = await triggerVerification(email);
    console.log("Trigger response:", triggerRes);

    console.log(`2. Waiting for Redis to update...`);
    await new Promise((r) => setTimeout(r, 1000));

    console.log(`3. Retrieving OTP from Redis...`);
    const otp = await redis.get(`email_otp:${email}`);
    if (!otp) {
      console.log("No OTP found in Redis for", email);
      process.exit(1);
    }

    console.log(`Found OTP in Redis: ${otp}`);
    console.log(
      `4. Testing the /auth/verify-email endpoint with OTP: ${otp}...`,
    );

    const verifyRes = await verifyEmail(email, otp);
    console.log(`Verify response status: ${verifyRes.status}`);
    console.log(`Verify response body:`, verifyRes.body);

    process.exit(0);
  } catch (error) {
    console.error("Error during test:", error);
    process.exit(1);
  }
}

runTest();
