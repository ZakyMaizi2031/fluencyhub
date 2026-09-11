import { NextResponse } from "next/server";
import { getCourseById } from "@/lib/db/courses.queries";
import { getOrderByNumber, updateOrderStatus } from "@/lib/db/orders.queries";
import { createWebhookLog } from "@/lib/db/webhook-logs.queries";
import { markOrderPaid } from "@/lib/orders";
import { verifyMidtransSignature } from "@/lib/payment/midtrans";
import { isWebhookDuplicate } from "@/lib/redis";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    order_id?: string;
    status_code?: string;
    gross_amount?: string;
    signature_key?: string;
    transaction_status?: string;
    transaction_id?: string;
    fraud_status?: string;
  };

  const orderId = body.order_id ?? "";
  const valid = verifyMidtransSignature(
    orderId,
    body.status_code ?? "",
    body.gross_amount ?? "",
    body.signature_key ?? "",
  );

  await createWebhookLog({
    orderNumber: orderId,
    provider: "midtrans",
    eventType: body.transaction_status ?? "unknown",
    gatewayTxnId: body.transaction_id ?? null,
    payloadJson: body,
    signatureValid: valid,
    processingStatus: valid ? "received" : "failed",
    errorMessage: valid ? null : "Invalid signature",
  });

  if (!valid) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  const dupKey = `midtrans:${body.transaction_id ?? orderId}:${body.transaction_status}`;
  if (await isWebhookDuplicate(dupKey)) {
    return NextResponse.json({ data: { duplicate: true } });
  }

  const order = await getOrderByNumber(orderId);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const status = body.transaction_status;
  const fraudOk = !body.fraud_status || body.fraud_status === "accept";
  if ((status === "settlement" || status === "capture") && fraudOk && order.status !== "paid") {
    const course = await getCourseById(order.courseId);
    if (course) await markOrderPaid(order, course);
  } else if (status === "expire") {
    await updateOrderStatus(order.id, "expired");
  } else if (status === "deny" || status === "cancel") {
    await updateOrderStatus(order.id, "failed");
  }

  return NextResponse.json({ data: { ok: true } });
}
