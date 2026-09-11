"use client";

import { signIn } from "next-auth/react";
import { useCallback, useMemo, useState } from "react";
import { SnapModal } from "@/components/checkout/SnapModal";
import { VAInstructions } from "@/components/checkout/VAInstructions";
import type { Course, PaymentInstruction, PaymentMethod } from "@/types/db";
import { formatIdr } from "@/lib/utils/cn";

type Props = {
  course: Course;
  methods: PaymentMethod[];
  instructionsByMethod: Record<number, PaymentInstruction[]>;
  user: { name: string; email: string; whatsappNumber: string | null } | null;
  midtransClientKey: string;
  midtransSnapScriptUrl: string;
};

const STEPS = ["Kelas", "Data Diri", "Bayar", "Konfirmasi"];

export function CheckoutStepper({
  course,
  methods,
  instructionsByMethod,
  user,
  midtransClientKey,
  midtransSnapScriptUrl,
}: Props) {
  const [step, setStep] = useState(user ? 3 : 1);
  const [methodId, setMethodId] = useState<number | null>(null);
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [wa, setWa] = useState(user?.whatsappNumber ?? "");
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [snapToken, setSnapToken] = useState<string | null>(null);
  const [vaNumber, setVaNumber] = useState<string | null>(null);
  const [qrString, setQrString] = useState<string | null>(null);

  const method = methods.find((m) => m.id === methodId) ?? null;
  const base = Number(course.price);
  const total = Math.max(0, base - discount);
  const instructions = method ? (instructionsByMethod[method.id] ?? []) : [];

  const grouped = useMemo(() => {
    const groups: Record<string, PaymentMethod[]> = {};
    for (const m of methods) {
      groups[m.provider] = groups[m.provider] ?? [];
      groups[m.provider].push(m);
    }
    return groups;
  }, [methods]);

  async function applyCoupon() {
    setError("");
    const res = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: coupon, courseId: course.id, amount: base }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Invalid coupon");
      setDiscount(0);
      return;
    }
    setDiscount(Number(json.data.discountAmount));
  }

  async function pay() {
    if (!method) {
      setError("Pilih metode pembayaran");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (wa) {
        await fetch("/api/users/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ whatsappNumber: wa, name }),
        });
      }
      const create = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course.id,
          paymentMethodId: method.id,
          couponCode: coupon || undefined,
        }),
      });
      const created = await create.json();
      if (!create.ok) throw new Error(created.error ?? "Failed to create order");
      const id = created.data.id as number;
      setOrderId(id);
      setOrderNumber(created.data.orderNumber);

      const payRes = await fetch(`/api/orders/${id}/pay`, { method: "POST" });
      const paid = await payRes.json();
      if (!payRes.ok) throw new Error(paid.error ?? "Payment failed");

      const path = paid.data?.path as string | undefined;
      if (path === "manual" || method.type === "manual_transfer") {
        setStep(5);
        return;
      }
      if (path === "snap" && paid.data?.snapToken) {
        setSnapToken(paid.data.snapToken as string);
        return;
      }
      if (path === "va") {
        setVaNumber((paid.data?.vaNumber as string) ?? null);
        setStep(6);
        return;
      }
      if (path === "qris") {
        setQrString((paid.data?.qrString as string) ?? null);
        setStep(6);
        return;
      }
      if (path === "redirect" && paid.data?.checkoutUrl) {
        window.location.href = paid.data.checkoutUrl as string;
        return;
      }
      window.location.href = `/checkout/success?orderNumber=${created.data.orderNumber}`;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setBusy(false);
    }
  }

  const onSnapDone = useCallback(
    (kind: "success" | "pending" | "error" | "close") => {
      if (kind === "error") {
        setError("Snap payment failed. Try again.");
        setSnapToken(null);
        return;
      }
      if (kind === "close") {
        setSnapToken(null);
        return;
      }
      if (orderNumber) {
        window.location.href = `/checkout/success?orderNumber=${orderNumber}`;
      }
    },
    [orderNumber],
  );

  async function uploadProof() {
    if (!file || !orderId) {
      setError("Pilih file bukti transfer");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("folder", "proofs");
      const up = await fetch("/api/upload", { method: "POST", body: form });
      const uploaded = await up.json();
      if (!up.ok) throw new Error(uploaded.error ?? "Upload failed");

      const proof = await fetch("/api/payment-proofs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          fileUrl: uploaded.data.url,
          fileName: file.name,
          fileSizeBytes: file.size,
          mimeType: file.type,
        }),
      });
      const json = await proof.json();
      if (!proof.ok) throw new Error(json.error ?? "Proof save failed");
      window.location.href = `/checkout/success?orderNumber=${orderNumber}`;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="sticky top-0 z-40 mb-6 flex items-center gap-3 border-b border-[var(--border)] bg-white px-4 py-3">
        <a href="/" className="btn btn-secondary btn-sm">Kembali</a>
        <div className="flex flex-1 items-center justify-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
                style={{
                  background: step >= i + 1 ? "var(--brand)" : "var(--surface-2)",
                  color: step >= i + 1 ? "#fff" : "var(--text-4)",
                }}
              >
                {i + 1}
              </div>
              <span className="hidden text-xs font-semibold md:inline">{s}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-[860px] gap-4 px-4 md:grid-cols-[1fr_280px]">
        <div>
          {error ? <p className="mb-3 rounded-md bg-[#fef2f2] p-3 text-sm text-[var(--red)]">{error}</p> : null}

          {step === 1 && (
            <div className="card">
              <h2 className="mb-4 text-xl font-extrabold">Konfirmasi Kelas</h2>
              <p className="mb-2 font-bold">{course.title}</p>
              <p className="mb-4 text-sm text-[var(--text-3)]">{course.shortDescription}</p>
              <label className="label">Kode Kupon (opsional)</label>
              <div className="mb-4 flex gap-2">
                <input className="input" value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="STEMFLUENT" />
                <button type="button" className="btn btn-secondary btn-default" onClick={applyCoupon}>
                  Apply
                </button>
              </div>
              <button type="button" className="btn btn-primary btn-full btn-default" onClick={() => setStep(2)}>
                Lanjutkan
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="card">
              <h2 className="mb-2 text-xl font-extrabold">Data Diri</h2>
              <p className="mb-4 text-sm text-[var(--text-3)]">Login Google atau isi data.</p>
              <button
                type="button"
                className="btn btn-secondary btn-full btn-default mb-4"
                onClick={() =>
                  signIn("google", { callbackUrl: `/checkout?courseId=${course.id}` })
                }
              >
                Lanjutkan dengan Google
              </button>
              <label className="label">Nama</label>
              <input className="input mb-3" value={name} onChange={(e) => setName(e.target.value)} />
              <label className="label">Email</label>
              <input className="input mb-3" value={email} onChange={(e) => setEmail(e.target.value)} />
              <label className="label">WhatsApp</label>
              <input className="input mb-4" value={wa} onChange={(e) => setWa(e.target.value)} />
              <p className="mb-3 text-xs text-[var(--text-4)]">
                Untuk membuat order, Anda harus login Google. Form ini mengisi profil setelah login.
              </p>
              <button
                type="button"
                className="btn btn-primary btn-full btn-default"
                onClick={() => {
                  if (!user) {
                    signIn("google", { callbackUrl: `/checkout?courseId=${course.id}` });
                    return;
                  }
                  setStep(3);
                }}
              >
                Lanjutkan
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="card">
              <h2 className="mb-4 text-xl font-extrabold">Pilih Metode Pembayaran</h2>
              {Object.entries(grouped).map(([provider, list]) => (
                <div key={provider} className="mb-4">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-4)]">
                    {provider}
                  </p>
                  <div className="flex flex-col gap-2">
                    {list.map((m) => (
                      <label
                        key={m.id}
                        className="flex cursor-pointer items-center gap-3 rounded-[var(--r)] border px-3 py-3"
                        style={{
                          borderColor: methodId === m.id ? "var(--brand)" : "var(--border)",
                          background: methodId === m.id ? "var(--brand-50)" : "white",
                        }}
                      >
                        <input
                          type="radio"
                          name="pm"
                          checked={methodId === m.id}
                          onChange={() => setMethodId(m.id)}
                        />
                        <span className="font-semibold">{m.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <button type="button" className="btn btn-primary btn-full btn-default" onClick={() => setStep(4)}>
                Lanjutkan
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="card">
              <h2 className="mb-4 text-xl font-extrabold">Review & Bayar</h2>
              <div className="mb-4 rounded-[var(--r-md)] bg-[var(--surface-2)] p-4">
                <div className="flex justify-between text-sm">
                  <span>Harga kelas</span>
                  <span className="font-semibold">{formatIdr(base)}</span>
                </div>
                {discount > 0 ? (
                  <div className="flex justify-between text-sm text-[var(--green)]">
                    <span>Diskon</span>
                    <span>-{formatIdr(discount)}</span>
                  </div>
                ) : null}
                <div className="mt-3 flex justify-between text-lg font-extrabold">
                  <span>Total</span>
                  <span className="text-[var(--brand)]">{formatIdr(total)}</span>
                </div>
              </div>
              <p className="mb-4 text-sm font-semibold">{method?.name ?? "—"}</p>
              <button type="button" className="btn btn-primary btn-full btn-lg" disabled={busy} onClick={pay}>
                {busy ? "Memproses..." : "Bayar Sekarang"}
              </button>
            </div>
          )}

          {step === 5 && (
            <div className="card">
              <h2 className="mb-3 text-xl font-extrabold">Upload Bukti Transfer</h2>
              {instructions.map((ins) => (
                <div key={ins.id} className="mb-4 text-sm text-[var(--text-2)]">
                  <p className="mb-2 font-semibold">{ins.title}</p>
                  <div dangerouslySetInnerHTML={{ __html: ins.content }} />
                </div>
              ))}
              <input
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                className="mb-4"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <button type="button" className="btn btn-primary btn-full btn-lg" disabled={busy} onClick={uploadProof}>
                {busy ? "Mengunggah..." : "Upload & Kirim"}
              </button>
            </div>
          )}

          {step === 6 && (
            <VAInstructions
              vaNumber={vaNumber}
              qrString={qrString}
              instructions={instructions}
              title={qrString ? "Scan QRIS" : "Transfer / payment code"}
            />
          )}
          {step === 6 && orderNumber ? (
            <a
              href={`/checkout/success?orderNumber=${orderNumber}`}
              className="btn btn-secondary btn-full btn-default mt-3"
            >
              I have paid — check status
            </a>
          ) : null}
        </div>

        <aside className="card h-fit">
          <p className="mb-3 font-bold">Ringkasan Order</p>
          <p className="text-sm font-semibold">{course.title}</p>
          <p className="mt-4 text-lg font-extrabold text-[var(--brand)]">{formatIdr(total)}</p>
        </aside>
      </div>
      {snapToken ? (
        <SnapModal
          token={snapToken}
          clientKey={midtransClientKey}
          scriptUrl={midtransSnapScriptUrl}
          onDone={onSnapDone}
        />
      ) : null}
    </div>
  );
}
