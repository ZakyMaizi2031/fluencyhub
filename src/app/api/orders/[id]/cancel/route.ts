import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/session";
import { getOrderById, cancelOrder } from "@/lib/db/orders.queries";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const orderId = Number(resolvedParams.id);
    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const order = await getOrderById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Pastikan order ini milik user yang sedang login
    if (order.userId !== Number(session.user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (order.status === "paid") {
      return NextResponse.json({ error: "Cannot cancel a paid order" }, { status: 400 });
    }

    if (order.status === "cancelled") {
      return NextResponse.json({ error: "Order is already cancelled" }, { status: 400 });
    }

    const cancelledOrder = await cancelOrder(orderId);
    return NextResponse.json({ data: cancelledOrder });
  } catch (error) {
    console.error("Cancel order error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
