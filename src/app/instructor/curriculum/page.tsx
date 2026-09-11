import { CurriculumManager } from "@/components/course/CurriculumManager";
import { listInstructorCoursesWithRevenue } from "@/lib/db/courses.queries";
import { listStudentsForCourse } from "@/lib/db/enrollments.queries";
import { listInstructorCurriculum } from "@/lib/db/lessons.queries";
import { instructorScopeId } from "@/lib/instructor-scope";
import { auth } from "@/lib/session";

export default async function InstructorCurriculumPage({
  searchParams,
}: {
  searchParams: Promise<{ courseId?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const scope = instructorScopeId(session?.user.role, Number(session?.user.id ?? 0));
  const courses = await listInstructorCoursesWithRevenue(scope);
  const selectedId = Number(params.courseId || courses[0]?.id || 0);
  const allowed = courses.some((c) => c.id === selectedId);
  const [curriculum, students] = allowed
    ? await Promise.all([listInstructorCurriculum(selectedId), listStudentsForCourse(selectedId)])
    : [[], []];

  return (
    <CurriculumManager
      courses={courses.map((c) => ({ id: c.id, title: c.title }))}
      selectedId={selectedId}
      allowed={allowed}
      curriculum={curriculum}
      students={students}
      hrefTemplate="/instructor/curriculum?courseId={id}"
    />
  );
}
