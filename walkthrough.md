# Pembuatan Fitur Notifikasi Otomatis (Fonnte & Resend)

## Apa yang sudah dikerjakan?
Fitur notifikasi instan untuk pembayaran kelas yang sudah lunas berhasil dirakit dan diintegrasikan ke sistem utama!

### 1. `src/lib/notifications.ts` (Modul Pusat Notifikasi)
Saya telah membuat file ini dari nol. File ini bertugas sebagai "Tukang Pos":
- Mengambil data Pembeli (Nama, Email, Nomor WA) dan data Kelas (Judul, Harga) dari database.
- Merakit template teks notifikasi sesuai instruksi PRD (Fase 2).
- Mengirimkan pesan melalui API Fonnte (WhatsApp) dan Resend (Email).

### 2. `src/lib/orders.ts` (Integrasi Trigger Pembayaran)
Sistem ini dipasang langsung di jantung sistem pembayaran (`markOrderPaid`). 
Setiap kali status transaksi berubah menjadi Lunas (baik lewat Midtrans, Xendit, maupun konfirmasi manual Admin), sistem akan langsung "menembakkan" notifikasi tanpa jeda. Proses ini sengaja diatur berjalan di latar belakang (*background*) agar performa website saat pembayaran tidak melambat (tidak loading lama menunggu WA/Email terkirim).

## Cara Mengetes Fitur Ini
1. Pastikan server lokal kamu menyala (`npm run dev`) dan file `.env.local` sudah menyimpan *Token* yang benar.
2. Buat satu transaksi (pembelian kelas) menggunakan metode pembayaran apapun (disarankan Xendit atau Midtrans).
3. Salin **Nomor Order** (misal: `FH-12345`) dari tagihan tersebut.
4. Buka terminal VSCode dan jalankan script simulator kita untuk memaksa status menjadi Lunas:
   ```bash
   node scratch/simulate-midtrans-webhook.js NOMOR_ORDER_KAMU 1499000
   ```
5. Pantau terminal Next.js kamu. Kalau berhasil, akan muncul *log* berwarna putih seperti ini:
   `[Notifications] WhatsApp berhasil dikirim ke 628...`
   `[Notifications] Email berhasil dikirim ke ...`
6. Periksa WhatsApp dan Email di akun *user* pengetes kamu! Pesan otomatis pasti sudah mendarat.
