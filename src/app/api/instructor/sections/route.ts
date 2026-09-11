import { NextResponse } from "next/server";
import { z } from "zod";
import { createSectionForCourse } from "@/lib/db/sections.queries";
import { assertCourseAccess, requireInstructor } from "@/lib/instructor";

const Schema = z.object({
  courseId: z.number().int().positive(),
  title: z.string().min(1),
});

export async function POST(req: Request) {
  const gate = await requireInstructor();
  if (gate.error) return gate.error;
  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  const access = await assertCourseAccess(parsed.data.courseId, gate.userId, gate.isAdmin);
  if (access.error) return access.error;
  const section = await createSectionForCourse(parsed.data.courseId, parsed.data.title);
  return NextResponse.json({ data: section }, { status: 201 });
}
