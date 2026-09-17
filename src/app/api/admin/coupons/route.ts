import { NextResponse } from "next/server";
import { createCouponAdmin } from "@/lib/db/coupons.queries";
import { auth } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { code, description, discountType, discountValue, maxUses } = body;

    if (!code || !discountType || !discountValue) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await createCouponAdmin({
      code,
      description: description || null,
      discountType,
      discountValue,
      maxUses: maxUses ? Number(maxUses) : null,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("POST /api/admin/coupons error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
