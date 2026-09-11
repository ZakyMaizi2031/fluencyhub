"use client";

import { useState } from "react";

export function ProofVerifyActions({ proofId }: { proofId: number }) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  async function act(action: "approve" | "reject") {
    setBusy(true);
    await fetch(`/api/payment-proofs/${proofId}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, note }),
    });
    window.location.reload();
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      <input className="input" placeholder="Reject note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="flex gap-2">
        <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => act("approve")}>
          Approve
        </button>
        <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => act("reject")}>
          Reject
        </button>
      </div>
    </div>
  );
}
