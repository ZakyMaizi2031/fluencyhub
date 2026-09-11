import { notFound } from "next/navigation";
import { getAdminPath } from "@/lib/auth";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ adminPath: string }>;
}) {
  const { adminPath } = await params;
  if (adminPath !== getAdminPath()) notFound();
  return <div className="min-h-screen bg-[var(--bg)]">{children}</div>;
}
