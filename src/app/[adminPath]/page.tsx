import Link from "next/link";
import { getAdminPath } from "@/lib/auth";

export default function AdminHomePage() {
  const path = getAdminPath();
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-extrabold">Admin</h1>
      <p className="mt-2 mb-6 text-sm text-[var(--text-3)]">Manual payment verification queue.</p>
      <Link href={`/${path}/payments/verify`} className="btn btn-primary btn-default">
        Verify transfers
      </Link>
    </main>
  );
}
