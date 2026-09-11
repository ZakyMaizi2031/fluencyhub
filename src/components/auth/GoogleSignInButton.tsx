"use client";

import { signIn } from "next-auth/react";
import { GoogleLogo } from "@/components/auth/GoogleLogo";

export function GoogleSignInButton({
  callbackUrl,
  label = "Lanjutkan dengan Google",
  variant = "member",
}: {
  callbackUrl: string;
  label?: string;
  variant?: "member" | "staff";
}) {
  const staff = variant === "staff";
  return (
    <button
      type="button"
      onClick={() => signIn("google", { callbackUrl })}
      className={
        staff
          ? "flex w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white px-4 py-3.5 text-[15px] font-semibold text-zinc-900 shadow-lg transition hover:bg-zinc-50"
          : "flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3.5 text-[15px] font-semibold text-zinc-800 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50"
      }
    >
      <GoogleLogo size={20} />
      {label}
    </button>
  );
}
