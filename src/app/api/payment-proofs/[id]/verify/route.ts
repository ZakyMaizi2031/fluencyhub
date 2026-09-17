import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrderById, updateOrderStatus } from "@/lib/db/orders.queries";
import { getPaymentProofById, updatePaymentProofStatus } from "@/lib/db/payment-proofs.queries";
import { approveManualOrder } from "@/lib/orders";
import { auth } from "@/lib/session";

const Schema = z.object({
  action: z.enum(["approve", "reject"]),
  note: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 422 });

  const proof = await getPaymentProofById(Number(id));
  if (!proof) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const order = await getOrderById(proof.orderId);
  if (!order) return NextResponse.json({ error: "Order missing" }, { status: 404 });

  if (parsed.data.action === "reject") {
    await updatePaymentProofStatus(proof.id, "rejected", Number(session.user.id), parsed.data.note);
    await updateOrderStatus(order.id, "pending", { notes: parsed.data.note ?? null });
    return NextResponse.json({ data: { status: "rejected" } });
  }

  const paid = await approveManualOrder(order.id, Number(session.user.id));
  return NextResponse.json({ data: { status: "approved", order: paid } });
}
