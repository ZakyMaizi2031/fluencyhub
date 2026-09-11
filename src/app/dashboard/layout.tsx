import Link from "next/link";
import { auth } from "@/lib/session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-56 bg-[#09090b] p-4 text-zinc-400 md:block">
        <Link href="/" className="mb-6 block font-extrabold text-white">
          FluencyHub
        </Link>
        <nav className="flex flex-col gap-2 text-sm">
          <Link href="/dashboard" className="rounded-md px-3 py-2 hover:bg-zinc-800">Home</Link>
          <Link href="/dashboard/courses" className="rounded-md px-3 py-2 hover:bg-zinc-800">My Courses</Link>
        </nav>
        <p className="mt-8 px-3 text-xs text-zinc-500">{session?.user.name}</p>
      </aside>
      <div className="md:pl-56">
        <div className="border-b border-[var(--border)] bg-white px-4 py-3 md:hidden">
          <Link href="/dashboard" className="font-bold">FluencyHub</Link>
        </div>
        {children}
      </div>
    </div>
  );
}
