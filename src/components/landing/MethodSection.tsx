"use client";

import { useState } from "react";
import { LandingIcon } from "@/components/landing/LandingIcon";
import type { LandingMethodItem } from "@/types/db";

export function MethodSection({
  items,
  imageUrl,
}: {
  items: LandingMethodItem[];
  imageUrl: string;
}) {
  const [tab, setTab] = useState<"online" | "hybrid">("online");
  const shown = items.filter((i) => i.tab === tab);

  return (
    <section id="metode" className="px-5 py-16" style={{ background: "var(--sidebar)" }}>
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-9 text-center">
          <p className="section-label" style={{ color: "var(--brand-200)" }}>
            Metodologi
          </p>
          <h2 className="heading-lg mb-3 text-white">Pilih Gaya Belajar Anda</h2>
          <p className="text-[15px] text-[#71717a]">
            Fleksibilitas penuh — teori online, praktik roleplay live via Zoom atau studio tatap muka.
          </p>
        </div>
        <div className="mb-8 flex justify-center">
          <div className="inline-flex gap-1 rounded-[var(--r-md)] border border-white/10 bg-white/[.07] p-0.5">
            {(["online", "hybrid"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className="rounded-[var(--r)] px-5 py-2 text-[13px] font-bold"
                style={{
                  background: tab === t ? "var(--brand)" : "transparent",
                  color: tab === t ? "#fff" : "#a1a1aa",
                }}
              >
                {t === "online" ? "100% Online" : "Hybrid (Online + Offline)"}
              </button>
            ))}
          </div>
        </div>
        <div className="method-grid">
          <div className="flex flex-col gap-5">
            {shown.map((row) => (
              <div key={row.id} className="feature-row">
                <div className="feature-icon">
                  <LandingIcon name={row.icon} color="#60a5fa" />
                </div>
                <div>
                  <h4 className="mb-1 font-[family-name:var(--font-heading)] text-[15px] font-bold text-white">{row.title}</h4>
                  <p className="text-[13px] leading-relaxed text-[#71717a]">{row.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="overflow-hidden rounded-[var(--r-xl)] border border-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="" className="block w-full opacity-80" />
          </div>
        </div>
      </div>
    </section>
  );
}
