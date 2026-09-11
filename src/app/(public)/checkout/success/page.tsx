import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderStatusPoller } from "@/components/checkout/OrderStatusPoller";
import { getCourseById } from "@/lib/db/courses.queries";
import { getOrderByNumber } from "@/lib/db/orders.queries";
import { formatIdr } from "@/lib/utils/cn";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderNumber?: string }>;
}) {
  const { orderNumber } = await searchParams;
  if (!orderNumber) notFound();
  const order = await getOrderByNumber(orderNumber);
  if (!order) notFound();
  const course = await getCourseById(order.courseId);

  return (
    <main className="mx-auto max-w-lg px-4 py-16">
      <div className="card text-center">
        <h1 className="mb-2 text-2xl font-extrabold text-[var(--brand)]">
          {order.status === "paid"
            ? "Pembayaran Berhasil"
            : order.status === "pending_verification"
              ? "Bukti Diterima"
              : "Menunggu Pembayaran"}
        </h1>
        <p className="mb-4 text-sm text-[var(--text-3)]">
          Order {order.orderNumber} · {course?.title}
        </p>
        <p className="mb-6 text-lg font-extrabold">{formatIdr(order.totalAmount)}</p>
        {order.status !== "paid" ? (
          <OrderStatusPoller orderId={order.id} initialStatus={order.status} />
        ) : null}
        <p className="mb-6 text-sm text-[var(--text-3)]">
          {order.status === "paid"
            ? "Akses kelas sudah aktif."
            : order.status === "pending_verification"
              ? "Tim akan verifikasi bukti transfer. Setelah disetujui, kelas terbuka di dashboard."
              : "Selesaikan pembayaran di Snap / VA / e-wallet. Halaman ini akan terbarui setelah webhook terkonfirmasi."}
        </p>
        <Link href="/dashboard" className="btn btn-primary btn-lg">
          Ke Dashboard
        </Link>
      </div>
    </main>
  );
}
