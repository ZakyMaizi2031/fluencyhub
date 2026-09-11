"use client";

import { signOut } from "next-auth/react";

export function AdminSignOut() {
  return (
    <button type="button" className="sidebar-item" onClick={() => signOut({ callbackUrl: "/" })}>
      Log Out
    </button>
  );
}
