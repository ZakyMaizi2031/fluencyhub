const http = require("http");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// Baca .env.local secara manual (tanpa library dotenv)
const envPath = path.join(__dirname, "../.env.local");
let serverKey = "";
try {
  const envContent = fs.readFileSync(envPath, "utf-8");
  const match = envContent.match(/MIDTRANS_SERVER_KEY=["']?([^"'\n\r]+)["']?/);
  if (match) serverKey = match[1];
} catch (e) {
  console.log("⚠️ Peringatan: Gagal membaca file .env.local");
}

const args = process.argv.slice(2);
const orderId = args[0];
const amount = args[1] || "1799000.00"; 

if (!orderId) {
  console.log("❌ ERROR: Kamu lupa masukin nomor ordernya brok!");
  console.log("👉 Cara pakenya: node scratch/simulate-midtrans-webhook.js FH-20260922-123456 1499000.00");
  process.exit(1);
}

// 1. Siapkan data kunci untuk membuat Signature
if (!serverKey) {
  console.log("❌ ERROR: MIDTRANS_SERVER_KEY tidak ditemukan di .env.local!");
  process.exit(1);
}

const statusCode = "200";

// 2. Midtrans menggunakan SHA512(order_id + status_code + gross_amount + server_key)
// Format gross_amount di Midtrans sering pakai 2 desimal (contoh: 1499000.00)
// Pastikan amount yang kamu masukkan persis dengan yang ada di database!
let formattedAmount = String(amount);
if (!formattedAmount.includes(".")) {
  formattedAmount += ".00";
}

const rawString = orderId + statusCode + formattedAmount + serverKey;
const signatureKey = crypto.createHash("sha512").update(rawString).digest("hex");

// 3. Buat Payload Webhook palsu persis seperti kiriman server Midtrans
const data = JSON.stringify({
  order_id: orderId,
  status_code: statusCode,
  gross_amount: formattedAmount,
  signature_key: signatureKey,
  transaction_status: "settlement",
  transaction_id: "test-midtrans-sim-" + Math.floor(Math.random() * 100000),
  fraud_status: "accept",
  payment_type: "bank_transfer",
});

// 4. Tembak ke localhost:3000 (bypass internet)
console.log("🚀 Mengirim Webhook Lunas ke localhost...");
const req = http.request(
  {
    hostname: "localhost",
    port: 3000,
    path: "/api/webhooks/midtrans",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(data),
    },
  },
  (res) => {
    let raw = "";
    res.on("data", (chunk) => (raw += chunk));
    res.on("end", () => {
      if (res.statusCode === 200) {
        console.log(`✅ BERHASIL! Order ${orderId} sudah diset Lunas (Settlement) via Midtrans Webhook Simulator.`);
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
