"use client";

import { useState } from "react";

const GROUPS: Array<{ title: string; keys: Array<{ key: string; label: string; area?: boolean }> }> = [
  {
    title: "Hero",
    keys: [
      { key: "hero_eyebrow", label: "Eyebrow" },
      { key: "hero_title", label: "Title" },
      { key: "hero_title_highlight", label: "Title highlight" },
      { key: "hero_subtitle", label: "Subtitle", area: true },
      { key: "hero_social_proof", label: "Social proof", area: true },
      { key: "hero_image_url", label: "Image URL" },
      { key: "hero_stat_label", label: "Stat label" },
      { key: "hero_stat_value", label: "Stat value" },
    ],
  },
  {
    title: "Method image",
    keys: [{ key: "method_image_url", label: "Image URL" }],
  },
  {
    title: "Final CTA",
    keys: [
      { key: "cta_title", label: "Title" },
      { key: "cta_subtitle", label: "Subtitle", area: true },
    ],
  },
];

export function CmsSettingsForm({ initial }: { initial: Record<string, string> }) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const next: Record<string, string> = {};
    for (const g of GROUPS) for (const f of g.keys) next[f.key] = initial[f.key] ?? "";
    return next;
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function save() {
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/admin/cms/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setBusy(false);
    setMsg(res.ok ? "Saved" : "Save failed");
  }

  return (
    <div className="card max-w-3xl">
      {GROUPS.map((g) => (
        <fieldset key={g.title} className="mb-6 border-0 p-0">
          <legend className="mb-3 font-[family-name:var(--font-heading)] text-base font-extrabold">{g.title}</legend>
          <div className="grid gap-3">
            {g.keys.map((f) => (
              <label key={f.key}>
                <span className="label">{f.label}</span>
                {f.area ? (
                  <textarea
                    className="input min-h-20"
                    value={values[f.key]}
                    onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  />
                ) : (
                  <input
                    className="input"
                    value={values[f.key]}
                    onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  />
                )}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      {msg ? <p className="mb-3 text-sm text-[var(--text-3)]">{msg}</p> : null}
      <button type="button" className="btn btn-primary btn-default" disabled={busy} onClick={save}>
        {busy ? "Saving..." : "Save settings"}
      </button>
    </div>
  );
}
