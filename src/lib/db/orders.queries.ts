import type { Order, OrderStatus } from "@/types/db";
import { sql } from "./client";
import { mapOrder } from "./mappers";

export async function getOrderById(id: number): Promise<Order | null> {
  const rows = await sql`SELECT * FROM orders WHERE id = ${id}`;
  return rows[0] ? mapOrder(rows[0] as Record<string, unknown>) : null;
}

export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  const rows = await sql`SELECT * FROM orders WHERE order_number = ${orderNumber}`;
  return rows[0] ? mapOrder(rows[0] as Record<string, unknown>) : null;
}

export async function getActiveOrderForUserCourse(
  userId: number,
  courseId: number,
): Promise<Order | null> {
  const rows = await sql`
    SELECT * FROM orders
    WHERE user_id = ${userId}
      AND course_id = ${courseId}
      AND status IN ('pending', 'awaiting_payment', 'pending_verification', 'paid')
    ORDER BY created_at DESC
    LIMIT 1
  `;
  return rows[0] ? mapOrder(rows[0] as Record<string, unknown>) : null;
}

export async function cancelOrder(id: number): Promise<Order> {
  const rows = await sql`
    UPDATE orders SET status = 'cancelled', updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return mapOrder(rows[0] as Record<string, unknown>);
}

export async function createOrder(data: {
  userId: number;
  courseId: number;
  paymentMethodId: number;
  orderNumber: string;
  subtotal: string;
  adminFee: string;
  discountAmount: string;
  totalAmount: string;
  couponCode?: string | null;
}): Promise<Order> {
  const rows = await sql`
    INSERT INTO orders (
      user_id, course_id, payment_method_id, order_number,
      status, subtotal, admin_fee, discount_amount, total_amount, coupon_code
    ) VALUES (
      ${data.userId}, ${data.courseId}, ${data.paymentMethodId}, ${data.orderNumber},
      'pending', ${data.subtotal}, ${data.adminFee}, ${data.discountAmount},
      ${data.totalAmount}, ${data.couponCode ?? null}
    )
    RETURNING *
  `;
  return mapOrder(rows[0] as Record<string, unknown>);
}

export async function updateOrderStatus(
  id: number,
  status: OrderStatus,
  extra?: {
    vaNumber?: string | null;
    gatewayTransactionId?: string | null;
    gatewayPaymentUrl?: string | null;
    paidAt?: Date | null;
    instructorRevenue?: string | null;
    platformRevenue?: string | null;
    expiresAt?: Date | null;
    notes?: string | null;
  },
): Promise<Order> {
  const rows = await sql`
    UPDATE orders SET
      status = ${status},
      va_number = COALESCE(${extra?.vaNumber ?? null}, va_number),
      gateway_transaction_id = COALESCE(${extra?.gatewayTransactionId ?? null}, gateway_transaction_id),
      gateway_payment_url = COALESCE(${extra?.gatewayPaymentUrl ?? null}, gateway_payment_url),
      paid_at = COALESCE(${extra?.paidAt ?? null}, paid_at),
      instructor_revenue = COALESCE(${extra?.instructorRevenue ?? null}, instructor_revenue),
      platform_revenue = COALESCE(${extra?.platformRevenue ?? null}, platform_revenue),
      expires_at = COALESCE(${extra?.expiresAt ?? null}, expires_at),
      notes = COALESCE(${extra?.notes ?? null}, notes),
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return mapOrder(rows[0] as Record<string, unknown>);
}

export async function listOrdersForUser(userId: number): Promise<Order[]> {
  const rows = await sql`
    SELECT * FROM orders WHERE user_id = ${userId} ORDER BY created_at DESC
  `;
  return rows.map((r) => mapOrder(r as Record<string, unknown>));
}
