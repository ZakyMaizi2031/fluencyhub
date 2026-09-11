import { NextResponse } from "next/server";
import { auth } from "@/lib/session";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (session.user.role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session };
}
