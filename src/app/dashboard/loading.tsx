export default function DashboardLoading() {
  return (
    <div className="grid gap-4">
      <div className="h-8 w-44 animate-pulse rounded bg-[var(--border)]" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-40 animate-pulse rounded-xl bg-[var(--border)]" />
        <div className="h-40 animate-pulse rounded-xl bg-[var(--border)]" />
      </div>
      <div className="h-56 animate-pulse rounded-xl bg-[var(--border)]" />
    </div>
  );
}
