# 🤖 CLAUDE.md — FluencyHub AI Coding Agent Instructions

> This file is the authoritative instruction set for Claude (and any AI coding agent) working on this repository. Read this before touching any file.

---

## Project Identity

**FluencyHub** is a Next.js 15 SSR online learning platform deployed on Vercel. It uses Neon PostgreSQL with raw SQL, Upstash Redis, Vercel Blob storage, Midtrans + Xendit payments, and Google SSO via NextAuth v5.

---

## Absolute Rules — Never Break These

### 1. No SPA, No CSR Pages
- Every page in `src/app/` is a **React Server Component** by default
- Data is fetched server-side inside the page/layout component
- Never add `"use client"` to a page or layout file
- Never use `useEffect` to fetch data on mount — that means CSR

### 2. No Raw SQL Outside `src/lib/db/`
- All SQL lives in `src/lib/db/{model}.queries.ts`
- Route handlers call query functions — they never write SQL directly
- Server components call query functions — they never write SQL directly
- If you find yourself writing a SQL string in a component or route handler, stop and move it

```typescript
// ✅ CORRECT — route handler calls query function
import { getCourseById } from "@/lib/db/courses.queries";
export async function GET(req, { params }) {
  const course = await getCourseById(Number(params.id));
  return NextResponse.json({ data: course });
}

// ❌ WRONG — SQL inline in route handler
export async function GET(req, { params }) {
  const rows = await sql`SELECT * FROM courses WHERE id = ${params.id}`;
  return NextResponse.json(rows[0]);
}
```

### 3. No Drizzle ORM at Runtime
- Drizzle is a **dev dependency** for migration/seed only
- Never `import { db } from "drizzle/..."` or `import { drizzle } from "drizzle-orm/..."` in `src/`
- Runtime DB access = `import { sql } from "@/lib/db/client"` (Neon only)

### 4. No UUID — Use BIGSERIAL / bigint
- All PKs are `BIGINT` on the TypeScript side
- Never generate or store UUID strings as IDs
- Order references use the `order_number` string format (`FH-YYYYMMDD-XXXXXX`)

### 5. No ENUM Types in PostgreSQL
- All status/type columns are `VARCHAR` with `CHECK` constraints
- Never add an `ALTER TYPE` or `CREATE TYPE ... AS ENUM` in migrations

### 6. The Admin Path is a Secret
- `NEXT_PUBLIC_ADMIN_PATH` is an env var — but NEVER put it in `NEXT_PUBLIC_*`; use `ADMIN_PATH` only (server-side)
- The admin route segment `[adminPath]` is resolved server-side in middleware
- Never render the admin URL in any HTML, `<Link>`, or JS bundle

### 7. YouTube URLs Are Server-Gated
- `youtube_url` and `youtube_video_id` from DB are **never passed to the client directly** in a public page
- They are only available after an enrollment check, delivered via a server-rendered component

### 8. Live Class URLs Are Time-Locked
- `live_class_url` is only injected into the page if `NOW() >= live_class_datetime - 30 minutes`
- This check happens **server-side** in the page component, not in the client

---

## File Conventions

### Query Files (`src/lib/db/*.queries.ts`)

```typescript
// Pattern for every function:
export async function getEntityById(id: number): Promise<Entity | null> {
  const rows = await sql`SELECT * FROM table WHERE id = ${id} AND deleted_at IS NULL`;
  return (rows[0] as Entity) ?? null;
}

export async function createEntity(data: CreateEntityInput): Promise<Entity> {
  const rows = await sql`INSERT INTO table (...) VALUES (...) RETURNING *`;
  return rows[0] as Entity;
}

export async function updateEntity(id: number, data: Partial<UpdateEntityInput>): Promise<Entity> {
  const rows = await sql`UPDATE table SET ... WHERE id = ${id} RETURNING *`;
  return rows[0] as Entity;
}
```

- Always use `RETURNING *` on INSERT/UPDATE
- Always filter `deleted_at IS NULL` on SELECT (except in admin queries that need deleted rows)
- Always type-assert the return: `rows[0] as Entity`
- Export named functions only — no default exports from query files

### API Route Handlers (`src/app/api/{model}/route.ts`)

```typescript
// Always in this order:
// 1. auth() check
// 2. ratelimit check
// 3. Zod validation
// 4. Query function call(s)
// 5. Return NextResponse.json()

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { success } = await ratelimit.limit(`action:${session.user.id}`);
  if (!success) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const body   = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const result = await queryFunction(parsed.data);
  return NextResponse.json({ data: result }, { status: 201 });
}
```

### Page Components (`src/app/**/page.tsx`)

```typescript
// Always Server Components — no "use client"
// Parallel data fetching with Promise.all
// Error boundaries with notFound() / redirect()

export default async function SomePage({ params }: Props) {
  const session = await auth();
  if (!session) redirect("/auth/signin");

  const [entityA, entityB] = await Promise.all([
    queryFunctionA(params.id),
    queryFunctionB(session.user.id),
  ]);

  if (!entityA) notFound();

  return <PageContent data={entityA} extra={entityB} />;
}
```

### Client Components

```typescript
"use client";
// Only added when you need: useState, useEffect, event handlers,
// browser APIs, dnd-kit, TipTap, Recharts, or Midtrans Snap

// Accept ALL data as props from Server Component parent
// Never fetch data inside a client component (use Server Actions or route calls)
```

---

## Technology Usage Guide

### Neon SQL
```typescript
import { sql } from "@/lib/db/client";

// Tagged template — always parameterised
const rows = await sql`SELECT * FROM users WHERE email = ${email}`;

// For dynamic ORDER BY (safe because it's an enum value, not user input):
const direction = "DESC"; // validated from allowed values first
const rows = await sql`SELECT * FROM courses ORDER BY created_at ${sql.unsafe(direction)}`;
// Use sql.unsafe() ONLY for structural SQL keywords, never for user data
```

### Upstash Redis
```typescript
import { redis, ratelimit, cacheGet, cacheSet, CACHE_KEYS } from "@/lib/redis";

// Cache pattern
const cached = await cacheGet(CACHE_KEYS.publishedCourses);
if (!cached) {
  const data = await listPublishedCourses();
  await cacheSet(CACHE_KEYS.publishedCourses, data, 300); // 5 min TTL
}

// Rate limit pattern
const { success } = await ratelimit.limit(`create_order:${userId}`);
if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
```

### Vercel Blob
```typescript
import { uploadFile } from "@/lib/blob";

// In route handler — after auth + type check:
const result = await uploadFile({ file, folder: "proofs", filename: file.name });
// result.url is stored in DB, served as-is (CDN-cached)
```

### Midtrans + Xendit
```typescript
import { chargeMidtransCore, createSnapToken } from "@/lib/payment/midtrans";
import { createXenditVA }                       from "@/lib/payment/xendit";

// Primary: Core API
const result = await chargeMidtransCore({ ... });

// If Core API fails → Snap fallback
if (!result.success && result.fallback) {
  const snap = await createSnapToken({ ... });
  return NextResponse.json({ snapToken: snap.token });
}
```

### dnd-kit
```typescript
"use client";
import { DndContext, SortableContext, arrayMove } from "@dnd-kit/...";
// See CurriculumEditor.tsx in TRD for full example
// Always persist order change via PATCH /api/sections/reorder
```

### TipTap
```typescript
"use client";
import { useEditor, EditorContent } from "@tiptap/react";
// See RichTextEditor.tsx in TRD for full example
// Always output HTML string; store as TEXT in DB
```

### Recharts
```typescript
"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
// Always wrap in <ResponsiveContainer width="100%" height={300}>
// Data always comes from props (fetched server-side by parent)
```

### XLSX Export
```typescript
import * as XLSX from "xlsx";
// In a GET route handler (admin only):
const ws  = XLSX.utils.json_to_sheet(data);
const wb  = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
return new NextResponse(buf, { headers: { "Content-Type": "application/vnd.openxmlformats-..." } });
```

---

## What to Do When Adding a New Feature

1. **Start with the query file.** Add the needed SQL functions to `src/lib/db/{model}.queries.ts`
2. **Add types.** Add the TypeScript row type to `src/types/db.ts`
3. **Add the API route.** Create `src/app/api/{model}/route.ts` using the route handler pattern
4. **Add the page.** Create the page as a Server Component; fetch in parallel
5. **Add client islands.** Extract only the interactive parts into `"use client"` components
6. **Update middleware if needed.** New protected paths → add to `src/middleware.ts`
7. **Update seed if needed.** New reference data → update `drizzle/seed.ts` idempotently
8. **Invalidate cache.** If the feature mutates cached data, call `cacheInvalidate(CACHE_KEYS.xxx)` after the write

---

## What Claude Must Not Generate

| Never generate | Instead use |
|---------------|-------------|
| `useEffect(() => { fetch(...) }, [])` in any component | Server Component with `await queryFn()` |
| `export const dynamic = "force-dynamic"` without a reason | Justified only for real-time data (payment status polling) |
| `import { db } from "@/lib/drizzle"` | `import { sql } from "@/lib/db/client"` |
| `uuid()` / `crypto.randomUUID()` as a PK | `BIGSERIAL` from DB, returned in `RETURNING *` |
| `CREATE TYPE status AS ENUM (...)` in migrations | `VARCHAR(50) CHECK (status IN (...))` |
| Inline SQL string in a component or route handler | A named function in the appropriate `*.queries.ts` file |
| `process.env.NEXT_PUBLIC_ADMIN_PATH` | `process.env.ADMIN_PATH` (server only) |
| `<iframe src={lesson.live_class_url}>` rendered unconditionally | Time-lock check server-side; URL withheld if > 30 min before start |

---

## Commit Message Convention

```
type(scope): short description

feat(courses): add pagination to published course listing
fix(webhooks): handle Xendit duplicate callback idempotently
refactor(db): extract enrollment check into enrollments.queries.ts
chore(seed): add new payment methods for Alfamart and Indomaret
```

Types: `feat` | `fix` | `refactor` | `chore` | `docs` | `test` | `perf`

---

## Running the Project

```bash
# Install
pnpm install

# Develop
pnpm dev

# DB migrations (Drizzle Kit — dev only)
pnpm db:generate   # generate migration SQL from schema.ts
pnpm db:push       # apply migrations to Neon
pnpm db:seed       # run idempotent seed

# Type check
pnpm tsc --noEmit

# Build (Vercel runs this)
pnpm build
```

---

*Keep this file updated whenever architectural decisions change. It is the single source of truth for AI agents working on this codebase.*
