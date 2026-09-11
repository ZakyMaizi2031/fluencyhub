import { PaymentMethodLogo } from "@/components/checkout/PaymentMethodLogo";
import { QrCodeImage } from "@/components/checkout/QrCodeImage";
import type { PaymentInstruction } from "@/types/db";

export function VAInstructions({
  vaNumber,
  qrImage,
  instructions,
  title,
  orderNumber,
  methodName,
  methodCode,
  logoUrl,
}: {
  vaNumber?: string | null;
  qrImage?: string | null;
  instructions: PaymentInstruction[];
  title?: string;
  orderNumber?: string | null;
  methodName?: string | null;
  methodCode?: string | null;
  logoUrl?: string | null;
}) {
  return (
    <div className="card">
      <div className="mb-3 flex items-center gap-3">
        {methodCode ? (
          <PaymentMethodLogo src={logoUrl ?? null} name={methodName ?? title ?? "Pay"} code={methodCode} />
        ) : null}
        <div>
          <h2 className="text-xl font-extrabold">{title ?? "Payment instructions"}</h2>
          {methodName ? <p className="text-sm font-semibold text-[var(--text-2)]">{methodName}</p> : null}
        </div>
      </div>
      {orderNumber ? (
        <p className="mb-3 text-xs font-semibold text-[var(--text-3)]">Order {orderNumber}</p>
      ) : null}
      {qrImage ? (
        <div className="mb-4 text-center">
          <QrCodeImage src={qrImage} />
          <p className="mt-2 text-xs text-[var(--text-3)]">Scan this QRIS with any e-wallet or mobile banking app</p>
        </div>
      ) : null}
      {vaNumber && !qrImage ? (
        <p className="mb-4 rounded-[var(--r)] bg-[var(--yellow-bg)] p-3 text-sm font-bold">
          Number / code: {vaNumber}
        </p>
      ) : null}
      {instructions.map((ins) => (
        <div key={ins.id} className="mb-4 text-sm text-[var(--text-2)]">
          <p className="mb-1 font-semibold">{ins.title}</p>
          <div className="instruction-html" dangerouslySetInnerHTML={{ __html: ins.content }} />
        </div>
      ))}
    </div>
  );
}
