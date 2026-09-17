"use client";

import { signOut } from "next-auth/react";

export function TopbarSignOut() {
  return (
    <button
      type="button"
      className="btn btn-secondary btn-sm flex items-center justify-center h-8 w-8 !p-0 rounded-full"
      onClick={() => signOut({ callbackUrl: "/" })}
      title="Log out"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
    </button>
  );
}
