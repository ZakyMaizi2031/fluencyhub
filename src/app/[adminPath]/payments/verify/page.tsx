import { listPendingProofs } from "@/lib/db/payment-proofs.queries";
import { ProofVerifyActions } from "@/components/admin/ProofVerifyActions";

export default async function VerifyPaymentsPage() {
  const proofs = await listPendingProofs();
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-extrabold">Pending proofs</h1>
      {proofs.length === 0 ? (
        <p className="text-sm text-[var(--text-3)]">No pending proofs.</p>
      ) : (
        <div className="space-y-4">
          {proofs.map((p) => (
            <div key={p.id} className="card">
              <p className="font-bold">{p.orderNumber}</p>
              <p className="text-sm text-[var(--text-3)]">
                {p.userName} · {p.courseTitle}
              </p>
              <a href={p.fileUrl} className="mt-2 inline-block text-sm text-[var(--brand)]" target="_blank" rel="noreferrer">
                Open proof
              </a>
              <ProofVerifyActions proofId={p.id} />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
