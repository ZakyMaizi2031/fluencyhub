import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { approveManualOrder } from "@/lib/orders";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;
  const { id } = await params;
  try {
    const order = await approveManualOrder(Number(id), Number(gate.session.user.id));
    return NextResponse.json({ data: { status: "approved", order } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Approve failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
