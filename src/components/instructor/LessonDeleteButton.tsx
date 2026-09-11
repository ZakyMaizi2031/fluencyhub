"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LessonDeleteButton({ id }: { id: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-ghost btn-sm"
      style={{ color: "var(--red)" }}
      disabled={busy}
      onClick={async () => {
        if (!confirm("Delete this lesson?")) return;
        setBusy(true);
        await fetch(`/api/instructor/lessons/${id}`, { method: "DELETE" });
        setBusy(false);
        router.refresh();
      }}
    >
      Delete
    </button>
  );
}
