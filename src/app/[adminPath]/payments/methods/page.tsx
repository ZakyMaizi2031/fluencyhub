import { PaymentMethodToggle } from "@/components/admin/PaymentMethodToggle";
import { listAllPaymentMethodsAdmin } from "@/lib/db/payment-methods.queries";

export default async function AdminMethodsPage() {
  const methods = await listAllPaymentMethodsAdmin();
  return (
    <div>
      <h1 className="mb-4 text-2xl font-extrabold">Payment methods</h1>
      <div className="tbl-wrap">
        {methods.map((m) => (
          <div key={m.id} className="method-row">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {m.logoUrl ? <img src={m.logoUrl} alt="" className="h-8 w-8 object-contain" /> : <div className="h-8 w-8 rounded bg-[var(--surface-2)]" />}
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{m.name}</p>
              <p className="text-xs text-[var(--text-4)]">
                {m.code} · {m.type} · {m.provider}
              </p>
            </div>
            <PaymentMethodToggle id={m.id} isActive={m.isActive} />
          </div>
        ))}
      </div>
    </div>
  );
}
