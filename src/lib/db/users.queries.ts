import type { User, UserRole } from "@/types/db";
import { sql } from "./client";
import { mapUser } from "./mappers";

export async function getUserByEmail(email: string): Promise<User | null> {
  const rows = await sql`SELECT * FROM users WHERE email = ${email} AND deleted_at IS NULL`;
  return rows[0] ? mapUser(rows[0] as Record<string, unknown>) : null;
}

export async function getInstructorPublic(
  id: number,
): Promise<{ id: number; name: string; avatarUrl: string | null } | null> {
  const rows = await sql`
    SELECT id, name, avatar_url FROM users
    WHERE id = ${id} AND deleted_at IS NULL AND role = 'instructor'
  `;
  const row = rows[0] as { id: unknown; name: string; avatar_url: string | null } | undefined;
  if (!row) return null;
  return { id: Number(row.id), name: row.name, avatarUrl: row.avatar_url };
}

export async function getUserById(id: number): Promise<User | null> {
  const rows = await sql`SELECT * FROM users WHERE id = ${id} AND deleted_at IS NULL`;
  return rows[0] ? mapUser(rows[0] as Record<string, unknown>) : null;
}

export async function createUser(data: {
  name: string;
  email: string;
  googleId?: string | null;
  avatarUrl?: string | null;
  role?: UserRole;
  whatsappNumber?: string | null;
}): Promise<User> {
  const rows = await sql`
    INSERT INTO users (name, email, google_id, avatar_url, role, whatsapp_number)
    VALUES (
      ${data.name},
      ${data.email},
      ${data.googleId ?? null},
      ${data.avatarUrl ?? null},
      ${data.role ?? "user"},
      ${data.whatsappNumber ?? null}
    )
    RETURNING *
  `;
  return mapUser(rows[0] as Record<string, unknown>);
}

export async function updateUserLastLogin(id: number): Promise<void> {
  await sql`UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = ${id}`;
}

export async function updateUserProfile(
  id: number,
  data: { name?: string; whatsappNumber?: string | null; avatarUrl?: string | null },
): Promise<User> {
  const rows = await sql`
    UPDATE users
    SET
      name = COALESCE(${data.name ?? null}, name),
      whatsapp_number = COALESCE(${data.whatsappNumber ?? null}, whatsapp_number),
      avatar_url = COALESCE(${data.avatarUrl ?? null}, avatar_url),
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return mapUser(rows[0] as Record<string, unknown>);
}
