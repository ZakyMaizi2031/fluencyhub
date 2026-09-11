"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CourseFeaturedToggle({ id, isFeatured }: { id: number; isFeatured: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <input
      type="checkbox"
      checked={isFeatured}
      disabled={busy}
      onChange={async (e) => {
        setBusy(true);
        await fetch(`/api/admin/courses/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isFeatured: e.target.checked }),
        });
        setBusy(false);
        router.refresh();
      }}
    />
  );
}

export function CoursePublishButton({ id, status }: { id: number; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  if (status !== "draft") return <span className="text-xs text-[var(--text-4)]">—</span>;

  return (
    <button
      type="button"
      className="btn btn-primary btn-sm"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await fetch(`/api/admin/courses/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "published" }),
        });
        setBusy(false);
        router.refresh();
      }}
    >
      Publish
    </button>
  );
}
