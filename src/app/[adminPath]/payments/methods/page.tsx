import { listAllPaymentMethodsAdmin } from "@/lib/db/payment-methods.queries";
import { AdminMethodsClient } from "@/components/admin/AdminMethodsClient";

export default async function AdminMethodsPage() {
  const methods = await listAllPaymentMethodsAdmin();
  return <AdminMethodsClient initialMethods={methods} />;
}
