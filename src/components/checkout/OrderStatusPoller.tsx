"use client";

import { useEffect, useState } from "react";

export function OrderStatusPoller({
  orderId,
  initialStatus,
}: {
  orderId: number;
  initialStatus: string;
}) {
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    if (status === "paid") return;
    const timer = setInterval(async () => {
      const res = await fetch(`/api/orders/${orderId}/status`);
      const json = await res.json();
      if (json.data?.status) {
        setStatus(json.data.status);
        if (json.data.status === "paid") {
          window.location.reload();
        }
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [orderId, status]);

  if (status === "paid") return null;
  return (
    <p className="mb-4 text-xs text-[var(--text-4)]">Waiting for payment confirmation…</p>
  );
}
