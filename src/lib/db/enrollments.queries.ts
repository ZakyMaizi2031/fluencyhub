import type { Course, Enrollment } from "@/types/db";
import { sql } from "./client";
import { mapCourse, mapEnrollment } from "./mappers";

export async function checkEnrollment(userId: number, courseId: number): Promise<boolean> {
  const rows = await sql`
    SELECT 1 FROM enrollments
    WHERE user_id = ${userId} AND course_id = ${courseId} AND status = 'active'
    LIMIT 1
  `;
  return rows.length > 0;
}

export async function createEnrollment(data: {
  userId: number;
  courseId: number;
  orderId: number;
}): Promise<Enrollment> {
  const rows = await sql`
    INSERT INTO enrollments (user_id, course_id, order_id, status)
    VALUES (${data.userId}, ${data.courseId}, ${data.orderId}, 'active')
    ON CONFLICT (user_id, course_id) DO UPDATE SET
      status = 'active',
      order_id = EXCLUDED.order_id,
      updated_at = NOW()
    RETURNING *
  `;
  await sql`
    UPDATE courses SET enrollment_count = enrollment_count + 1, updated_at = NOW()
    WHERE id = ${data.courseId}
  `;
  return mapEnrollment(rows[0] as Record<string, unknown>);
}

export async function listEnrollmentsForUser(
  userId: number,
): Promise<Array<Enrollment & { course: Course }>> {
  const rows = await sql`
    SELECT e.*,
      c.id AS c_id, c.instructor_id, c.category_id, c.title, c.slug,
      c.short_description, c.description, c.thumbnail_url, c.promo_video_url,
      c.price, c.original_price, c.status AS c_status, c.is_featured, c.is_free,
      c.total_duration_min, c.enrollment_count, c.max_students, c.language,
      c.level, c.platform_fee_pct, c.created_at AS c_created_at,
      c.updated_at AS c_updated_at, c.published_at, c.deleted_at
    FROM enrollments e
    JOIN courses c ON c.id = e.course_id
    WHERE e.user_id = ${userId} AND e.status = 'active' AND c.deleted_at IS NULL
    ORDER BY e.enrolled_at DESC
  `;
  return rows.map((r) => {
    const row = r as Record<string, unknown>;
    return {
      ...mapEnrollment(row),
      course: mapCourse({
        ...row,
        id: row.c_id,
        status: row.c_status,
        created_at: row.c_created_at,
        updated_at: row.c_updated_at,
      }),
    };
  });
}

export async function getEnrollment(userId: number, courseId: number): Promise<Enrollment | null> {
  const rows = await sql`
    SELECT * FROM enrollments
    WHERE user_id = ${userId} AND course_id = ${courseId} AND status = 'active'
  `;
  return rows[0] ? mapEnrollment(rows[0] as Record<string, unknown>) : null;
}
