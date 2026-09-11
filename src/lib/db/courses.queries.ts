import type { Course } from "@/types/db";
import { sql } from "./client";
import { mapCourse } from "./mappers";

export async function listPublishedCourses(): Promise<Course[]> {
  const rows = await sql`
    SELECT * FROM courses
    WHERE status = 'published' AND deleted_at IS NULL
    ORDER BY is_featured DESC, published_at DESC NULLS LAST
  `;
  return rows.map((r) => mapCourse(r as Record<string, unknown>));
}

export async function getCourseById(id: number): Promise<Course | null> {
  const rows = await sql`
    SELECT * FROM courses WHERE id = ${id} AND deleted_at IS NULL
  `;
  return rows[0] ? mapCourse(rows[0] as Record<string, unknown>) : null;
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  const rows = await sql`
    SELECT * FROM courses WHERE slug = ${slug} AND deleted_at IS NULL
  `;
  return rows[0] ? mapCourse(rows[0] as Record<string, unknown>) : null;
}
