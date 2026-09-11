"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function PaymentMethodToggle({ id, isActive }: { id: number; isActive: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={isActive}
        disabled={busy}
        onChange={async (e) => {
          setBusy(true);
          await fetch(`/api/admin/payment-methods/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isActive: e.target.checked }),
          });
          setBusy(false);
          router.refresh();
        }}
      />
      {isActive ? "Active" : "Off"}
    </label>
  );
}
