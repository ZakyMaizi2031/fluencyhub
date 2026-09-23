# Implementasi Notifikasi WhatsApp (Fonnte) & Email (Resend)

Fitur ini bertugas untuk mengirimkan notifikasi (pesan selamat) secara instan kepada *user* ketika pembayaran kelas mereka diverifikasi lunas (Order Confirmed), sesuai dengan Checklist PRD Fase 2.

## Open Questions
> [!IMPORTANT]
> **Persiapan Token & API Key (Wajib!)**
> Sebelum kita *coding*, pastikan kamu sudah melengkapi `.env.local` dengan dua kunci ini:
> 1. `FONNTE_TOKEN=` (Dapatkan dari *dashboard* fonnte.com > Device).
> 2. `RESEND_API_KEY=` (Dapatkan dari *dashboard* resend.com > API Keys).
>
> Kasih tahu saya kalau dua token ini sudah *ready* di file `.env.local` kamu!

## Proposed Changes

### 1. Modul Pusat Notifikasi
#### [NEW] `src/lib/notifications.ts`
Saya akan membuat sebuah *file* khusus yang bertugas merakit teks notifikasi dan mengirimkannya ke provider eksternal. File ini akan memiliki dua fungsi utama:
- `sendFonnteWhatsApp(phone, message)`: Menembak API Fonnte untuk mengirim pesan WhatsApp.
- `sendResendEmail(email, subject, text)`: Menembak API Resend untuk mengirim Email tanpa perlu mengatur *server* SMTP yang rumit.
- `notifyPaymentSuccess(orderId)`: Fungsi perakit (mengambil data Pembeli & Judul Kelas dari *database*, merakit kalimatnya, lalu mengirim WA dan Email secara paralel).

### 2. Memasang "Kail" (Trigger) di Sistem Pembayaran
#### [MODIFY] `src/lib/orders.ts`
Kita akan memodifikasi fungsi `markOrderPaid(order, course)`. Tepat setelah sistem berhasil mengubah status pembayaran menjadi `paid` dan membuatkan akses kelas (Enrollment), kita akan menyelipkan perintah untuk memanggil `notifyPaymentSuccess(order.id)`. 

*(Catatan: Proses pengiriman ini akan berjalan di latar belakang (background) agar sistem web tidak melambat saat menunggu balasan dari server Fonnte/Resend).*

## Verification Plan
1. **Validasi Kunci:** Mengecek apakah `FONNTE_TOKEN` dan `RESEND_API_KEY` sudah terbaca di *environment*.
2. **Simulasi Lunas:** Kita akan menggunakan perintah *script simulator webhook* (baik Xendit maupun Midtrans) yang sudah kita buat sebelumnya untuk melunaskan salah satu transaksi *pending*.
3. **Cek Notifikasi:**
   - Mengecek *Log* Terminal untuk memastikan API Fonnte dan Resend berhasil ditembak.
   - Kamu mengecek HP dan Inbox Email (nomor/email yang dipakai di akun pembeli tes) untuk melihat langsung wujud pesannya.
