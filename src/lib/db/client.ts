import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

export const sql = neon(process.env.DATABASE_URL);

export function asNum(value: unknown): number {
  return Number(value);
}

export function asDate(value: unknown): Date {
  return value instanceof Date ? value : new Date(String(value));
}

export function asDateOrNull(value: unknown): Date | null {
  if (value === null || value === undefined) return null;
  return asDate(value);
}
