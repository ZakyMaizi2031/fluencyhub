"use client";

import { useState } from "react";
import type { Faq } from "@/types/db";

export function FaqSection({ items }: { items: Faq[] }) {
  const [open, setOpen] = useState<number | null>(items[0]?.id ?? null);
  if (items.length === 0) return null;
  return (
    <section id="faq" className="px-5 py-16">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <p className="section-label">FAQ</p>
          <h2 className="heading-lg">Pertanyaan yang sering muncul</h2>
        </div>
        <div className="flex flex-col gap-2">
          {items.map((f) => (
            <button
              key={f.id}
              type="button"
              className="card text-left"
              onClick={() => setOpen(open === f.id ? null : f.id)}
            >
              <p className="font-bold">{f.question}</p>
              {open === f.id ? <p className="mt-2 text-sm leading-relaxed text-[var(--text-3)]">{f.answer}</p> : null}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
