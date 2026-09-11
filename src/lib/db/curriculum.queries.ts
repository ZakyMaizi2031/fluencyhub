import { sql } from "./client";

export type PublicLesson = {
  id: number;
  title: string;
  durationMinutes: number;
  isFreePreview: boolean;
  contentType: string;
  previewVideoId: string | null;
};

export type PublicSection = {
  id: number;
  title: string;
  sortOrder: number;
  lessons: PublicLesson[];
};

export async function listPublicCurriculum(courseId: number): Promise<PublicSection[]> {
  const rows = await sql`
    SELECT
      s.id AS section_id,
      s.title AS section_title,
      s.sort_order AS section_sort,
      l.id AS lesson_id,
      l.title AS lesson_title,
      l.duration_minutes,
      l.is_free_preview,
      l.content_type,
      l.sort_order AS lesson_sort,
      CASE WHEN l.is_free_preview THEN l.youtube_video_id ELSE NULL END AS preview_video_id
    FROM sections s
    LEFT JOIN lessons l ON l.section_id = s.id AND l.deleted_at IS NULL
    WHERE s.course_id = ${courseId}
    ORDER BY s.sort_order ASC, l.sort_order ASC
  `;

  const sections = new Map<number, PublicSection>();
  for (const raw of rows) {
    const r = raw as Record<string, unknown>;
    const sectionId = Number(r.section_id);
    if (!sections.has(sectionId)) {
      sections.set(sectionId, {
        id: sectionId,
        title: String(r.section_title),
        sortOrder: Number(r.section_sort),
        lessons: [],
      });
    }
    if (r.lesson_id != null) {
      sections.get(sectionId)!.lessons.push({
        id: Number(r.lesson_id),
        title: String(r.lesson_title),
        durationMinutes: Number(r.duration_minutes ?? 0),
        isFreePreview: Boolean(r.is_free_preview),
        contentType: String(r.content_type ?? "youtube_video"),
        previewVideoId: (r.preview_video_id as string) ?? null,
      });
    }
  }
  return [...sections.values()];
}

export async function countLessonsForCourse(courseId: number): Promise<number> {
  const rows = await sql`
    SELECT COUNT(*)::int AS n
    FROM lessons l
    JOIN sections s ON s.id = l.section_id
    WHERE s.course_id = ${courseId} AND l.deleted_at IS NULL
  `;
  return Number((rows[0] as { n: number }).n ?? 0);
}
