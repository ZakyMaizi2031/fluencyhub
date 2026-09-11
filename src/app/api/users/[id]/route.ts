import { NextResponse } from "next/server";
import { updateUserProfile } from "@/lib/db/users.queries";
import { auth } from "@/lib/session";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;
  if (!session?.user.id || session.user.id !== id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as { name?: string; whatsappNumber?: string; avatarUrl?: string };
  const user = await updateUserProfile(Number(id), body);
  return NextResponse.json({ data: user });
}
