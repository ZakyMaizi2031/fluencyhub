import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { setPaymentMethodActive } from "@/lib/db/payment-methods.queries";

const Schema = z.object({
  isActive: z.boolean(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;
  const { id } = await params;
  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  const method = await setPaymentMethodActive(Number(id), parsed.data.isActive);
  return NextResponse.json({ data: method });
}
