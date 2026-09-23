const https = require("https");

const args = process.argv.slice(2);
const externalId = args[0];
const amount = args[1] || 1799000;

if (!externalId) {
  console.log("❌ ERROR: Masukkan External ID (nomor order)!");
  console.log("👉 Cara pakenya: node scratch/simulate-qris.js FH-20260921-123456 1799000");
  process.exit(1);
}

// Ganti dengan API Key kamu yang asli kalau berbeda
const XENDIT_API_KEY = "xnd_development_i3u75eNlmUSCJxzeVVD2l1z9qApnzyP5yVOOW3FpaxDSr0VJXJRk7YCHfErjtONC";
const auth = "Basic " + Buffer.from(XENDIT_API_KEY + ":").toString("base64");

// Payload jumlah pembayaran QRIS
const data = JSON.stringify({ amount: Number(amount) });

console.log("🔄 Mensimulasikan pembayaran QRIS...");

const req = https.request(
  {
    hostname: "api.xendit.co",
    path: `/qr_codes/${externalId}/payments/simulate`,
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
      console.log("Status API Xendit:", res.statusCode);
      if (res.statusCode === 200) {
         console.log("✅ Berhasil disimulasikan dari server Xendit!");
         console.log("Respons Xendit:", raw);
      } else {
         console.log("❌ Gagal disimulasikan.");
         console.log("Respons Xendit:", raw);
         console.log("\n(Note: Kalau gagal karena 'Verification', berarti akun Xendit kamu dikunci sampai kamu verifikasi KTP/Bisnis)");
      }
    });
  }
);

req.on("error", (e) => console.error("Network Error:", e.message));
req.write(data);
req.end();
