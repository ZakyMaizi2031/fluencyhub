import { UserAdminTable } from "@/components/admin/UserAdminTable";
import { listUsersAdmin } from "@/lib/db/users.queries";
import { auth } from "@/lib/session";

export default async function AdminUsersPage() {
  const [users, session] = await Promise.all([listUsersAdmin(), auth()]);
  return (
    <UserAdminTable
      currentUserId={session?.user.id ? Number(session.user.id) : null}
      users={users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        whatsappNumber: u.whatsappNumber,
        avatarUrl: u.avatarUrl,
        role: u.role,
        enrolledCount: u.enrolledCount,
        isActive: u.isActive,
        revenueSharePct: u.revenueSharePct,
        createdAt: new Date(u.createdAt).toISOString(),
      }))}
    />
  );
}
