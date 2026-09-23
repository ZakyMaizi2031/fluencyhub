import { getOrderById } from "./db/orders.queries";
import { getUserById } from "./db/users.queries";
import { getCourseById } from "./db/courses.queries";

const FONNTE_API_URL = "https://api.fonnte.com/send";
const RESEND_API_URL = "https://api.resend.com/emails";

/**
 * Mengirim pesan WhatsApp menggunakan API Fonnte.
 */
export async function sendFonnteWhatsApp(targetPhone: string, message: string) {
  const token = process.env.FONNTE_TOKEN;
  if (!token) {
    console.warn("[Notifications] FONNTE_TOKEN tidak ditemukan di environment.");
    return false;
  }

  try {
    const response = await fetch(FONNTE_API_URL, {
      method: "POST",
      headers: {
        "Authorization": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target: targetPhone,
        message: message,
        typing: false,
        delay: "2",
      }),
    });

    const result = await response.json();
    if (!response.ok || !result.status) {
      console.error("[Notifications] Fonnte Error:", result);
      return false;
    }
    
    console.log(`[Notifications] WhatsApp berhasil dikirim ke ${targetPhone}`);
    return true;
  } catch (error) {
    console.error("[Notifications] Gagal memanggil API Fonnte:", error);
    return false;
  }
}

/**
 * Mengirim Email menggunakan API Resend.
 */
export async function sendResendEmail(toEmail: string, subject: string, htmlContent: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[Notifications] RESEND_API_KEY tidak ditemukan di environment.");
    return false;
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "FluencyHub <onboarding@resend.dev>", // Ganti dengan domain asli jika sudah punya
        to: toEmail,
        subject: subject,
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("[Notifications] Resend Error:", errorData);
      return false;
    }

    console.log(`[Notifications] Email berhasil dikirim ke ${toEmail}`);
    return true;
  } catch (error) {
    console.error("[Notifications] Gagal memanggil API Resend:", error);
    return false;
  }
}

/**
 * Fungsi utama yang dipanggil saat pembayaran lunas.
 * Akan menarik data dari database, merakit teks, dan mengirim notifikasi paralel.
 */
export async function notifyPaymentSuccess(orderId: number) {
  try {
    const order = await getOrderById(orderId);
    if (!order) return;

    const [user, course] = await Promise.all([
      getUserById(order.userId),
      getCourseById(order.courseId)
    ]);

    if (!user || !course) return;

    // 1. Siapkan Pesan WhatsApp
    const formatter = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" });
    const formattedTotal = formatter.format(Number(order.totalAmount));

    const waMessage = `*FluencyHub - Pembayaran Berhasil!* 🎉\n\nHalo *${user.name}*, pembayaran kamu untuk kelas *${course.title}* sebesar ${formattedTotal} telah berhasil diverifikasi.\n\nSilakan login ke *Dashboard* kamu dan mulai belajar sekarang:\n👉 https://fluencyhub.id/dashboard\n\nSemoga lancar belajarnya brok! 🔥`;

    // 2. Siapkan Pesan Email (HTML)
    const emailSubject = `Pembayaran Berhasil: ${course.title} 🚀`;
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #4F46E5;">Pembayaran Berhasil! 🎉</h2>
        <p>Halo <strong>${user.name}</strong>,</p>
        <p>Terima kasih! Pembayaran kamu untuk kelas <strong>${course.title}</strong> sebesar <strong>${formattedTotal}</strong> telah berhasil kami verifikasi.</p>
        <p>Kelas kamu sudah aktif dan bisa langsung diakses melalui dashboard.</p>
        <a href="https://fluencyhub.id/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">Masuk ke Dashboard</a>
        <br><br>
        <p style="color: #666; font-size: 14px;">Salam hangat,<br>Tim FluencyHub</p>
      </div>
    `;

    // 3. Kirim secara paralel tanpa saling menunggu (non-blocking)
    const promises = [];
    
    if (user.whatsappNumber) {
      // Pastikan awalan 0 diganti jadi 62
      let targetPhone = user.whatsappNumber.replace(/[^0-9]/g, "");
      if (targetPhone.startsWith("0")) targetPhone = "62" + targetPhone.slice(1);
      
      promises.push(sendFonnteWhatsApp(targetPhone, waMessage));
    }
    
    promises.push(sendResendEmail(user.email, emailSubject, emailHtml));

    await Promise.allSettled(promises);

  } catch (error) {
    console.error("[Notifications] Error saat memproses notifikasi:", error);
  }
}
