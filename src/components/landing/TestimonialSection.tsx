import type { Testimonial } from "@/types/db";

export function TestimonialSection({ items }: { items: Testimonial[] }) {
  return (
    <section id="testimoni" className="bg-white px-5 py-16">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-9 text-center">
          <p className="section-label">Testimoni</p>
          <h2 className="heading-lg">Apa Kata Mereka?</h2>
        </div>
        <div className="grid-3">
          {items.map((t) => (
            <div key={t.id} className="testi-card">
              <div className="mb-3 text-sm text-[#f59e0b]">{"★".repeat(t.rating)}</div>
              <p className="mb-4 text-sm leading-relaxed text-[var(--text-3)] italic">&quot;{t.quote}&quot;</p>
              <div className="flex items-center gap-2.5">
                {t.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.avatarUrl} alt="" className="avatar h-9 w-9" />
                ) : null}
                <div>
                  <p className="font-[family-name:var(--font-heading)] text-[13px] font-bold">{t.name}</p>
                  <p className="text-[11px] text-[var(--text-4)]">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
