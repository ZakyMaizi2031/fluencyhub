import type { Course, Order } from "@/types/db";
import { getCourseById } from "@/lib/db/courses.queries";
import { createEnrollment } from "@/lib/db/enrollments.queries";
import { getOrderById, updateOrderStatus } from "@/lib/db/orders.queries";
import { approveProofsForOrder } from "@/lib/db/payment-proofs.queries";
import { notifyPaymentSuccess } from "@/lib/notifications";

export function generateOrderNumber() {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0");
  return `FH-${y}${m}${day}-${rand}`;
}

export async function markOrderPaid(order: Order, course: Course): Promise<Order> {
  const total = Number(order.totalAmount);
  const platformPct = Number(course.platformFeePct) / 100;
  const platformRevenue = (total * platformPct).toFixed(2);
  const instructorRevenue = (total - Number(platformRevenue)).toFixed(2);
  const updated = await updateOrderStatus(order.id, "paid", {
    paidAt: new Date(),
    instructorRevenue,
    platformRevenue,
  });
  await createEnrollment({
    userId: order.userId,
    courseId: order.courseId,
    orderId: order.id,
  });

  // Tembak notifikasi secara paralel (berjalan di background)
  notifyPaymentSuccess(order.id).catch(e => console.error("Gagal mengirim notifikasi:", e));

  return updated;
}

export async function approveManualOrder(orderId: number, verifiedBy?: number): Promise<Order> {
  const order = await getOrderById(orderId);
  if (!order) throw new Error("Order missing");
  if (order.status === "paid") {
    await createEnrollment({
      userId: order.userId,
      courseId: order.courseId,
      orderId: order.id,
    });
    if (verifiedBy) await approveProofsForOrder(order.id, verifiedBy);
    return order;
  }
  const course = await getCourseById(order.courseId);
  if (!course) throw new Error("Course missing");
  const paid = await markOrderPaid(order, course);
  if (verifiedBy) await approveProofsForOrder(order.id, verifiedBy);
  return paid;
}
