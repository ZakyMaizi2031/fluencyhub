import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrderById, updateOrderStatus } from "@/lib/db/orders.queries";
import { createPaymentProof } from "@/lib/db/payment-proofs.queries";
import { auth } from "@/lib/session";

const Schema = z.object({
  orderId: z.number(),
  fileUrl: z.string().url(),
  fileName: z.string().optional(),
  fileSizeBytes: z.number().optional(),
  mimeType: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const order = await getOrderById(parsed.data.orderId);
  if (!order || order.userId !== Number(session.user.id)) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  const proof = await createPaymentProof(parsed.data);
  await updateOrderStatus(order.id, "pending_verification");
  return NextResponse.json({ data: proof }, { status: 201 });
}
