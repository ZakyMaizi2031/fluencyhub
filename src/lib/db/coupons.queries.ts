import type { Coupon } from "@/types/db";
import { sql } from "./client";
import { mapCoupon } from "./mappers";

export async function getCouponByCode(code: string): Promise<Coupon | null> {
  const rows = await sql`
    SELECT * FROM coupons WHERE UPPER(code) = UPPER(${code}) AND is_active = TRUE
  `;
  return rows[0] ? mapCoupon(rows[0] as Record<string, unknown>) : null;
}

export async function incrementCouponUse(id: number): Promise<void> {
  await sql`UPDATE coupons SET used_count = used_count + 1, updated_at = NOW() WHERE id = ${id}`;
}
