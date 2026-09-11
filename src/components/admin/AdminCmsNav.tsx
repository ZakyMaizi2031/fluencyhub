import Link from "next/link";
import { getAdminPath } from "@/lib/auth";

export function AdminCmsNav() {
  const base = `/${getAdminPath()}`;
  const links = [
    [base, "Home"],
    [`${base}/cms`, "Settings"],
    [`${base}/cms/pain-points`, "Pain points"],
    [`${base}/cms/methods`, "Methods"],
    [`${base}/cms/testimonials`, "Testimonials"],
    [`${base}/cms/faqs`, "FAQs"],
    [`${base}/payments/verify`, "Verify payments"],
  ];
  return (
    <nav className="mb-6 flex flex-wrap gap-2">
      {links.map(([href, label]) => (
        <Link key={href} href={href} className="btn btn-secondary btn-sm">
          {label}
        </Link>
      ))}
    </nav>
  );
}
