import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { updateCourseAdmin } from "@/lib/db/courses.queries";

const Schema = z.object({
  instructorId: z.number().int().positive().optional(),
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  shortDescription: z.string().nullable().optional(),
  price: z.string().min(1).optional(),
  originalPrice: z.string().nullable().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  isFeatured: z.boolean().optional(),
  marketingTag: z.string().nullable().optional(),
  thumbnailUrl: z.string().url().nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;
  const { id } = await params;
  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  const course = await updateCourseAdmin(Number(id), parsed.data);
  return NextResponse.json({ data: course });
}
