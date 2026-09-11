import { notFound, redirect } from "next/navigation";
import { checkEnrollment } from "@/lib/db/enrollments.queries";
import { getLessonById } from "@/lib/db/lessons.queries";
import { auth } from "@/lib/session";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const session = await auth();
  const { courseId, lessonId } = await params;
  if (!session?.user.id) redirect("/auth/signin");
  const enrolled = await checkEnrollment(Number(session.user.id), Number(courseId));
  if (!enrolled) redirect(`/checkout?courseId=${courseId}`);

  const lesson = await getLessonById(Number(lessonId));
  if (!lesson) notFound();

  const withinWindow =
    lesson.contentType === "live_class" &&
    lesson.liveClassDatetime &&
    Date.now() >= lesson.liveClassDatetime.getTime() - 30 * 60 * 1000;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-extrabold">{lesson.title}</h1>
      {lesson.contentType === "youtube_video" && lesson.youtubeVideoId ? (
        <iframe
          className="aspect-video w-full rounded-[var(--r-lg)]"
          src={`https://www.youtube-nocookie.com/embed/${lesson.youtubeVideoId}`}
          title={lesson.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : null}
      {lesson.contentType === "live_class" ? (
        <div className="card">
          {withinWindow && lesson.liveClassUrl ? (
            <a href={lesson.liveClassUrl} className="btn btn-primary btn-default" target="_blank" rel="noreferrer">
              Join live class
            </a>
          ) : (
            <p className="text-sm text-[var(--text-3)]">
              Join link unlocks 30 minutes before class start.
            </p>
          )}
        </div>
      ) : null}
      {lesson.description ? <p className="mt-4 text-sm text-[var(--text-2)]">{lesson.description}</p> : null}
    </main>
  );
}
