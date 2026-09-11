import { AdminSimpleGrid } from "@/components/admin/AdminSimpleGrid";
import { getAdminOverviewStats, listOrdersForAdmin } from "@/lib/db/orders.queries";
import { listWebhookLogsRecent } from "@/lib/db/webhook-logs.queries";
import { formatIdr } from "@/lib/utils/cn";

function tone(status: string) {
  if (status === "paid" || status === "processed") return "success" as const;
  if (status === "pending_verification" || status === "awaiting_payment" || status === "received") return "warning" as const;
  if (status === "failed" || status === "expired" || status === "cancelled") return "danger" as const;
  return "primary" as const;
}

export default async function AdminOverviewPage() {
  const [stats, orders, webhooks] = await Promise.all([
    getAdminOverviewStats(),
    listOrdersForAdmin(50),
    listWebhookLogsRecent(50),
  ]);

  const cards = [
    { label: "Today revenue", value: formatIdr(stats.todayRevenue), tone: "#f0fdf4" },
    { label: "This month", value: formatIdr(stats.monthRevenue), tone: "#eff6ff" },
    { label: "Active learners", value: String(stats.learnerCount), tone: "#fefce8" },
    { label: "Pending proofs", value: String(stats.pendingProofs), tone: "#fef2f2" },
    { label: "Published courses", value: String(stats.publishedCourses), tone: "#f5f3ff" },
    { label: "Live classes today", value: String(stats.liveClassesToday), tone: "#ecfeff" },
  ];

  return (
    <div>
      <h1 className="mb-4 text-2xl font-extrabold">Overview</h1>
      <div className="grid-4 mb-5">
        {cards.map((c) => (
          <div key={c.label} className="stat-card">
            <div className="stat-icon" style={{ background: c.tone }} />
            <div>
              <p className="stat-val">{c.value}</p>
              <p className="stat-lbl">{c.label}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="overview-grid">
        <div>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[var(--text-3)]">Recent orders</h2>
          <AdminSimpleGrid
            pageSize={10}
            columns={["Order", "Buyer", "Course", "Amount", "Status"]}
            rows={orders.map((o) => ({
              key: String(o.id),
              cells: [
                o.orderNumber,
                o.buyerName,
                o.courseTitle,
                formatIdr(o.totalAmount),
                { badge: o.status, tone: tone(o.status) },
              ],
            }))}
          />
        </div>
        <div>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[var(--text-3)]">Webhook logs</h2>
          <AdminSimpleGrid
            pageSize={10}
            columns={["When", "Provider", "Event", "Status"]}
            rows={webhooks.map((w) => ({
              key: String(w.id),
              cells: [
                new Date(w.receivedAt).toLocaleString("id-ID"),
                w.provider,
                w.eventType ?? "—",
                { badge: w.processingStatus, tone: tone(w.processingStatus) },
              ],
            }))}
          />
        </div>
      </div>
    </div>
  );
}
