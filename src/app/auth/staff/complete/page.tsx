import { redirect } from "next/navigation";
import { getAdminPath, isAdminEmail } from "@/lib/auth";
import { auth } from "@/lib/session";

export default async function StaffCompletePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/staff");
  }

  const role = session.user.role;
  if (role === "admin" && isAdminEmail(session.user.email)) {
    redirect(`/${getAdminPath()}`);
  }
  if (role === "instructor") {
    redirect("/instructor");
  }
  redirect("/auth/error?error=NotStaff");
}
