import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { createTestimonial } from "@/lib/db/landing.queries";
import { revalidateLanding } from "@/lib/landing";

const Schema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  quote: z.string().min(1),
  avatarUrl: z.string().nullable().or(z.literal("")).transform((v) => (v ? v : null)),
  rating: z.number().int().min(1).max(5),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
});

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;
  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  const row = await createTestimonial(parsed.data);
  await revalidateLanding();
  return NextResponse.json({ data: row }, { status: 201 });
}
