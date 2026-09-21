const https = require("https");

const args = process.argv.slice(2);
const orderNumber = args[0];

if (!orderNumber) {
  console.log("❌ ERROR: Kamu lupa masukin nomor ordernya brok!");
  console.log("👉 Cara pakenya gini: node scratch/simulate-webhook.js FH-20260918-123456");
  process.exit(1);
}

// Payload universal yang bisa nembus semua jenis pembayaran di sistem kita (VA, QRIS, E-Wallet)
const data = JSON.stringify({
  event: "payment.succeeded",
  status: "PAID", 
  external_id: orderNumber,
  payment_id: "test-sim-" + Math.floor(Math.random() * 100000),
  amount: 1799000,
  transaction_timestamp: new Date().toISOString(),
});

const req = https.request(
  {
    hostname: "fluencyhub-theta.vercel.app", // atau localhost:3000 kalau ngetes lokal
    path: "/api/webhooks/xendit",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": data.length,
      "x-callback-token": "", 
    },
  },
  (res) => {
    let raw = "";
    res.on("data", (chunk) => (raw += chunk));
    res.on("end", () => {
      if (res.statusCode === 200) {
        console.log(`✅ BERHASIL! Order ${orderNumber} (QRIS/VA) sudah dibayar lunas.`);
        console.log("Coba refresh website/dashboard admin kamu brok!");
      } else {
        console.log(`❌ GAGAL! Status API: ${res.statusCode}`);
        console.log("Respons:", raw);
      }
    });
  }
);

req.on("error", (e) => console.error("Error koneksi:", e.message));
req.write(data);
req.end();
