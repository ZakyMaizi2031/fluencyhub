import { NextResponse } from "next/server";
import { getUserById, updateUserProfile } from "@/lib/db/users.queries";
import { auth } from "@/lib/session";

export async function GET() {
  const session = await auth();
  if (!session?.user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await getUserById(Number(session.user.id));
  return NextResponse.json({ data: user });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json()) as { name?: string; whatsappNumber?: string };
  const user = await updateUserProfile(Number(session.user.id), body);
  return NextResponse.json({ data: user });
}
