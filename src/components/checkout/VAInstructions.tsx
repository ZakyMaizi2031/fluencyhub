import type { PaymentInstruction } from "@/types/db";

export function VAInstructions({
  vaNumber,
  qrString,
  instructions,
  title,
}: {
  vaNumber?: string | null;
  qrString?: string | null;
  instructions: PaymentInstruction[];
  title?: string;
}) {
  return (
    <div className="card">
      <h2 className="mb-3 text-xl font-extrabold">{title ?? "Payment instructions"}</h2>
      {vaNumber ? (
        <p className="mb-4 rounded-[var(--r)] bg-[var(--yellow-bg)] p-3 text-sm font-bold">
          Number / code: {vaNumber}
        </p>
      ) : null}
      {qrString ? (
        <p className="mb-4 break-all rounded-[var(--r)] bg-[var(--surface-2)] p-3 text-xs">{qrString}</p>
      ) : null}
      {instructions.map((ins) => (
        <div key={ins.id} className="mb-3 text-sm">
          <p className="mb-1 font-semibold">{ins.title}</p>
          <div dangerouslySetInnerHTML={{ __html: ins.content }} />
        </div>
      ))}
    </div>
  );
}
