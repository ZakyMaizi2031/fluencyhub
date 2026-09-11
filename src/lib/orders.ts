import type { Course, Order } from "@/types/db";
import { createEnrollment } from "@/lib/db/enrollments.queries";
import { updateOrderStatus } from "@/lib/db/orders.queries";

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
  return updated;
}
