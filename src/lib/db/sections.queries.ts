import type { Section } from "@/types/db";
import { sql } from "./client";
import { mapSection } from "./mappers";

export async function getSectionById(id: number): Promise<Section | null> {
  const rows = await sql`SELECT * FROM sections WHERE id = ${id}`;
  return rows[0] ? mapSection(rows[0] as Record<string, unknown>) : null;
}

export async function createSectionForCourse(courseId: number, title: string): Promise<Section> {
  const rows = await sql`
    INSERT INTO sections (course_id, title, sort_order)
    VALUES (
      ${courseId},
      ${title},
      COALESCE((SELECT MAX(sort_order) + 1 FROM sections WHERE course_id = ${courseId}), 1)
    )
    RETURNING *
  `;
  return mapSection(rows[0] as Record<string, unknown>);
}

export async function updateSection(id: number, data: { title?: string; sortOrder?: number }): Promise<Section> {
  const rows = await sql`
    UPDATE sections SET
      title = COALESCE(${data.title ?? null}, title),
      sort_order = COALESCE(${data.sortOrder ?? null}, sort_order),
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return mapSection(rows[0] as Record<string, unknown>);
}

export async function deleteSection(id: number): Promise<void> {
  await sql`UPDATE lessons SET deleted_at = NOW(), updated_at = NOW() WHERE section_id = ${id} AND deleted_at IS NULL`;
  await sql`DELETE FROM sections WHERE id = ${id}`;
}

export async function listSectionsByCourse(courseId: number): Promise<Section[]> {
  const rows = await sql`
    SELECT * FROM sections WHERE course_id = ${courseId} ORDER BY sort_order ASC
  `;
  return rows.map((r) => mapSection(r as Record<string, unknown>));
}
