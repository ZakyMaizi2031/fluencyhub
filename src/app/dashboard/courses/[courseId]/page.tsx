import { notFound, redirect } from "next/navigation";
import { getCourseById } from "@/lib/db/courses.queries";
import { canAccessCoursePlayer } from "@/lib/db/enrollments.queries";
import { getFirstLessonIdForCourse } from "@/lib/db/lessons.queries";
import { auth } from "@/lib/session";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const session = await auth();
  const { courseId } = await params;
  const id = Number(courseId);
  if (!session?.user.id) redirect("/auth/signin");

  const access = await canAccessCoursePlayer(Number(session.user.id), session.user.role, id);
  if (!access.allowed) redirect(`/checkout?courseId=${id}`);

  const course = await getCourseById(id);
  if (!course) notFound();

  const first = await getFirstLessonIdForCourse(id);
  if (!first) {
    return (
      <main className="px-6 py-10">
        <h1 className="text-2xl font-extrabold">{course.title}</h1>
        <p className="mt-2 text-sm text-[var(--text-3)]">No lessons yet.</p>
      </main>
    );
  }
  redirect(`/dashboard/courses/${id}/${first}`);
}
