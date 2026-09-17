import { listAdminCoupons } from "@/lib/db/coupons.queries";
import { CouponAdminTable } from "@/components/admin/CouponAdminTable";

export const metadata = { title: "Coupons | Admin" };

export default async function AdminCouponsPage() {
  const coupons = await listAdminCoupons();
  return <CouponAdminTable coupons={coupons} />;
}
