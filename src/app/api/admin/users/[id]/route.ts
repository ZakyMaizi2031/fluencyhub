import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { deleteUserAdmin, getUserByEmail, getUserById, updateUserAdmin } from "@/lib/db/users.queries";

const Schema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  whatsappNumber: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  role: z.enum(["user", "instructor", "admin"]).optional(),
  isActive: z.boolean().optional(),
  revenueSharePct: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;
  const { id } = await params;
  const userId = Number(id);
  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  if (parsed.data.email) {
    const existing = await getUserByEmail(parsed.data.email);
    if (existing && existing.id !== userId) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }
  }
  const user = await updateUserAdmin(userId, {
    ...parsed.data,
    email: parsed.data.email?.trim().toLowerCase(),
    whatsappNumber: parsed.data.whatsappNumber === "" ? null : parsed.data.whatsappNumber,
    avatarUrl: parsed.data.avatarUrl === "" ? null : parsed.data.avatarUrl,
  });
  return NextResponse.json({ data: user });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;
  const { id } = await params;
  const userId = Number(id);
  if (String(gate.session.user.id) === String(userId)) {
    return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
  }
  const user = await getUserById(userId);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await deleteUserAdmin(userId);
  return NextResponse.json({ data: true });
}
