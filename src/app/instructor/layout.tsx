import { InstructorBottomNav, InstructorSidebar } from "@/components/instructor/InstructorSidebar";
import { auth } from "@/lib/session";

export default async function InstructorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const share = String(Number(session?.user.revenueSharePct ?? "70")).replace(/\.00$/, "");

  return (
    <div className="dash-shell">
      <InstructorSidebar
        name={session?.user.name ?? "Instructor"}
        email={session?.user.email ?? ""}
        avatarUrl={session?.user.image ?? null}
        sharePct={share}
      />
      <div className="dash-main">
        <div className="topbar">
          <span className="badge badge-inst" style={{ fontSize: 10 }}>
            Instructor Mode
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={session?.user.image || "https://i.pravatar.cc/80?img=15"}
            alt=""
            className="avatar avatar-ring-i h-8 w-8"
          />
        </div>
        <div className="dash-content">{children}</div>
        <InstructorBottomNav />
      </div>
    </div>
  );
}
