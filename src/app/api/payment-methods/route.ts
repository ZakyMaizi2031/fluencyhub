import { NextResponse } from "next/server";
import { getActivePaymentMethods } from "@/lib/db/payment-methods.queries";

export async function GET() {
  const methods = await getActivePaymentMethods();
  return NextResponse.json({ data: methods });
}
