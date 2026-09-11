"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SectionDeleteButton({ id }: { id: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-ghost btn-sm text-white"
      disabled={busy}
      onClick={async () => {
        if (!confirm("Delete this section and its lessons?")) return;
        setBusy(true);
        await fetch(`/api/instructor/sections/${id}`, { method: "DELETE" });
        setBusy(false);
        router.refresh();
      }}
    >
      Delete
    </button>
  );
}
