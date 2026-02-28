const http = require("http");

const data = JSON.stringify({ email: "abdulkareemalameen75@gmail.com" });

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
  res.on("end", () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Body: ${body}`);
  });
});

req.on("error", (error) => {
  console.error("Error:", error);
});

req.write(data);
req.end();
