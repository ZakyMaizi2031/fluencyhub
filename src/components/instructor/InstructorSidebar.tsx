"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminSignOut } from "@/components/admin/AdminSignOut";

const NAV = [
  { href: "/instructor", label: "Overview", exact: true },
  { href: "/instructor/courses", label: "My Courses" },
  { href: "/instructor/curriculum", label: "Kurikulum" },
  { href: "/instructor/students", label: "Students" },
  { href: "/instructor/analytics", label: "Analytics" },
];

export function InstructorSidebar({
  name,
  email,
  avatarUrl,
  sharePct,
}: {
  name: string;
  email: string;
  avatarUrl: string | null;
  sharePct: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <Link href="/instructor" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-[var(--r)] bg-[var(--sidebar-active-inst)] text-xs font-extrabold text-white">
            F
          </span>
          <span className="font-[family-name:var(--font-heading)] text-base font-extrabold text-white">
            Fluency<span className="text-[var(--sidebar-active-inst)]">Hub</span>
          </span>
        </Link>
      </div>
      <div className="sidebar-profile">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatarUrl || "https://i.pravatar.cc/80?img=15"} alt="" className="avatar avatar-ring-i h-9 w-9" />
        <div className="min-w-0">
          <p className="truncate font-[family-name:var(--font-heading)] text-xs font-bold text-white">{name}</p>
          <p className="text-[10px] font-medium text-[var(--sidebar-active-inst)]">Instructor · {sharePct}% Revenue</p>
          <p className="truncate text-[10px] text-zinc-500">{email}</p>
        </div>
      </div>
      <nav className="sidebar-nav">
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link key={item.href} href={item.href} className={`sidebar-item${active ? " active-i" : ""}`}>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <AdminSignOut />
      </div>
    </aside>
  );
}

export function InstructorBottomNav() {
  const pathname = usePathname();
  return (
    <nav className="bottom-nav">
      {NAV.map((item) => {
        const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link key={item.href} href={item.href} className={`bn-item${active ? " bna-i" : ""}`}>
            {item.label.split(" ")[0]}
          </Link>
        );
      })}
    </nav>
  );
}
