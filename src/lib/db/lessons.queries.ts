import type { Lesson } from "@/types/db";
import { sql } from "./client";
import { mapLesson } from "./mappers";

export async function listLessonsBySection(sectionId: number): Promise<Lesson[]> {
  const rows = await sql`
    SELECT * FROM lessons
    WHERE section_id = ${sectionId} AND deleted_at IS NULL
    ORDER BY sort_order ASC
  `;
  return rows.map((r) => mapLesson(r as Record<string, unknown>));
}

export async function getLessonById(id: number): Promise<Lesson | null> {
  const rows = await sql`
    SELECT * FROM lessons WHERE id = ${id} AND deleted_at IS NULL
  `;
  return rows[0] ? mapLesson(rows[0] as Record<string, unknown>) : null;
}
