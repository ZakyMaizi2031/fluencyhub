const https = require("https");

const XENDIT_API_KEY = "xnd_development_i3u75eNlmUSCJxzeVVD2l1z9qApnzyP5yVOOW3FpaxDSr0VJXJRk7YCHfErjtONC";
const auth = "Basic " + Buffer.from(XENDIT_API_KEY + ":").toString("base64");

const req = https.request(
  {
    hostname: "api.xendit.co",
    path: `/callback_virtual_accounts/4ae4db52-9f97-492e-b4e9-55e05388ddc5`,
    method: "GET",
    headers: {
      Authorization: auth,
      "Content-Type": "application/json",
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
req.end();
