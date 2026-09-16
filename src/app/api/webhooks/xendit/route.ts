import { NextResponse } from "next/server";
import { getCourseById } from "@/lib/db/courses.queries";
import { getOrderByNumber, updateOrderStatus } from "@/lib/db/orders.queries";
import { createWebhookLog } from "@/lib/db/webhook-logs.queries";
import { markOrderPaid } from "@/lib/orders";
import { verifyXenditWebhook } from "@/lib/payment/xendit";
import { isWebhookDuplicate } from "@/lib/redis";

function pickOrderNumber(body: Record<string, unknown>): string {
  const data = (body.data as Record<string, unknown> | undefined) ?? {};
  return String(
    body.external_id ??
      body.reference_id ??
      data.reference_id ??
      data.external_id ??
      body.order_id ??
      "",
  );
}

function isPaid(body: Record<string, unknown>): boolean {
  const status = String(body.status ?? (body.data as { status?: string } | undefined)?.status ?? "")
    .toUpperCase();
  const event = String(body.event ?? "").toUpperCase();
  return (
    status === "PAID" ||
    status === "SUCCEEDED" ||
    status === "COMPLETED" ||
    event.includes("PAID") ||
    event.includes("SUCCEEDED")
  );
}

export async function POST(req: Request) {
  const token =
    req.headers.get("x-callback-token") ?? req.headers.get("X-CALLBACK-TOKEN") ?? "";
  const valid = verifyXenditWebhook(token);
  const body = (await req.json()) as Record<string, unknown>;
  const orderNumber = pickOrderNumber(body);

  await createWebhookLog({
    orderNumber,
    provider: "xendit",
    eventType: String(body.event ?? body.status ?? "unknown"),
    gatewayTxnId: String(body.id ?? (body.data as { id?: string } | undefined)?.id ?? ""),
    payloadJson: body,
    signatureValid: valid,
    processingStatus: valid ? "received" : "failed",
    errorMessage: valid ? null : "Invalid callback token",
  });

  if (!valid) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  const dupKey = `xendit:${orderNumber}:${String(body.status ?? body.event ?? "")}`;
  if (await isWebhookDuplicate(dupKey)) {
    return NextResponse.json({ data: { duplicate: true } });
  }

  const order = await getOrderByNumber(orderNumber);
  if (!order) {
    // Return 200 OK meskipun order tidak ditemukan supaya fitur "Tes dan Simpan" di dashboard Xendit 
    // (yang memakai data dummy) menganggap webhook berhasil dan berwarna hijau.
    return NextResponse.json({ message: "Order not found (Test payload ignored)" }, { status: 200 });
  }

  if (isPaid(body) && order.status !== "paid") {
    const course = await getCourseById(order.courseId);
    if (course) await markOrderPaid(order, course);
  } else if (["EXPIRED", "FAILED", "VOIDED"].includes(String(body.status ?? "").toUpperCase())) {
    await updateOrderStatus(order.id, body.status === "EXPIRED" ? "expired" : "failed");
  }

  return NextResponse.json({ data: { ok: true } });
}
