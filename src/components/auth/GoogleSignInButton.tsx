"use client";

import { signIn } from "next-auth/react";

export function GoogleSignInButton({
  callbackUrl,
  label = "Lanjutkan dengan Google",
}: {
  callbackUrl: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      className="btn btn-secondary btn-full btn-lg"
      onClick={() => signIn("google", { callbackUrl })}
    >
      {label}
    </button>
  );
}
