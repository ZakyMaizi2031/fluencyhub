import { NextResponse } from "next/server";
import { getInstructionsForMethod, getPaymentMethodById } from "@/lib/db/payment-methods.queries";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const method = await getPaymentMethodById(Number(id));
  if (!method || !method.isActive) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const instructions = await getInstructionsForMethod(method.id);
  return NextResponse.json({ data: { method, instructions } });
}
