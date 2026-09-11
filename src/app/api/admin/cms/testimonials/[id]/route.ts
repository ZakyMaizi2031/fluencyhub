import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { deleteTestimonial, updateTestimonial } from "@/lib/db/landing.queries";
import { revalidateLanding } from "@/lib/landing";

const Schema = z.object({
  name: z.string().optional(),
  role: z.string().optional(),
  quote: z.string().optional(),
  avatarUrl: z
    .string()
    .nullable()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? null : v)),
  rating: z.number().int().min(1).max(5).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;
  const { id } = await params;
  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  const row = await updateTestimonial(Number(id), parsed.data);
  await revalidateLanding();
  return NextResponse.json({ data: row });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;
  const { id } = await params;
  await deleteTestimonial(Number(id));
  await revalidateLanding();
  return NextResponse.json({ data: true });
}
