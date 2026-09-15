"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LandingIcon } from "@/components/landing/LandingIcon";
import { ProfileDropdown } from "@/components/auth/ProfileDropdown";

export function DashboardChrome({
  user,
  children,
}: {
  user?: { name?: string | null; image?: string | null; role?: string | null };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const player = /\/dashboard\/courses\/\d+/.test(pathname);
  if (player) return <>{children}</>;

  const menu = [
    { id: "dashboard", icon: "LayoutDashboard", label: "Dashboard", href: "/dashboard" },
    { id: "videos", icon: "Play", label: "Videos", href: "/dashboard/videos" },
    { id: "live", icon: "Video", label: "Live", href: "/dashboard/live" },
    { id: "studio", icon: "Building2", label: "Studio", href: "/dashboard/studio" },
    { id: "resources", icon: "BookOpen", label: "Resources", href: "/dashboard/resources" },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-[#0f1117] px-4 py-6 text-zinc-400 md:flex">
        {/* Logo */}
        <Link href="/" className="mb-8 flex items-center gap-2 px-2 text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-[var(--r-md)] bg-[var(--brand)]">
            <LandingIcon name="MessageCircle" color="#fff" />
          </span>
          <span className="font-[family-name:var(--font-heading)] text-lg font-extrabold tracking-tight">
            Fluency<span className="text-[var(--brand)]">Hub</span>
          </span>
        </Link>

        {/* Profile Sidebar */}
        <Link href="/dashboard/profile" className="mb-8 flex items-center gap-3 px-2 text-left hover:opacity-80 transition">
          {user?.image ? (
            <img src={user.image} alt={user.name || "User"} className="h-10 w-10 rounded-full border-2 border-zinc-700 object-cover" />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-zinc-700 bg-zinc-800 text-sm font-bold text-white">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="truncate text-sm font-bold text-white">{user?.name}</span>
            <span className="truncate text-xs font-medium text-blue-500">Hybrid Pro Member</span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-1">
          {menu.map((m) => {
            const isActive = pathname === m.href;
            return (
              <Link
                key={m.id}
                href={m.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  isActive ? "bg-[var(--brand)] text-white" : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
                }`}
              >
                <LandingIcon name={m.icon} color="currentColor" />
                {m.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="mt-auto pt-8">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-zinc-400 transition hover:bg-zinc-800/50 hover:text-white"
          >
            <LandingIcon name="Home" color="currentColor" />
            Halaman Utama
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col md:pl-64">
        {/* Topbar */}
        <div className="sticky top-0 z-40 flex h-[72px] items-center justify-between border-b border-zinc-200 bg-white/80 px-4 backdrop-blur-md md:justify-end md:px-8">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold md:hidden">
            <span className="flex h-6 w-6 items-center justify-center rounded bg-[var(--brand)]">
              <LandingIcon name="MessageCircle" color="#fff" />
            </span>
            FluencyHub
          </Link>
          <div className="flex items-center gap-4">
            <button className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100">
              <LandingIcon name="Video" color="currentColor" /> {/* Menggunakan icon sementara pengganti Bell */}
            </button>
            {user && <ProfileDropdown user={user} />}
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}
