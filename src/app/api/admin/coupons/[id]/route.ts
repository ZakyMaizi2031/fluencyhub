import { NextResponse } from "next/server";
import { updateCouponAdmin, toggleCouponActiveAdmin } from "@/lib/db/coupons.queries";
import { getSession } from "@/lib/auth/session";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = Number(params.id);
    if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const body = await req.json();

    if ("isActive" in body) {
      await toggleCouponActiveAdmin(id, Boolean(body.isActive));
      return NextResponse.json({ success: true });
    }

    const { code, description, discountType, discountValue, maxUses } = body;
    if (!code || !discountType || !discountValue) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await updateCouponAdmin(id, {
      code,
      description: description || null,
      discountType,
      discountValue,
      maxUses: maxUses ? Number(maxUses) : null,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("PATCH /api/admin/coupons/[id] error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
