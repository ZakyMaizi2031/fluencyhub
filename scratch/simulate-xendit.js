const https = require("https");

const XENDIT_API_KEY = "xnd_development_i3u75eNlmUSCJxzeVVD2l1z9qApnzyP5yVOOW3FpaxDSr0VJXJRk7YCHfErjtONC";
const auth = "Basic " + Buffer.from(XENDIT_API_KEY + ":").toString("base64");

const data = JSON.stringify({
  bank_code: "BNI",
  bank_account_number: "8808999962871691",
  transfer_amount: 1799000,
});

const req = https.request(
  {
    hostname: "api.xendit.co",
    path: "/pool_virtual_accounts/simulate_payment",
    method: "POST",
    headers: {
      Authorization: auth,
      "Content-Type": "application/json",
      "Content-Length": data.length,
    },
  },
  (res) => {
    let raw = "";
    res.on("data", (chunk) => (raw += chunk));
    res.on("end", () => {
      console.log("Status:", res.statusCode);
      console.log("Body:", raw);
    });
  }
);

req.on("error", (e) => console.error(e));
req.write(data);
req.end();
