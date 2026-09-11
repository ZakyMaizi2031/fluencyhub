import type { Section } from "@/types/db";
import { sql } from "./client";
import { mapSection } from "./mappers";

export async function listSectionsByCourse(courseId: number): Promise<Section[]> {
  const rows = await sql`
    SELECT * FROM sections WHERE course_id = ${courseId} ORDER BY sort_order ASC
  `;
  return rows.map((r) => mapSection(r as Record<string, unknown>));
}
