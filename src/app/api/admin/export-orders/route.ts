import { NextResponse } from "next/server";
import { listOrdersForAdmin } from "@/lib/db/orders.queries";
import { auth } from "@/lib/session";

export async function GET() {
  const session = await auth();
  
  // Pastikan hanya admin yang bisa mengakses data ini
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Mengambil data maksimal 5000 transaksi terbaru
  const orders = await listOrdersForAdmin(5000);

  // Membuat Header CSV
  const headers = [
    "Order ID",
    "Tanggal Transaksi",
    "Nama Pembeli",
    "Email Pembeli",
    "Judul Kelas",
    "Metode Pembayaran",
    "Total Tagihan",
    "Status"
  ].join(",");

  // Memformat baris data
  const rows = orders.map((order) => {
    return [
      order.orderNumber,
      order.createdAt instanceof Date ? order.createdAt.toISOString() : order.createdAt,
      // Mengamankan data nama yang mungkin mengandung koma
      `"${order.buyerName.replace(/"/g, '""')}"`,
      `"${order.buyerEmail}"`,
      `"${order.courseTitle.replace(/"/g, '""')}"`,
      order.methodName ?? "-",
      order.totalAmount,
      order.status
    ].join(",");
  });

  const csvContent = [headers, ...rows].join("\n");

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="laporan_transaksi.csv"',
    },
  });
}
