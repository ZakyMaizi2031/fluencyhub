import { NextResponse } from "next/server";
import { getCourseById } from "@/lib/db/courses.queries";
import { auth } from "@/lib/session";

export async function requireInstructor() {
  const session = await auth();
  if (!session?.user.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (session.user.role !== "instructor" && session.user.role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session, userId: Number(session.user.id), isAdmin: session.user.role === "admin" };
}

export async function assertCourseAccess(courseId: number, userId: number, isAdmin: boolean) {
  const course = await getCourseById(courseId);
  if (!course) return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  if (!isAdmin && course.instructorId !== userId) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { course };
}
