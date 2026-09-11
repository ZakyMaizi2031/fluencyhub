# ⚙️ Technical Requirements Document (TRD)
## FluencyHub — Next.js SSR Learning Platform

**Version:** 1.0.0
**Date:** 2026-09-11
**Status:** Ready for Engineering
**Complements:** PRD v1.0, ERD v2.0

---

## 1. Technology Decisions & Constraints

### 1.1 Hard Rules (Non-Negotiable)

| Rule | Decision |
|------|----------|
| Rendering | **Server-Side Rendering (SSR) only** — no SPA, no CSR for page routes |
| Framework | **Next.js 15 App Router** — all pages are React Server Components by default |
| Deployment | **Vercel** — all environments (preview, staging, production) |
| Database | **Neon PostgreSQL Serverless** via `@neondatabase/serverless` |
| Query style | **Raw SQL only** — zero ORM queries at runtime; no Drizzle, no Prisma at runtime |
| Migration & Seed | **Drizzle Kit** — used exclusively for `drizzle-kit push` / `drizzle-kit generate` and idempotent seed scripts; never imported in app code |
| File & Image storage | **Vercel Blob** (`@vercel/blob`) |
| Cache / Rate limit | **Upstash Redis** (`@upstash/redis`) |
| Payment — primary | **Xendit Core API** + **Midtrans Core API** |
| Payment — fallback | **Midtrans Snap modal popup** (when Core API fails or card 3DS required) |
| Query location | All raw SQL lives in `src/lib/db/{model}.queries.ts` — **never inline in components or route handlers** |
| Client interactivity | `"use client"` only for islands: drag-and-drop, rich text editor, date pickers, file upload previews |

### 1.2 Key Dependencies

```jsonc
// package.json (curated — not exhaustive)
{
  "dependencies": {
    // Core
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",

    // Database
    "@neondatabase/serverless": "^0.10.0",

    // Cache & Rate Limiting
    "@upstash/redis": "^1.34.0",
    "@upstash/ratelimit": "^2.0.0",

    // Storage
    "@vercel/blob": "^0.27.0",

    // Payment
    "midtrans-client": "^1.3.2",
    "xendit-node": "^6.0.0",

    // Auth
    "next-auth": "^5.0.0",

    // UI & Components
    "tailwindcss": "^3.4.0",
    "@dnd-kit/core": "^6.3.1",
    "@dnd-kit/sortable": "^8.0.0",
    "@tiptap/react": "^2.11.0",
    "@tiptap/starter-kit": "^2.11.0",
    "@tiptap/extension-image": "^2.11.0",
    "@tiptap/extension-link": "^2.11.0",
    "recharts": "^2.15.0",

    // Documents
    "xlsx": "^0.18.5",
    "@react-pdf/renderer": "^3.4.0",
    "jspdf": "^2.5.2",

    // Notifications
    "resend": "^4.0.0",

    // Utilities
    "zod": "^3.24.0",
    "date-fns": "^4.1.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.5"
  },
  "devDependencies": {
    "drizzle-kit": "^0.30.0",
    "drizzle-orm": "^0.38.0",      // only for drizzle-kit schema definition
    "typescript": "^5.7.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0"
  }
}
```

---

## 2. Repository & Directory Structure

```
fluencyhub/
├── src/
│   ├── app/                          # Next.js App Router — all pages & API routes
│   │   ├── (public)/                 # Route group: landing + checkout (no auth)
│   │   │   ├── page.tsx              # Landing page (SSR, fully SEO'd)
│   │   │   ├── checkout/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (auth)/                   # Route group: auth callbacks
│   │   │   └── auth/
│   │   │       └── [...nextauth]/
│   │   │           └── route.ts
│   │   │
│   │   ├── dashboard/                # Member area (protected)
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx              # Home: enrolled courses + upcoming live classes
│   │   │   ├── courses/
│   │   │   │   ├── page.tsx          # My Courses list
│   │   │   │   └── [courseId]/
│   │   │   │       ├── page.tsx      # Course player (SSR)
│   │   │   │       └── [lessonId]/
│   │   │   │           └── page.tsx  # Lesson view
│   │   │   └── profile/
│   │   │       └── page.tsx
│   │   │
│   │   ├── instructor/               # Instructor area (protected)
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx              # Dashboard overview
│   │   │   ├── courses/
│   │   │   │   ├── page.tsx          # My courses list
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx      # Create course
│   │   │   │   └── [courseId]/
│   │   │   │       ├── page.tsx      # Edit course metadata
│   │   │   │       └── curriculum/
│   │   │   │           └── page.tsx  # Section + lesson editor (dnd-kit)
│   │   │   └── analytics/
│   │   │       └── page.tsx          # Revenue + enrollment stats (recharts)
│   │   │
│   │   ├── [adminPath]/              # Admin area — path from env var (hidden)
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx              # KPI dashboard
│   │   │   ├── courses/
│   │   │   │   └── page.tsx
│   │   │   ├── instructors/
│   │   │   │   └── page.tsx
│   │   │   ├── users/
│   │   │   │   └── page.tsx
│   │   │   ├── payments/
│   │   │   │   ├── page.tsx          # All transactions
│   │   │   │   ├── verify/
│   │   │   │   │   └── page.tsx      # Manual transfer queue
│   │   │   │   └── methods/
│   │   │   │       └── page.tsx      # Payment method config
│   │   │   └── notifications/
│   │   │       └── page.tsx          # Template editor
│   │   │
│   │   └── api/                      # API Route Handlers
│   │       ├── auth/
│   │       │   └── [...nextauth]/
│   │       │       └── route.ts
│   │       ├── courses/
│   │       │   └── route.ts
│   │       ├── sections/
│   │       │   └── route.ts
│   │       ├── lessons/
│   │       │   └── route.ts
│   │       ├── orders/
│   │       │   └── route.ts
│   │       ├── enrollments/
│   │       │   └── route.ts
│   │       ├── lesson-progress/
│   │       │   └── route.ts
│   │       ├── payment-methods/
│   │       │   └── route.ts
│   │       ├── payment-proofs/
│   │       │   └── route.ts
│   │       ├── users/
│   │       │   └── route.ts
│   │       ├── notifications/
│   │       │   └── route.ts
│   │       ├── coupons/
│   │       │   └── route.ts
│   │       ├── upload/
│   │       │   └── route.ts          # Vercel Blob upload handler
│   │       ├── export/
│   │       │   ├── transactions/
│   │       │   │   └── route.ts      # XLSX export
│   │       │   └── report/
│   │       │       └── route.ts      # PDF export
│   │       └── webhooks/
│   │           ├── midtrans/
│   │           │   └── route.ts
│   │           └── xendit/
│   │               └── route.ts
│   │
│   ├── lib/                          # Shared server-side utilities
│   │   ├── db/                       # ← ALL raw SQL lives here
│   │   │   ├── client.ts             # Neon pool singleton
│   │   │   ├── users.queries.ts
│   │   │   ├── courses.queries.ts
│   │   │   ├── sections.queries.ts
│   │   │   ├── lessons.queries.ts
│   │   │   ├── orders.queries.ts
│   │   │   ├── enrollments.queries.ts
│   │   │   ├── lesson-progress.queries.ts
│   │   │   ├── payment-methods.queries.ts
│   │   │   ├── payment-proofs.queries.ts
│   │   │   ├── payment-logs.queries.ts
│   │   │   ├── webhook-logs.queries.ts
│   │   │   ├── notification-templates.queries.ts
│   │   │   ├── notification-logs.queries.ts
│   │   │   ├── coupons.queries.ts
│   │   │   └── audit-logs.queries.ts
│   │   │
│   │   ├── auth.ts                   # NextAuth config
│   │   ├── redis.ts                  # Upstash Redis client
│   │   ├── blob.ts                   # Vercel Blob helpers
│   │   ├── payment/
│   │   │   ├── midtrans.ts           # Midtrans Core API + Snap fallback
│   │   │   └── xendit.ts             # Xendit Core API
│   │   ├── notifications/
│   │   │   ├── email.ts              # Resend integration
│   │   │   └── whatsapp.ts           # Fonnte/Wablas integration
│   │   └── utils/
│   │       ├── order-number.ts       # FH-YYYYMMDD-XXXXXX generator
│   │       ├── currency.ts           # IDR formatting
│   │       └── slug.ts               # URL slug generator
│   │
│   ├── components/                   # Reusable UI components
│   │   ├── ui/                       # Primitives (Button, Input, Badge, Modal…)
│   │   ├── layout/                   # Navbar, Sidebar, Footer
│   │   ├── course/                   # CourseCard, CoursePlayer, LessonList…
│   │   ├── checkout/                 # CheckoutStepper, PaymentMethodPicker…
│   │   ├── instructor/               # CurriculumEditor (dnd-kit), LessonForm…
│   │   ├── admin/                    # DataTable, StatCard, TransactionRow…
│   │   ├── editor/                   # TipTap RichText wrapper
│   │   └── charts/                   # Recharts wrappers (RevenueChart, etc.)
│   │
│   ├── types/                        # TypeScript interfaces
│   │   ├── db.ts                     # Row types matching DB schema
│   │   ├── api.ts                    # Request/response shapes
│   │   └── payment.ts                # Gateway payload types
│   │
│   └── middleware.ts                 # Auth guard + admin path enforcement
│
├── drizzle/                          # Migration & seed tooling ONLY
│   ├── schema.ts                     # Drizzle schema (mirrors ERD, used by kit only)
│   ├── migrations/                   # Generated SQL migration files
│   └── seed.ts                       # Idempotent seed script (ts-node)
│
├── public/
│   └── assets/
│
├── .env.local                        # Local dev secrets (never committed)
├── .env.example                      # Documented env var template
├── drizzle.config.ts                 # Drizzle Kit config
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## 3. Database Layer

### 3.1 Neon Client Singleton

```typescript
// src/lib/db/client.ts
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

export const sql = neon(process.env.DATABASE_URL);
```

**Rules:**
- `sql` is the **only** way to execute queries in the application
- Every query file imports `sql` from this module — nothing else
- HTTP-mode Neon is used (not WebSocket pool) for optimal Vercel serverless compatibility
- No connection pooling configuration needed — Neon manages this serverlessly

---

### 3.2 Query File Convention

Every model has its own file under `src/lib/db/`. Functions are typed, documented, and cover the most common access patterns defined in the ERD.

**Naming rules:**
- `get{Entity}ById(id)` — single row by PK
- `get{Entities}By{Field}(value)` — list filtered by a column
- `create{Entity}(data)` — INSERT returning the new row
- `update{Entity}(id, data)` — UPDATE returning the updated row
- `delete{Entity}(id)` — soft delete (sets `deleted_at`) or hard delete where noted
- `list{Entities}(filters, pagination)` — paginated list with optional filters

**Example — `src/lib/db/courses.queries.ts`:**

```typescript
import { sql } from "./client";
import type { Course, CourseWithInstructor } from "@/types/db";

// ─── Read ────────────────────────────────────────────────────────────────────

export async function getCourseById(id: number): Promise<Course | null> {
  const rows = await sql`
    SELECT *
    FROM   courses
    WHERE  id = ${id}
      AND  deleted_at IS NULL
  `;
  return (rows[0] as Course) ?? null;
}

export async function getCourseBySlug(slug: string): Promise<CourseWithInstructor | null> {
  const rows = await sql`
    SELECT
      c.*,
      u.name          AS instructor_name,
      u.avatar_url    AS instructor_avatar
    FROM   courses c
    JOIN   users   u ON u.id = c.instructor_id
    WHERE  c.slug       = ${slug}
      AND  c.deleted_at IS NULL
  `;
  return (rows[0] as CourseWithInstructor) ?? null;
}

export async function listPublishedCourses(limit = 20, offset = 0): Promise<CourseWithInstructor[]> {
  return sql`
    SELECT
      c.*,
      u.name          AS instructor_name,
      u.avatar_url    AS instructor_avatar,
      cat.name        AS category_name
    FROM   courses c
    JOIN   users   u   ON u.id  = c.instructor_id
    LEFT JOIN categories cat ON cat.id = c.category_id
    WHERE  c.status     = 'published'
      AND  c.deleted_at IS NULL
    ORDER BY c.is_featured DESC, c.enrollment_count DESC
    LIMIT  ${limit}
    OFFSET ${offset}
  ` as Promise<CourseWithInstructor[]>;
}

export async function listCoursesByInstructor(instructorId: number): Promise<Course[]> {
  return sql`
    SELECT *
    FROM   courses
    WHERE  instructor_id = ${instructorId}
      AND  deleted_at    IS NULL
    ORDER BY created_at DESC
  ` as Promise<Course[]>;
}

// ─── Write ───────────────────────────────────────────────────────────────────

export async function createCourse(data: {
  instructorId: number;
  categoryId?: number;
  title: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  price: number;
  originalPrice?: number;
  level: string;
  language?: string;
  platformFeePct?: number;
}): Promise<Course> {
  const rows = await sql`
    INSERT INTO courses (
      instructor_id, category_id, title, slug,
      short_description, description, price, original_price,
      level, language, platform_fee_pct, status
    ) VALUES (
      ${data.instructorId}, ${data.categoryId ?? null}, ${data.title}, ${data.slug},
      ${data.shortDescription ?? null}, ${data.description ?? null},
      ${data.price}, ${data.originalPrice ?? null},
      ${data.level}, ${data.language ?? "id"}, ${data.platformFeePct ?? 30.00},
      'draft'
    )
    RETURNING *
  `;
  return rows[0] as Course;
}

export async function updateCourse(
  id: number,
  data: Partial<{
    title: string;
    slug: string;
    shortDescription: string;
    description: string;
    thumbnailUrl: string;
    price: number;
    originalPrice: number;
    status: string;
    isFeatured: boolean;
    level: string;
    categoryId: number;
  }>
): Promise<Course> {
  const rows = await sql`
    UPDATE courses SET
      title              = COALESCE(${data.title            ?? null}, title),
      slug               = COALESCE(${data.slug             ?? null}, slug),
      short_description  = COALESCE(${data.shortDescription ?? null}, short_description),
      description        = COALESCE(${data.description      ?? null}, description),
      thumbnail_url      = COALESCE(${data.thumbnailUrl     ?? null}, thumbnail_url),
      price              = COALESCE(${data.price            ?? null}, price),
      original_price     = COALESCE(${data.originalPrice    ?? null}, original_price),
      status             = COALESCE(${data.status           ?? null}, status),
      is_featured        = COALESCE(${data.isFeatured       ?? null}, is_featured),
      level              = COALESCE(${data.level            ?? null}, level),
      category_id        = COALESCE(${data.categoryId       ?? null}, category_id),
      published_at       = CASE
                             WHEN ${data.status ?? null} = 'published' AND published_at IS NULL
                             THEN NOW() ELSE published_at
                           END,
      updated_at         = NOW()
    WHERE id = ${id}
      AND deleted_at IS NULL
    RETURNING *
  `;
  return rows[0] as Course;
}

export async function softDeleteCourse(id: number): Promise<void> {
  await sql`
    UPDATE courses
    SET    deleted_at = NOW(), updated_at = NOW()
    WHERE  id = ${id}
  `;
}
```

**Example — `src/lib/db/orders.queries.ts`:**

```typescript
import { sql } from "./client";
import type { Order, OrderWithDetails } from "@/types/db";

export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  const rows = await sql`
    SELECT * FROM orders WHERE order_number = ${orderNumber} LIMIT 1
  `;
  return (rows[0] as Order) ?? null;
}

export async function getOrderByGatewayTxnId(txnId: string): Promise<Order | null> {
  const rows = await sql`
    SELECT * FROM orders WHERE gateway_transaction_id = ${txnId} LIMIT 1
  `;
  return (rows[0] as Order) ?? null;
}

export async function listPendingManualTransfers(): Promise<OrderWithDetails[]> {
  return sql`
    SELECT
      o.*,
      u.name            AS buyer_name,
      u.email           AS buyer_email,
      u.whatsapp_number,
      c.title           AS course_title,
      pm.name           AS payment_method_name,
      pp.id             AS proof_id,
      pp.file_url       AS proof_url,
      pp.uploaded_at    AS proof_uploaded_at
    FROM   orders o
    JOIN   users          u  ON u.id  = o.user_id
    JOIN   courses        c  ON c.id  = o.course_id
    JOIN   payment_methods pm ON pm.id = o.payment_method_id
    JOIN   payment_proofs  pp ON pp.order_id = o.id AND pp.status = 'pending'
    WHERE  o.status = 'pending_verification'
    ORDER BY pp.uploaded_at ASC
  ` as Promise<OrderWithDetails[]>;
}

export async function createOrder(data: {
  userId: number;
  courseId: number;
  paymentMethodId: number;
  orderNumber: string;
  subtotal: number;
  adminFee: number;
  discountAmount: number;
  totalAmount: number;
  couponCode?: string;
  expiresAt?: Date;
}): Promise<Order> {
  const rows = await sql`
    INSERT INTO orders (
      user_id, course_id, payment_method_id, order_number,
      subtotal, admin_fee, discount_amount, total_amount,
      coupon_code, status, expires_at
    ) VALUES (
      ${data.userId}, ${data.courseId}, ${data.paymentMethodId}, ${data.orderNumber},
      ${data.subtotal}, ${data.adminFee}, ${data.discountAmount}, ${data.totalAmount},
      ${data.couponCode ?? null}, 'pending', ${data.expiresAt ?? null}
    )
    RETURNING *
  `;
  return rows[0] as Order;
}

export async function updateOrderStatus(
  orderNumber: string,
  status: string,
  extra?: {
    gatewayTransactionId?: string;
    gatewayPaymentUrl?: string;
    vaNumber?: string;
    paidAt?: Date;
    instructorRevenue?: number;
    platformRevenue?: number;
  }
): Promise<Order> {
  const rows = await sql`
    UPDATE orders SET
      status                 = ${status},
      gateway_transaction_id = COALESCE(${extra?.gatewayTransactionId ?? null}, gateway_transaction_id),
      gateway_payment_url    = COALESCE(${extra?.gatewayPaymentUrl    ?? null}, gateway_payment_url),
      va_number              = COALESCE(${extra?.vaNumber             ?? null}, va_number),
      paid_at                = COALESCE(${extra?.paidAt               ?? null}, paid_at),
      instructor_revenue     = COALESCE(${extra?.instructorRevenue    ?? null}, instructor_revenue),
      platform_revenue       = COALESCE(${extra?.platformRevenue      ?? null}, platform_revenue),
      updated_at             = NOW()
    WHERE order_number = ${orderNumber}
    RETURNING *
  `;
  return rows[0] as Order;
}

export async function listOrdersForExport(filters: {
  status?: string;
  methodId?: number;
  from?: Date;
  to?: Date;
  courseId?: number;
}): Promise<OrderWithDetails[]> {
  return sql`
    SELECT
      o.order_number, o.status, o.total_amount, o.paid_at, o.created_at,
      u.name AS buyer_name, u.email AS buyer_email,
      c.title AS course_title,
      pm.name AS payment_method,
      pm.provider
    FROM   orders o
    JOIN   users           u  ON u.id  = o.user_id
    JOIN   courses         c  ON c.id  = o.course_id
    JOIN   payment_methods pm ON pm.id = o.payment_method_id
    WHERE  (${filters.status ?? null}   IS NULL OR o.status            = ${filters.status ?? null})
      AND  (${filters.methodId ?? null} IS NULL OR o.payment_method_id = ${filters.methodId ?? null})
      AND  (${filters.courseId ?? null} IS NULL OR o.course_id         = ${filters.courseId ?? null})
      AND  (${filters.from ?? null}     IS NULL OR o.created_at       >= ${filters.from ?? null})
      AND  (${filters.to   ?? null}     IS NULL OR o.created_at       <= ${filters.to   ?? null})
    ORDER BY o.created_at DESC
  ` as Promise<OrderWithDetails[]>;
}
```

---

## 4. API Route Handlers

Each route handler in `src/app/api/{model}/route.ts` follows a strict pattern:

1. Parse and validate input with **Zod**
2. Authenticate via `auth()` (NextAuth)
3. Apply rate limiting via **Upstash**
4. Call **query functions** from `src/lib/db/`
5. Return typed JSON responses

**No raw SQL is ever written inside a route handler.**

**Example — `src/app/api/courses/route.ts`:**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { ratelimit } from "@/lib/redis";
import {
  listPublishedCourses,
  listCoursesByInstructor,
  createCourse,
} from "@/lib/db/courses.queries";
import { generateSlug } from "@/lib/utils/slug";

const CreateCourseSchema = z.object({
  title:            z.string().min(5).max(255),
  categoryId:       z.number().int().positive().optional(),
  shortDescription: z.string().max(500).optional(),
  price:            z.number().min(0),
  level:            z.enum(["beginner", "intermediate", "advanced", "all_levels"]),
});

// GET /api/courses — public list OR instructor's own courses
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const session = await auth();
  const limit  = Number(searchParams.get("limit") ?? 20);
  const offset = Number(searchParams.get("offset") ?? 0);

  if (session?.user?.role === "instructor") {
    const courses = await listCoursesByInstructor(Number(session.user.id));
    return NextResponse.json({ data: courses });
  }

  const courses = await listPublishedCourses(limit, offset);
  return NextResponse.json({ data: courses });
}

// POST /api/courses — instructor creates a new course
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "instructor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Rate limit: 20 course creations per instructor per hour
  const { success } = await ratelimit.limit(`create_course:${session.user.id}`);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const body = await req.json();
  const parsed = CreateCourseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const slug = await generateSlug(parsed.data.title);
  const course = await createCourse({
    instructorId:     Number(session.user.id),
    categoryId:       parsed.data.categoryId,
    title:            parsed.data.title,
    slug,
    shortDescription: parsed.data.shortDescription,
    price:            parsed.data.price,
    level:            parsed.data.level,
  });

  return NextResponse.json({ data: course }, { status: 201 });
}
```

**Example — `src/app/api/webhooks/midtrans/route.ts`:**

```typescript
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getOrderByGatewayTxnId, updateOrderStatus } from "@/lib/db/orders.queries";
import { createEnrollment }                          from "@/lib/db/enrollments.queries";
import { logWebhook }                                from "@/lib/db/webhook-logs.queries";
import { logPayment }                                from "@/lib/db/payment-logs.queries";
import { sendPaymentSuccessNotifications }           from "@/lib/notifications/email";
import { computeRevenueSplit }                       from "@/lib/utils/currency";

export async function POST(req: NextRequest) {
  const body      = await req.json();
  const rawBody   = JSON.stringify(body);
  const provider  = "midtrans";

  // 1. Verify signature
  const signatureHash = crypto
    .createHash("sha512")
    .update(
      `${body.order_id}${body.status_code}${body.gross_amount}${process.env.MIDTRANS_SERVER_KEY}`
    )
    .digest("hex");

  const isValid = signatureHash === body.signature_key;

  await logWebhook({
    orderNumber:    body.order_id,
    provider,
    eventType:      body.transaction_status,
    gatewayTxnId:   body.transaction_id,
    payloadJson:    body,
    signatureValid: isValid,
  });

  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // 2. Idempotency check via Upstash
  // (handled in webhook-logs — if duplicate, processing_status = 'duplicate')

  // 3. Update order
  const order = await getOrderByGatewayTxnId(body.transaction_id);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (body.transaction_status === "settlement" || body.transaction_status === "capture") {
    const { instructorRevenue, platformRevenue } = computeRevenueSplit(
      order.total_amount,
      order.platform_fee_pct ?? 30
    );

    await updateOrderStatus(order.order_number, "paid", {
      paidAt: new Date(),
      instructorRevenue,
      platformRevenue,
    });

    await createEnrollment({
      userId:   order.user_id,
      courseId: order.course_id,
      orderId:  order.id,
    });

    await sendPaymentSuccessNotifications(order);
  } else if (body.transaction_status === "expire") {
    await updateOrderStatus(order.order_number, "expired");
  } else if (body.transaction_status === "deny" || body.transaction_status === "cancel") {
    await updateOrderStatus(order.order_number, "failed");
  }

  return NextResponse.json({ status: "ok" });
}
```

---

## 5. Authentication

```typescript
// src/lib/auth.ts
import NextAuth from "next-auth";
import Google  from "next-auth/providers/google";
import { getUserByEmail, createUser } from "@/lib/db/users.queries";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Auto-provision user in DB on first Google login
      const existing = await getUserByEmail(user.email!);
      if (!existing) {
        await createUser({
          googleId: user.id!,
          name:     user.name!,
          email:    user.email!,
          avatarUrl: user.image ?? undefined,
        });
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const dbUser = await getUserByEmail(user.email);
        token.id   = dbUser?.id;
        token.role = dbUser?.role ?? "user";
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id   = token.id   as number;
      session.user.role = token.role as string;
      return session;
    },
  },
  pages: {
    signIn:  "/auth/signin",
    error:   "/auth/error",
  },
});
```

**Middleware — route protection + admin path enforcement:**

```typescript
// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

const ADMIN_PATH = process.env.NEXT_PUBLIC_ADMIN_PATH ?? "admin";

export async function middleware(req: NextRequest) {
  const session  = await auth();
  const pathname = req.nextUrl.pathname;

  // Block unauthenticated access to protected routes
  const protectedPrefixes = ["/dashboard", "/instructor", `/${ADMIN_PATH}`];
  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p));

  if (isProtected && !session) {
    const loginUrl = new URL("/auth/signin", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role enforcement
  if (pathname.startsWith(`/${ADMIN_PATH}`) && session?.user?.role !== "admin") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (pathname.startsWith("/instructor") && session?.user?.role !== "instructor") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/instructor/:path*", "/:adminPath/:path*"],
};
```

---

## 6. Payment Integration

### 6.1 Strategy: Core API first, Snap fallback

```
User selects payment method at checkout
    │
    ▼
POST /api/orders       → create order in DB (status: pending)
    │
    ▼
POST /api/orders/[id]/pay
    ├── method = e_wallet / va / qr_code
    │       ├── provider = xendit  → Xendit Core API (create VA / QRIS / EWallet)
    │       └── provider = midtrans → Midtrans Core API (create charge)
    │           └── on Core API failure → fallback to Midtrans Snap token
    │
    └── method = manual_transfer
            └── return bank account details from payment_methods table
                user uploads proof → POST /api/payment-proofs
```

### 6.2 Midtrans

```typescript
// src/lib/payment/midtrans.ts
import midtransClient from "midtrans-client";

const snap = new midtransClient.Snap({
  isProduction: process.env.NODE_ENV === "production",
  serverKey:    process.env.MIDTRANS_SERVER_KEY!,
  clientKey:    process.env.MIDTRANS_CLIENT_KEY!,
});

const coreApi = new midtransClient.CoreApi({
  isProduction: process.env.NODE_ENV === "production",
  serverKey:    process.env.MIDTRANS_SERVER_KEY!,
  clientKey:    process.env.MIDTRANS_CLIENT_KEY!,
});

export async function chargeMidtransCore(params: {
  orderNumber: string;
  grossAmount: number;
  paymentType: string;   // "gopay" | "shopeepay" | "bank_transfer" | "qris"
  bankCode?:  string;    // for bank_transfer: "BCA" | "BNI" | "BRI" | "MANDIRI" | "PERMATA"
  customerDetails: { firstName: string; email: string; phone: string };
}) {
  try {
    const result = await coreApi.charge({
      payment_type: params.paymentType,
      transaction_details: {
        order_id:     params.orderNumber,
        gross_amount: params.grossAmount,
      },
      customer_details: {
        first_name: params.customerDetails.firstName,
        email:      params.customerDetails.email,
        phone:      params.customerDetails.phone,
      },
      ...(params.paymentType === "bank_transfer" && {
        bank_transfer: { bank: params.bankCode?.toLowerCase() },
      }),
    });
    return { success: true, data: result };
  } catch (error) {
    // Fallback to Snap
    return { success: false, fallback: true };
  }
}

export async function createSnapToken(params: {
  orderNumber: string;
  grossAmount: number;
  customerDetails: { firstName: string; email: string; phone: string };
}) {
  const result = await snap.createTransaction({
    transaction_details: {
      order_id:     params.orderNumber,
      gross_amount: params.grossAmount,
    },
    customer_details: {
      first_name: params.customerDetails.firstName,
      email:      params.customerDetails.email,
      phone:      params.customerDetails.phone,
    },
  });
  return result; // { token, redirect_url }
}

export function verifyMidtransSignature(
  orderId: string, statusCode: string, grossAmount: string, signatureKey: string
): boolean {
  const hash = require("crypto")
    .createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${process.env.MIDTRANS_SERVER_KEY}`)
    .digest("hex");
  return hash === signatureKey;
}
```

### 6.3 Xendit

```typescript
// src/lib/payment/xendit.ts
import Xendit from "xendit-node";

const xendit = new Xendit({ secretKey: process.env.XENDIT_SECRET_KEY! });
const { VirtualAccount, QRCode, EWallet } = xendit;

export async function createXenditVA(params: {
  externalId: string;
  bankCode:   string;      // "BCA" | "BNI" | "BRI" | "MANDIRI" | "PERMATA" | "BSI"
  name:       string;
  amount:     number;
  expiresAt:  Date;
}) {
  return VirtualAccount.createFixedVA({
    externalID:     params.externalId,
    bankCode:       params.bankCode,
    name:           params.name,
    expectedAmount: params.amount,
    isClosed:       true,
    expirationDate: params.expiresAt.toISOString(),
  });
}

export async function createXenditQRIS(params: {
  externalId: string;
  amount:     number;
  expiresAt:  Date;
}) {
  return QRCode.createQRCode({
    externalID:  params.externalId,
    type:        "DYNAMIC",
    callbackURL: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/xendit`,
    amount:      params.amount,
  });
}

export async function createXenditEWallet(params: {
  externalId:  string;
  amount:      number;
  channelCode: string;   // "GOPAY" | "OVO" | "SHOPEEPAY" | "DANA" | "LINKAJA"
  successRedirectURL: string;
  failureRedirectURL: string;
  mobileNumber?: string;
}) {
  return EWallet.createEWalletCharge({
    referenceID:  params.externalId,
    currency:     "IDR",
    amount:       params.amount,
    checkoutMethod: "ONE_TIME_PAYMENT",
    channelCode:    params.channelCode,
    channelProperties: {
      successRedirectURL: params.successRedirectURL,
      failureRedirectURL: params.failureRedirectURL,
      mobileNumber:       params.mobileNumber,
    },
  });
}

export function verifyXenditWebhook(callbackToken: string): boolean {
  return callbackToken === process.env.XENDIT_WEBHOOK_TOKEN;
}
```

---

## 7. Upstash Redis — Caching & Rate Limiting

```typescript
// src/lib/redis.ts
import { Redis }     from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

export const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Default rate limiter: 60 requests per 60 seconds per identifier
export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "60 s"),
  prefix:  "fluencyhub:ratelimit",
});

// Strict rate limiter for payment endpoints
export const paymentRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  prefix:  "fluencyhub:payment",
});

// Webhook idempotency key (TTL: 24 hours)
export async function isWebhookDuplicate(txnId: string): Promise<boolean> {
  const key    = `webhook:processed:${txnId}`;
  const result = await redis.set(key, "1", { nx: true, ex: 86400 });
  return result === null; // null = key already existed = duplicate
}

// Cache helpers
export async function cacheGet<T>(key: string): Promise<T | null> {
  return redis.get<T>(key);
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
  await redis.set(key, value, { ex: ttlSeconds });
}

export async function cacheInvalidate(key: string): Promise<void> {
  await redis.del(key);
}

// Cache keys (centralised)
export const CACHE_KEYS = {
  publishedCourses:    "courses:published",
  courseBySlug:        (slug: string)    => `course:slug:${slug}`,
  activePaymentMethods: "payment_methods:active",
  enrollmentCheck:     (userId: number, courseId: number) =>
                         `enrollment:${userId}:${courseId}`,
  lessonProgress:      (userId: number, lessonId: number) =>
                         `progress:${userId}:${lessonId}`,
} as const;
```

**Cache usage in Server Components:**

```typescript
// src/app/(public)/page.tsx  — Landing page (SSR + cached)
import { listPublishedCourses } from "@/lib/db/courses.queries";
import { cacheGet, cacheSet, CACHE_KEYS } from "@/lib/redis";

export default async function LandingPage() {
  // Try cache first (5-minute TTL)
  let courses = await cacheGet(CACHE_KEYS.publishedCourses);
  if (!courses) {
    courses = await listPublishedCourses(6, 0);
    await cacheSet(CACHE_KEYS.publishedCourses, courses, 300);
  }
  return <LandingPageContent courses={courses} />;
}
```

---

## 8. Vercel Blob — File Storage

```typescript
// src/lib/blob.ts
import { put, del } from "@vercel/blob";

export async function uploadFile(params: {
  file:      File | Blob;
  folder:    "proofs" | "thumbnails" | "avatars";
  filename:  string;
}): Promise<{ url: string; pathname: string }> {
  const pathname = `${params.folder}/${Date.now()}-${params.filename}`;
  const blob = await put(pathname, params.file, {
    access:      "public",
    contentType: params.file instanceof File ? params.file.type : undefined,
  });
  return { url: blob.url, pathname: blob.pathname };
}

export async function deleteFile(url: string): Promise<void> {
  await del(url);
}
```

**Upload API route:**

```typescript
// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth }        from "@/lib/auth";
import { uploadFile }  from "@/lib/blob";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file     = formData.get("file") as File | null;
  const folder   = formData.get("folder") as string ?? "proofs";

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "File type not allowed" }, { status: 415 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 413 });
  }

  const result = await uploadFile({
    file,
    folder: folder as "proofs" | "thumbnails" | "avatars",
    filename: file.name,
  });

  return NextResponse.json({ url: result.url }, { status: 201 });
}
```

---

## 9. Migration & Seed (Drizzle Kit — Dev Tooling Only)

Drizzle is **never imported at runtime**. It is used solely as a CLI tool for:
- `drizzle-kit generate` — generates SQL migration files from `drizzle/schema.ts`
- `drizzle-kit push` — applies migrations to Neon
- `drizzle/seed.ts` — idempotent seed script run via `tsx drizzle/seed.ts`

```typescript
// drizzle/schema.ts  — mirrors ERD exactly (used by kit, never by app)
import { pgTable, bigserial, varchar, boolean, numeric,
         integer, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id:               bigserial("id", { mode: "number" }).primaryKey(),
  googleId:         varchar("google_id", { length: 255 }).unique(),
  name:             varchar("name", { length: 255 }).notNull(),
  email:            varchar("email", { length: 255 }).notNull().unique(),
  whatsappNumber:   varchar("whatsapp_number", { length: 20 }),
  passwordHash:     varchar("password_hash", { length: 255 }),
  role:             varchar("role", { length: 50 }).notNull().default("user"),
  avatarUrl:        text("avatar_url"),
  isActive:         boolean("is_active").notNull().default(true),
  revenueSharePct:  numeric("revenue_share_pct", { precision: 5, scale: 2 }).default("70.00"),
  lastLoginAt:      timestamp("last_login_at", { withTimezone: true }),
  createdAt:        timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:        timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt:        timestamp("deleted_at", { withTimezone: true }),
});

// ... (all other tables mirror ERD schema)
```

```typescript
// drizzle/seed.ts — idempotent: safe to run multiple times
import { neon } from "@neondatabase/serverless";
import "dotenv/config";

const sql = neon(process.env.DATABASE_URL!);

async function seed() {
  console.log("🌱 Seeding database...");

  // Idempotent: INSERT ... ON CONFLICT DO NOTHING
  await sql`
    INSERT INTO categories (name, slug, icon, sort_order) VALUES
      ('Applied English for STEM', 'applied-english-stem', 'flask', 1),
      ('Business Communication',   'business-communication', 'handshake', 2)
    ON CONFLICT (slug) DO NOTHING
  `;

  await sql`
    INSERT INTO users (google_id, name, email, role, is_active, revenue_share_pct)
    VALUES ('google_admin_001', 'FluencyHub Admin', 'admin@fluencyhub.id', 'admin', true, 0.00)
    ON CONFLICT (email) DO NOTHING
  `;

  // ... (full seed from ERD section 4)
  console.log("✅ Seed complete");
}

seed().catch(console.error);
```

```typescript
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema:    "./drizzle/schema.ts",
  out:       "./drizzle/migrations",
  dialect:   "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

**NPM scripts:**

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:push":     "drizzle-kit push",
    "db:seed":     "tsx drizzle/seed.ts",
    "db:studio":   "drizzle-kit studio"
  }
}
```

---

## 10. Component Architecture

### 10.1 Server vs Client Component Rules

| Component type | Default directive | When to add `"use client"` |
|---------------|------------------|---------------------------|
| Page (`.tsx` in `app/`) | Server | Never — data fetches happen server-side |
| Layout | Server | Never |
| Data display (tables, cards, text) | Server | Never |
| Curriculum editor (dnd-kit) | Must be client | Drag-and-drop requires DOM events |
| TipTap rich text editor | Must be client | Requires browser APIs |
| Recharts charts | Must be client | Canvas/SVG rendering |
| File upload input | Must be client | `<input type="file">` onChange |
| Payment method picker | Must be client | Interactive selection state |
| Countdown timer | Must be client | `setInterval` |
| Toast/notification | Must be client | State + animation |
| Snap modal trigger | Must be client | Midtrans JS SDK injection |

### 10.2 Key Shared Components

```
src/components/
├── ui/
│   ├── Button.tsx          — variants: primary, secondary, ghost, danger
│   ├── Input.tsx           — with label, error, helper text
│   ├── Select.tsx
│   ├── Modal.tsx           — accessible dialog (focus trap)
│   ├── Badge.tsx           — status colours from CHECK constraint values
│   ├── Spinner.tsx
│   ├── DataTable.tsx       — sortable, filterable, paginated (server-side)
│   ├── Pagination.tsx
│   ├── Toast.tsx           — "use client"
│   └── ConfirmDialog.tsx
│
├── layout/
│   ├── PublicNavbar.tsx    — landing page nav (Server)
│   ├── DashboardSidebar.tsx
│   └── AdminSidebar.tsx
│
├── course/
│   ├── CourseCard.tsx      — used on landing page + dashboard
│   ├── CoursePlayer.tsx    — YouTube iframe wrapper (Server)
│   ├── LiveClassJoin.tsx   — time-locked join button ("use client")
│   ├── LessonList.tsx      — syllabus sidebar (Server)
│   └── ProgressCheckbox.tsx — "use client"
│
├── checkout/
│   ├── CheckoutStepper.tsx — "use client" (multi-step state)
│   ├── PaymentMethodPicker.tsx — "use client"
│   ├── ProofUpload.tsx     — "use client"
│   └── SnapModal.tsx       — "use client" (injects Midtrans JS)
│
├── instructor/
│   ├── CurriculumEditor.tsx   — "use client" (dnd-kit)
│   ├── SortableSection.tsx    — "use client"
│   ├── SortableLesson.tsx     — "use client"
│   ├── LessonForm.tsx         — "use client" (TipTap + date picker)
│   └── CourseForm.tsx         — "use client"
│
├── editor/
│   └── RichTextEditor.tsx  — "use client", TipTap wrapper
│
└── charts/
    ├── RevenueChart.tsx    — "use client", Recharts LineChart
    ├── EnrollmentBar.tsx   — "use client", Recharts BarChart
    └── CompletionPie.tsx   — "use client", Recharts PieChart
```

### 10.3 Curriculum Drag-and-Drop (dnd-kit)

```typescript
// src/components/instructor/CurriculumEditor.tsx
"use client";
import {
  DndContext, closestCenter, KeyboardSensor,
  PointerSensor, useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { useState } from "react";
import { SortableSection } from "./SortableSection";

interface Props { courseId: number; initialSections: Section[] }

export function CurriculumEditor({ courseId, initialSections }: Props) {
  const [sections, setSections] = useState(initialSections);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(sections, oldIndex, newIndex);
    setSections(reordered);

    // Persist reorder to server
    await fetch(`/api/sections/reorder`, {
      method: "PATCH",
      body:   JSON.stringify({ courseId, order: reordered.map((s) => s.id) }),
      headers: { "Content-Type": "application/json" },
    });
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        {sections.map((section) => (
          <SortableSection key={section.id} section={section} courseId={courseId} />
        ))}
      </SortableContext>
    </DndContext>
  );
}
```

### 10.4 TipTap Rich Text Editor

```typescript
// src/components/editor/RichTextEditor.tsx
"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link      from "@tiptap/extension-link";
import Image     from "@tiptap/extension-image";
import { useEffect } from "react";

interface Props {
  value:    string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image,
    ],
    content:   value,
    onUpdate:  ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  return (
    <div className="border rounded-lg overflow-hidden">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} className="prose max-w-none p-4 min-h-[200px]" />
    </div>
  );
}
```

---

## 11. XLSX & PDF Export

### 11.1 Transaction Export (XLSX)

```typescript
// src/app/api/export/transactions/route.ts
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { auth }                from "@/lib/auth";
import { listOrdersForExport } from "@/lib/db/orders.queries";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const filters = {
    status:   searchParams.get("status")   ?? undefined,
    from:     searchParams.get("from")     ? new Date(searchParams.get("from")!) : undefined,
    to:       searchParams.get("to")       ? new Date(searchParams.get("to")!)   : undefined,
    courseId: searchParams.get("courseId") ? Number(searchParams.get("courseId")) : undefined,
  };

  const orders = await listOrdersForExport(filters);

  const worksheet = XLSX.utils.json_to_sheet(
    orders.map((o) => ({
      "Order Number":    o.order_number,
      "Buyer Name":      o.buyer_name,
      "Buyer Email":     o.buyer_email,
      "Course":          o.course_title,
      "Payment Method":  o.payment_method,
      "Provider":        o.provider,
      "Amount (IDR)":    o.total_amount,
      "Status":          o.status,
      "Paid At":         o.paid_at ? new Date(o.paid_at).toLocaleString("id-ID") : "-",
      "Created At":      new Date(o.created_at).toLocaleString("id-ID"),
    }))
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="transactions-${Date.now()}.xlsx"`,
    },
  });
}
```

### 11.2 Payment Receipt (PDF via jsPDF)

```typescript
// src/app/api/export/report/route.ts
import { NextRequest, NextResponse }  from "next/server";
import { jsPDF }                      from "jspdf";
import { auth }                       from "@/lib/auth";
import { getOrderByNumber }           from "@/lib/db/orders.queries";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orderNumber = req.nextUrl.searchParams.get("order");
  if (!orderNumber) return NextResponse.json({ error: "Missing order" }, { status: 400 });

  const order = await getOrderByNumber(orderNumber);
  if (!order || order.user_id !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text("FluencyHub — Payment Receipt", 20, 20);
  doc.setFontSize(12);
  doc.text(`Order: ${order.order_number}`, 20, 40);
  doc.text(`Amount: IDR ${Number(order.total_amount).toLocaleString("id-ID")}`, 20, 50);
  doc.text(`Status: ${order.status.toUpperCase()}`, 20, 60);
  doc.text(`Date: ${order.paid_at ? new Date(order.paid_at).toLocaleDateString("id-ID") : "-"}`, 20, 70);

  const buffer = Buffer.from(doc.output("arraybuffer"));

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":        "application/pdf",
      "Content-Disposition": `attachment; filename="receipt-${order.order_number}.pdf"`,
    },
  });
}
```

---

## 12. SSR Page Patterns

### 12.1 Landing Page — SSR + Redis Cache

```typescript
// src/app/(public)/page.tsx
import { Suspense }              from "react";
import { listPublishedCourses }  from "@/lib/db/courses.queries";
import { getActivePaymentMethods } from "@/lib/db/payment-methods.queries";
import { cacheGet, cacheSet, CACHE_KEYS } from "@/lib/redis";
import { HeroSection }           from "@/components/landing/HeroSection";
import { PricingSection }        from "@/components/landing/PricingSection";
import { CourseCard }            from "@/components/course/CourseCard";

export const revalidate = 300; // ISR fallback: revalidate every 5 min

export default async function LandingPage() {
  const [courses, paymentMethods] = await Promise.all([
    (async () => {
      const cached = await cacheGet(CACHE_KEYS.publishedCourses);
      if (cached) return cached;
      const data = await listPublishedCourses(6, 0);
      await cacheSet(CACHE_KEYS.publishedCourses, data, 300);
      return data;
    })(),
    (async () => {
      const cached = await cacheGet(CACHE_KEYS.activePaymentMethods);
      if (cached) return cached;
      const data = await getActivePaymentMethods();
      await cacheSet(CACHE_KEYS.activePaymentMethods, data, 600);
      return data;
    })(),
  ]);

  return (
    <>
      <HeroSection />
      <PricingSection courses={courses} paymentMethods={paymentMethods} />
    </>
  );
}
```

### 12.2 Course Player — SSR with Access Gate

```typescript
// src/app/dashboard/courses/[courseId]/[lessonId]/page.tsx
import { notFound, redirect } from "next/navigation";
import { auth }                from "@/lib/auth";
import { getCourseById }       from "@/lib/db/courses.queries";
import { getLessonById }       from "@/lib/db/lessons.queries";
import { checkEnrollment }     from "@/lib/db/enrollments.queries";
import { getLessonProgress }   from "@/lib/db/lesson-progress.queries";
import { CoursePlayer }        from "@/components/course/CoursePlayer";
import { LiveClassJoin }       from "@/components/course/LiveClassJoin";

interface Props {
  params: { courseId: string; lessonId: string };
}

export default async function LessonPage({ params }: Props) {
  const session = await auth();
  if (!session) redirect("/auth/signin");

  const [course, lesson, enrollment] = await Promise.all([
    getCourseById(Number(params.courseId)),
    getLessonById(Number(params.lessonId)),
    checkEnrollment(session.user.id, Number(params.courseId)),
  ]);

  if (!course || !lesson) notFound();

  // Free preview bypass
  if (!lesson.is_free_preview && !enrollment) {
    redirect(`/checkout?courseId=${course.id}`);
  }

  const progress = enrollment
    ? await getLessonProgress(session.user.id, lesson.id)
    : null;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left: Player */}
      <main className="flex-1 overflow-y-auto p-6">
        {lesson.content_type === "youtube_video" && (
          <CoursePlayer videoId={lesson.youtube_video_id!} lastPosition={progress?.last_position} />
        )}
        {lesson.content_type === "live_class" && (
          <LiveClassJoin
            url={lesson.live_class_url!}
            scheduledAt={lesson.live_class_datetime!}
            platform={lesson.live_class_platform!}
          />
        )}
      </main>
      {/* Right: Syllabus — Server component, no JS shipped */}
      <aside className="w-80 border-l overflow-y-auto">
        <LessonList courseId={course.id} currentLessonId={lesson.id} userId={session.user.id} />
      </aside>
    </div>
  );
}
```

---

## 13. Environment Variables

```bash
# .env.example

# Database
DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require

# Auth
NEXTAUTH_SECRET=<32-char random string>
NEXTAUTH_URL=https://fluencyhub.id
GOOGLE_CLIENT_ID=<from Google Console>
GOOGLE_CLIENT_SECRET=<from Google Console>

# Admin
NEXT_PUBLIC_ADMIN_PATH=secret-admin-panel   # URL segment, never expose in public JS
ADMIN_EMAILS=admin@fluencyhub.id,ops@fluencyhub.id

# Payment — Midtrans
MIDTRANS_CLIENT_KEY=<Mid-client-xxx>
MIDTRANS_SERVER_KEY=<Mid-server-xxx>

# Payment — Xendit
XENDIT_SECRET_KEY=<xnd_development_xxx>
XENDIT_WEBHOOK_TOKEN=<random-token>

# Storage
BLOB_READ_WRITE_TOKEN=<vercel blob token>

# Cache
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=<token>

# Notifications
RESEND_API_KEY=re_xxx
WHATSAPP_API_KEY=<fonnte or wablas key>
WHATSAPP_API_URL=https://api.fonnte.com/send
WHATSAPP_SENDER=628xxx

# App
NEXT_PUBLIC_BASE_URL=https://fluencyhub.id
```

---

## 14. Performance Strategy

| Layer | Technique |
|-------|-----------|
| **Pages** | SSR default; ISR (`revalidate`) for stable public pages (landing, course catalog) |
| **Database** | Neon HTTP mode (no persistent connections); all queries < 50ms via indexed columns |
| **Cache** | Upstash Redis for landing page courses, payment methods, enrollment checks (TTL 300–600s) |
| **Images** | `next/image` with Vercel Blob URLs; automatic WebP conversion + CDN edge cache |
| **Fonts** | `next/font` with `display: swap`; subset to Latin + Latin-Extended |
| **JS bundle** | RSC by default = zero JS shipped; `"use client"` only for interactive islands |
| **Streaming** | `<Suspense>` boundaries around slow DB fetches on dashboard pages |
| **Webhooks** | Respond 200 immediately; heavy processing (enrollment activation, notifications) runs in the same handler but after the DB write — no separate queue needed at MVP scale |
| **Rate limiting** | Upstash sliding window on all mutation endpoints; strict 5/min on payment routes |
| **Export** | XLSX/PDF generated server-side, streamed as binary response; no temp files |

---

## 15. Security Checklist

- [ ] All DB queries use parameterised Neon tagged templates — no string interpolation
- [ ] Webhook endpoints verify gateway signatures before any DB write
- [ ] Upstash deduplication key prevents double-processing of webhooks
- [ ] Admin path is only in `.env` — never in `NEXT_PUBLIC_*` or any HTML
- [ ] `httpOnly`, `Secure`, `SameSite=Strict` on the session cookie (NextAuth default)
- [ ] File uploads: type whitelist, 5MB cap, stored in Vercel Blob (not public `/public`)
- [ ] YouTube unlisted IDs are never rendered in page source — served via authenticated API endpoint that returns the embed URL only for enrolled users
- [ ] Live class URLs delivered only ≤ 30 minutes before `live_class_datetime` (checked server-side)
- [ ] `ADMIN_EMAILS` whitelist checked in middleware after Google OAuth — double-layer
- [ ] `Content-Security-Policy` header restricts script/frame sources (YouTube nocookie, Midtrans, Xendit)
- [ ] Rate limiting on `/api/auth`, `/api/orders`, `/api/webhooks` with Upstash

---

*TRD v1.0 — Engineering reference for FluencyHub. Aligns with PRD v1.0 and ERD v2.0.*
