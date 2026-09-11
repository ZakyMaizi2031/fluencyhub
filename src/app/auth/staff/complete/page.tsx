import { redirect } from "next/navigation";
import { getAdminPath } from "@/lib/auth";
import { getUserByEmail } from "@/lib/db/users.queries";
import { auth } from "@/lib/session";

export default async function StaffCompletePage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/auth/staff");
  }

  const dbUser = await getUserByEmail(session.user.email);
  const role = dbUser?.role ?? "user";

  if (role === "admin") {
    redirect(`/${getAdminPath()}`);
  }
  if (role === "instructor") {
    redirect("/instructor");
  }
  redirect("/auth/error?error=NotStaff");
}
