import Link from "next/link";
import { auth } from "@/lib/session";

export async function PublicNavbar() {
  const session = await auth();

  return (
    <nav className="glass-nav sticky top-0 z-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-[family-name:var(--font-heading)] text-lg font-extrabold text-[var(--brand)]">
          FluencyHub
        </Link>
        <div className="hidden items-center gap-6 md:flex">
          <a href="/#masalah" className="nav-link">Masalah</a>
          <a href="/#metode" className="nav-link">Metode</a>
          <a href="/#harga" className="nav-link">Harga</a>
          <a href="/#testimoni" className="nav-link">Testimoni</a>
        </div>
        <div className="flex items-center gap-2">
          {session?.user ? (
            <Link href="/dashboard" className="btn btn-primary btn-default">
              Dashboard
            </Link>
          ) : (
            <Link href="/auth/signin" className="btn btn-secondary btn-default">
              Log in Member
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
