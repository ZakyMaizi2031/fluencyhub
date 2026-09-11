import { NextResponse } from "next/server";
import { z } from "zod";
import { getCouponByCode } from "@/lib/db/coupons.queries";

const Schema = z.object({
  code: z.string().min(1),
  courseId: z.number(),
  amount: z.number(),
});

export async function POST(req: Request) {
  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 422 });
  const coupon = await getCouponByCode(parsed.data.code);
  if (!coupon) return NextResponse.json({ error: "Kupon tidak valid" }, { status: 400 });
  if (coupon.applicableCourseId && coupon.applicableCourseId !== parsed.data.courseId) {
    return NextResponse.json({ error: "Kupon tidak berlaku untuk kelas ini" }, { status: 400 });
  }
  const now = new Date();
  if (coupon.validFrom && now < coupon.validFrom) {
    return NextResponse.json({ error: "Kupon belum aktif" }, { status: 400 });
  }
  if (coupon.validUntil && now > coupon.validUntil) {
    return NextResponse.json({ error: "Kupon kedaluwarsa" }, { status: 400 });
  }
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return NextResponse.json({ error: "Kupon habis" }, { status: 400 });
  }
  const discountAmount =
    coupon.discountType === "percentage"
      ? Math.round((parsed.data.amount * Number(coupon.discountValue)) / 100)
      : Number(coupon.discountValue);
  return NextResponse.json({ data: { discountAmount, coupon } });
}
