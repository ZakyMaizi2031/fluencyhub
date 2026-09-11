import { NextResponse } from "next/server";
import { getOrderById } from "@/lib/db/orders.queries";
import { auth } from "@/lib/session";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const order = await getOrderById(Number(id));
  if (!order || (order.userId !== Number(session.user.id) && session.user.role !== "admin")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ data: { status: order.status, order } });
}
