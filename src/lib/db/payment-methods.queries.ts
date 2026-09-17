import type { PaymentInstruction, PaymentMethod } from "@/types/db";
import { sql } from "./client";
import { mapPaymentInstruction, mapPaymentMethod } from "./mappers";

export async function getActivePaymentMethods(): Promise<PaymentMethod[]> {
  const rows = await sql`
    SELECT
      id, code, name, logo_url AS "logoUrl", type, provider,
      admin_fee_flat, admin_fee_pct, account_number, account_name, is_active, is_redirect, sort_order, created_at, updated_at
    FROM payment_methods WHERE is_active = TRUE ORDER BY sort_order ASC
  `;
  return rows.map((r) => mapPaymentMethod(r as Record<string, unknown>));
}

export async function getPaymentMethodById(id: number): Promise<PaymentMethod | null> {
  const rows = await sql`SELECT * FROM payment_methods WHERE id = ${id}`;
  return rows[0] ? mapPaymentMethod(rows[0] as Record<string, unknown>) : null;
}

export async function listAllPaymentMethodsAdmin(): Promise<PaymentMethod[]> {
  const rows = await sql`SELECT * FROM payment_methods ORDER BY sort_order ASC`;
  return rows.map((r) => mapPaymentMethod(r as Record<string, unknown>));
}

export async function setPaymentMethodActive(id: number, isActive: boolean): Promise<PaymentMethod> {
  const rows = await sql`
    UPDATE payment_methods SET is_active = ${isActive}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return mapPaymentMethod(rows[0] as Record<string, unknown>);
}

export async function getInstructionsForMethod(paymentMethodId: number): Promise<PaymentInstruction[]> {
  const rows = await sql`
    SELECT * FROM payment_instructions
    WHERE payment_method_id = ${paymentMethodId}
    ORDER BY sort_order ASC
  `;
  return rows.map((r) => mapPaymentInstruction(r as Record<string, unknown>));
}

export async function updatePaymentMethod(
  id: number,
  data: Partial<Omit<PaymentMethod, "id" | "createdAt" | "updatedAt">>
): Promise<PaymentMethod> {
  const rows = await sql`
    UPDATE payment_methods SET
      name = COALESCE(${data.name ?? null}, name),
      code = COALESCE(${data.code ?? null}, code),
      type = COALESCE(${data.type ?? null}, type),
      provider = COALESCE(${data.provider ?? null}, provider),
      admin_fee_flat = CASE WHEN ${data.adminFeeFlat !== undefined} THEN ${data.adminFeeFlat ?? null} ELSE admin_fee_flat END,
      admin_fee_pct = CASE WHEN ${data.adminFeePct !== undefined} THEN ${data.adminFeePct ?? null} ELSE admin_fee_pct END,
      account_number = COALESCE(${data.accountNumber ?? null}, account_number),
      account_name = COALESCE(${data.accountName ?? null}, account_name),
      logo_url = CASE WHEN ${data.logoUrl !== undefined} THEN ${data.logoUrl ?? null} ELSE logo_url END,
      is_redirect = COALESCE(${data.isRedirect ?? null}, is_redirect),
      is_active = COALESCE(${data.isActive ?? null}, is_active),
      sort_order = COALESCE(${data.sortOrder ?? null}, sort_order),
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return mapPaymentMethod(rows[0] as Record<string, unknown>);
}
