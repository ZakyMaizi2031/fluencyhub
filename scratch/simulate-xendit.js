const https = require("https");

const XENDIT_API_KEY = "xnd_development_i3u75eNlmUSCJxzeVVD2l1z9qApnzyP5yVOOW3FpaxDSr0VJXJRk7YCHfErjtONC";
const auth = "Basic " + Buffer.from(XENDIT_API_KEY + ":").toString("base64");

const externalId = "FH-20260918-908374";

const req = https.request(
  {
    hostname: "api.xendit.co",
    path: `/callback_virtual_accounts?external_id=${externalId}`,
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
