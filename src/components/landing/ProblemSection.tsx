import { LandingIcon } from "@/components/landing/LandingIcon";
import type { LandingPainPoint } from "@/types/db";

export function ProblemSection({ items }: { items: LandingPainPoint[] }) {
  return (
    <section id="masalah" className="bg-white px-5 py-16">
      <div className="mx-auto max-w-[1200px]">
        <div className="mx-auto mb-10 max-w-xl text-center">
          <p className="section-label">Akar Masalah</p>
          <h2 className="heading-lg mb-3">Sudah Belajar 12 Tahun, Masih &quot;Nge-Lag&quot; Saat Meeting?</h2>
          <p className="text-[15px] leading-relaxed text-[var(--text-3)]">
            Sistem pendidikan mengajarkan bahasa Inggris seperti rumus matematika.
          </p>
        </div>
        <div className="grid-3">
          {items.map((p) => (
            <div key={p.id} className="card card-hover prob-card">
              <div className="icon-wrap" style={{ background: p.iconBg }}>
                <LandingIcon name={p.icon} color={p.iconColor} />
              </div>
              <div>
                <h3 className="mb-1 font-[family-name:var(--font-heading)] text-[15px] font-bold">{p.title}</h3>
                <p className="text-[13px] leading-relaxed text-[var(--text-3)]">{p.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
