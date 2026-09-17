import { NextResponse } from "next/server";
import { sql } from "@/lib/db/client";
import { getEnrollment } from "@/lib/db/enrollments.queries";
import { auth } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = Number(session.user.id);

    const body = await req.json();
    const { courseId, lessonId, isCompleted } = body;

    if (!courseId || !lessonId || typeof isCompleted !== "boolean") {
      return NextResponse.json({ error: "Bad Request: Missing fields" }, { status: 400 });
    }

    // Check enrollment
    const enrollment = await getEnrollment(userId, courseId);
    if (!enrollment) {
      return NextResponse.json({ error: "Forbidden: Not enrolled" }, { status: 403 });
    }

    // Upsert lesson progress
    await sql`
      INSERT INTO lesson_progress (user_id, lesson_id, enrollment_id, is_completed, completed_at, updated_at)
      VALUES (${userId}, ${lessonId}, ${enrollment.id}, ${isCompleted}, ${isCompleted ? new Date() : null}, NOW())
      ON CONFLICT (user_id, lesson_id)
      DO UPDATE SET
        is_completed = EXCLUDED.is_completed,
        completed_at = EXCLUDED.completed_at,
        updated_at = EXCLUDED.updated_at
    `;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Progress API Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
