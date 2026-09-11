"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminDataGrid } from "@/components/admin/AdminDataGrid";
import { formatIdr } from "@/lib/utils/cn";

type Row = {
  id: number;
  orderNumber: string;
  buyerName: string;
  buyerEmail: string;
  courseTitle: string;
  methodName: string | null;
  totalAmount: string;
  status: string;
  createdAt: string;
};

function tone(status: string) {
  if (status === "paid") return "badge badge-success";
  if (status === "pending_verification" || status === "awaiting_payment") return "badge badge-warning";
  if (status === "failed" || status === "expired" || status === "cancelled") return "badge badge-danger";
  return "badge badge-primary";
}

export function AdminPaymentsTable({ orders }: { orders: Row[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function approve(id: number) {
    setBusyId(id);
    setError("");
    const res = await fetch(`/api/admin/orders/${id}/approve`, { method: "POST" });
    setBusyId(null);
    if (!res.ok) {
      setError("Approve failed. Check the order and try again.");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      {error ? <p className="mb-3 text-sm text-[var(--red)]">{error}</p> : null}
      <AdminDataGrid columns={["Order", "Buyer", "Course", "Method", "Amount", "Status", "Date", "Actions"]} rowCount={orders.length}>
        {({ start, end }) =>
          orders.slice(start, end).map((o, i) => {
            const canApprove = o.status !== "paid" && o.status !== "cancelled" && o.status !== "refunded";
            return (
              <tr key={o.id}>
                <td className="text-[var(--text-3)]">{start + i + 1}</td>
                <td className="font-semibold">{o.orderNumber}</td>
                <td>
                  {o.buyerName}
                  <p className="text-xs text-[var(--text-4)]">{o.buyerEmail}</p>
                </td>
                <td>{o.courseTitle}</td>
                <td>{o.methodName ?? "—"}</td>
                <td>{formatIdr(o.totalAmount)}</td>
                <td>
                  <span className={tone(o.status)}>{o.status}</span>
                </td>
                <td>{new Date(o.createdAt).toLocaleString("id-ID")}</td>
                <td>
                  {canApprove ? (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      disabled={busyId === o.id}
                      onClick={() => approve(o.id)}
                    >
                      Approve & enroll
                    </button>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            );
          })
        }
      </AdminDataGrid>
    </div>
  );
}
