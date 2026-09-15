import { DashboardChrome } from "@/components/layout/DashboardChrome";
import { auth } from "@/lib/session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return <DashboardChrome user={session?.user}>{children}</DashboardChrome>;
}
