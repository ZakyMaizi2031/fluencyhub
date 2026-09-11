import { notFound } from "next/navigation";
import { CurriculumManager } from "@/components/course/CurriculumManager";
import { getAdminPath } from "@/lib/auth";
import { getCourseById, listAllCoursesAdmin } from "@/lib/db/courses.queries";
import { listStudentsForCourse } from "@/lib/db/enrollments.queries";
import { listInstructorCurriculum } from "@/lib/db/lessons.queries";

export default async function AdminCourseCurriculumPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const id = Number(courseId);
  const course = await getCourseById(id);
  if (!course) notFound();
  const [all, curriculum, students] = await Promise.all([
    listAllCoursesAdmin(),
    listInstructorCurriculum(id),
    listStudentsForCourse(id),
  ]);
  const base = `/${getAdminPath()}/courses`;

  return (
    <CurriculumManager
      courses={all.map((c) => ({ id: c.id, title: c.title }))}
      selectedId={id}
      allowed
      curriculum={curriculum}
      students={students}
      hrefTemplate={`${base}/{id}`}
    />
  );
}
