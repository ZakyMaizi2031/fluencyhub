export default function InstructorLoading() {
  return (
    <div className="grid gap-4">
      <div className="h-8 w-52 animate-pulse rounded bg-[var(--border)]" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-24 animate-pulse rounded-xl bg-[var(--border)]" />
        <div className="h-24 animate-pulse rounded-xl bg-[var(--border)]" />
        <div className="h-24 animate-pulse rounded-xl bg-[var(--border)]" />
      </div>
      <div className="h-72 animate-pulse rounded-xl bg-[var(--border)]" />
    </div>
  );
}
