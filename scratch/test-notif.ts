import { notifyPaymentSuccess } from "../src/lib/notifications";
import { config } from "dotenv";
config({ path: ".env.local" });

// Jalankan untuk order ID pertama (bisa diganti sesuai ID order yang ada di DB)
const orderIdToTest = 1;

console.log(`Menguji notifikasi untuk Order ID: ${orderIdToTest}...`);
notifyPaymentSuccess(orderIdToTest)
  .then(() => {
    console.log("Proses eksekusi fungsi selesai.");
  })
  .catch((e) => {
    console.error("Terjadi error di script test:", e);
  });
