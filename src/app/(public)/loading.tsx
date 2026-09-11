export default function PublicLoading() {
  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-16">
      <div className="h-12 w-3/4 max-w-xl animate-pulse rounded bg-[var(--border)]" />
      <div className="h-6 w-1/2 animate-pulse rounded bg-[var(--border)]" />
      <div className="flex gap-3">
        <div className="h-12 w-36 animate-pulse rounded-full bg-[var(--border)]" />
        <div className="h-12 w-36 animate-pulse rounded-full bg-[var(--border)]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="h-36 animate-pulse rounded-xl bg-[var(--border)]" />
        <div className="h-36 animate-pulse rounded-xl bg-[var(--border)]" />
        <div className="h-36 animate-pulse rounded-xl bg-[var(--border)]" />
        <div className="h-36 animate-pulse rounded-xl bg-[var(--border)]" />
      </div>
    </main>
  );
}
