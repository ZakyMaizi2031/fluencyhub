import { ProofVerifyActions } from "@/components/admin/ProofVerifyActions";
import { listPendingProofs } from "@/lib/db/payment-proofs.queries";

export default async function VerifyPaymentsPage() {
  const proofs = await listPendingProofs();
  return (
    <div>
      <h1 className="mb-4 text-2xl font-extrabold">Verify transfers</h1>
      {proofs.length === 0 ? (
        <p className="text-sm text-[var(--text-3)]">No pending proofs.</p>
      ) : (
        <div className="space-y-3">
          {proofs.map((p) => (
            <div key={p.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-extrabold">{p.orderNumber}</p>
                  <p className="text-sm text-[var(--text-3)]">
                    {p.userName} · {p.courseTitle}
                  </p>
                  {p.fileUrl.match(/\.(png|jpe?g|webp)$/i) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.fileUrl} alt="" className="mt-2 max-h-40 rounded-[var(--r)] object-contain" />
                  ) : null}
                  <a href={p.fileUrl} className="mt-2 inline-block text-sm text-[var(--brand)]" target="_blank" rel="noreferrer">
                    Open proof
                  </a>
                </div>
                <span className="badge badge-warning">pending</span>
              </div>
              <ProofVerifyActions proofId={p.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
