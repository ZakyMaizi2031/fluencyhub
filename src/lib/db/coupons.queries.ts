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

export async function listAdminCoupons(): Promise<Coupon[]> {
  const rows = await sql`SELECT * FROM coupons ORDER BY created_at DESC`;
  return rows.map((r) => mapCoupon(r as Record<string, unknown>));
}

export async function createCouponAdmin(params: {
  code: string;
  description: string | null;
  discountType: "percentage" | "fixed";
  discountValue: string;
  maxUses: number | null;
}): Promise<void> {
  await sql`
    INSERT INTO coupons (
      code, description, discount_type, discount_value, max_uses, is_active, created_at, updated_at
    ) VALUES (
      ${params.code}, ${params.description}, ${params.discountType}, ${params.discountValue}, ${params.maxUses}, TRUE, NOW(), NOW()
    )
  `;
}

export async function updateCouponAdmin(id: number, params: {
  code: string;
  description: string | null;
  discountType: "percentage" | "fixed";
  discountValue: string;
  maxUses: number | null;
}): Promise<void> {
  await sql`
    UPDATE coupons
    SET
      code = ${params.code},
      description = ${params.description},
      discount_type = ${params.discountType},
      discount_value = ${params.discountValue},
      max_uses = ${params.maxUses},
      updated_at = NOW()
    WHERE id = ${id}
  `;
}

export async function toggleCouponActiveAdmin(id: number, isActive: boolean): Promise<void> {
  await sql`
    UPDATE coupons SET is_active = ${isActive}, updated_at = NOW() WHERE id = ${id}
  `;
}
