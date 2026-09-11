import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { createFaq } from "@/lib/db/landing.queries";
import { revalidateLanding } from "@/lib/landing";

const Schema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
});

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;
  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  const row = await createFaq(parsed.data);
  await revalidateLanding();
  return NextResponse.json({ data: row }, { status: 201 });
}
