import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { restoreUserAdmin } from "@/lib/db/users.queries";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;
  const { id } = await params;
  const userId = Number(id);
  await restoreUserAdmin(userId);
  return NextResponse.json({ data: true });
}
