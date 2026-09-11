export function FinalCtaSection({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <section className="bg-[var(--brand)] px-5 py-14">
      <div className="mx-auto max-w-[700px] text-center">
        <h2 className="mb-2.5 font-[family-name:var(--font-heading)] text-[28px] font-extrabold text-white md:text-[32px]">
          {title}
        </h2>
        <p className="mb-6 text-[15px] text-white/75">{subtitle}</p>
        <a href="#harga" className="btn btn-lg" style={{ background: "var(--accent)", color: "#fff", borderColor: "var(--accent-600, #d97706)" }}>
          Mulai Sekarang
        </a>
      </div>
    </section>
  );
}
