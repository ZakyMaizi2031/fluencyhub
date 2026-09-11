"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminMobileNav({ items }: { items: Array<{ href: string; label: string }> }) {
  const pathname = usePathname();
  return (
    <div className="mb-4 flex gap-2 overflow-x-auto md:hidden">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`badge whitespace-nowrap ${active ? "badge-danger" : "badge-primary"}`}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
