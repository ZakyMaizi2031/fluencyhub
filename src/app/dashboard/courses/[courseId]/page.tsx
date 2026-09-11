import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCourseById } from "@/lib/db/courses.queries";
import { checkEnrollment } from "@/lib/db/enrollments.queries";
import { listLessonsBySection } from "@/lib/db/lessons.queries";
import { listSectionsByCourse } from "@/lib/db/sections.queries";
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

  const enrolled = await checkEnrollment(Number(session.user.id), id);
  if (!enrolled) redirect(`/checkout?courseId=${id}`);

  const course = await getCourseById(id);
  if (!course) notFound();
  const sections = await listSectionsByCourse(id);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-extrabold">{course.title}</h1>
      <div className="space-y-4">
        {await Promise.all(
          sections.map(async (section) => {
            const lessons = await listLessonsBySection(section.id);
            return (
              <div key={section.id} className="card">
                <h2 className="mb-3 font-bold">{section.title}</h2>
                <ul className="space-y-2">
                  {lessons.map((lesson) => (
                    <li key={lesson.id}>
                      <Link
                        href={`/dashboard/courses/${id}/${lesson.id}`}
                        className="text-sm text-[var(--brand)] hover:underline"
                      >
                        {lesson.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          }),
        )}
      </div>
    </main>
  );
}
