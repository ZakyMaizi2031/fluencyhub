# 🤝 AGENTS.md — FluencyHub Multi-Agent Task Breakdown

> This file defines how multiple AI coding agents (Claude instances, Cursor, Copilot Workspace, etc.) can work on this monorepo in parallel without conflicts. Each agent has a clearly bounded domain, a defined input/output contract, and a list of files it owns.

---

## Agent Coordination Principles

1. **One agent owns one domain** — agents never write to files owned by another agent
2. **Contract files are shared read-only** — `src/types/db.ts` and `src/types/api.ts` are written by the DB Agent and read by all others
3. **Query files are the interface** — Page and API agents depend on `src/lib/db/*.queries.ts`, never on raw SQL
4. **Communication is through PRs** — agents propose changes via pull requests; the DB Agent must merge type changes before other agents unblock
5. **No merge conflicts in `route.ts` files** — each model has its own `route.ts`; agents never share one

---

## Agent Roster

```
┌─────────────────────────────────────────────────────────────┐
│  Agent 1: DB & Schema Agent                                  │
│  Agent 2: Payment & Webhook Agent                            │
│  Agent 3: Notification Agent                                 │
│  Agent 4: Landing Page & SEO Agent                           │
│  Agent 5: Checkout & Registration Agent                      │
│  Agent 6: Member Dashboard Agent                             │
│  Agent 7: Instructor Dashboard Agent                         │
│  Agent 8: Admin Panel Agent                                  │
│  Agent 9: Auth & Middleware Agent                            │
│  Agent 10: Export & Reporting Agent                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Agent 1 — DB & Schema Agent

**Responsibility:** Raw SQL query functions, TypeScript row types, Drizzle schema, migrations, seed.

**Owns (write access):**
```
src/lib/db/client.ts
src/lib/db/*.queries.ts          # all query files
src/types/db.ts                  # row types (shared contract)
drizzle/schema.ts
drizzle/migrations/
drizzle/seed.ts
```

**Reads (no write):**
```
prd.md, erd.md                   # requirements
```

**Produces for other agents:**
- Named query functions in `src/lib/db/*.queries.ts`
- TypeScript row types in `src/types/db.ts`
- Seed data via `pnpm db:seed`

**Task list:**
- [ ] Implement all query functions for every table in the ERD
- [ ] Write `src/types/db.ts` with all row types (matching DB column names → camelCase)
- [ ] Write `drizzle/schema.ts` mirroring ERD (for kit only)
- [ ] Write `drizzle/seed.ts` (idempotent — `ON CONFLICT DO NOTHING`)
- [ ] Verify all FK relationships work in migrations
- [ ] Add `listOrdersForExport(filters)` with all join columns needed by Export Agent
- [ ] Add `checkEnrollment(userId, courseId): Promise<boolean>` for access gating
- [ ] Add `getLiveClassLessonsForReminder(windowMinutes)` for Notification Agent

**Key rules:**
- All functions return typed objects — never `any`
- Use `RETURNING *` on every INSERT/UPDATE
- Filter `deleted_at IS NULL` on all SELECT (except explicit admin queries)
- Never import Drizzle in these files

---

## Agent 2 — Payment & Webhook Agent

**Responsibility:** Xendit Core API, Midtrans Core API + Snap fallback, webhook handlers, order lifecycle.

**Owns (write access):**
```
src/lib/payment/midtrans.ts
src/lib/payment/xendit.ts
src/app/api/orders/route.ts
src/app/api/orders/[id]/pay/route.ts
src/app/api/orders/[id]/status/route.ts
src/app/api/payment-proofs/route.ts
src/app/api/payment-proofs/[id]/verify/route.ts
src/app/api/webhooks/midtrans/route.ts
src/app/api/webhooks/xendit/route.ts
src/types/payment.ts
```

**Reads (no write):**
```
src/lib/db/orders.queries.ts
src/lib/db/enrollments.queries.ts
src/lib/db/payment-methods.queries.ts
src/lib/db/payment-proofs.queries.ts
src/lib/db/payment-logs.queries.ts
src/lib/db/webhook-logs.queries.ts
src/lib/redis.ts                    # isWebhookDuplicate(), paymentRatelimit
src/lib/blob.ts                     # proof upload
src/types/db.ts
```

**Task list:**
- [ ] `chargeMidtransCore(params)` — all payment types
- [ ] `createSnapToken(params)` — fallback Snap modal token
- [ ] `verifyMidtransSignature(orderId, statusCode, grossAmount, sig)` — SHA-512
- [ ] `createXenditVA(params)` — fixed closed VA per bank
- [ ] `createXenditQRIS(params)` — dynamic QRIS
- [ ] `createXenditEWallet(params)` — GoPay, DANA, ShopeePay, OVO, LinkAja
- [ ] `verifyXenditWebhook(callbackToken)` — header token check
- [ ] `POST /api/orders` — create order, log in `payment_logs`
- [ ] `POST /api/orders/[id]/pay` — call Core API, fallback to Snap, update order
- [ ] `GET  /api/orders/[id]/status` — return current order status (for polling)
- [ ] `POST /api/payment-proofs` — upload proof via Vercel Blob, create DB row
- [ ] `POST /api/payment-proofs/[id]/verify` — admin approve/reject
- [ ] `POST /api/webhooks/midtrans` — signature verify → update order → activate enrollment → trigger notification
- [ ] `POST /api/webhooks/xendit` — token verify → idempotency → update order → activate enrollment → trigger notification
- [ ] Upstash idempotency key on every webhook (`isWebhookDuplicate`)
- [ ] Log all gateway API calls to `payment_logs`
- [ ] Log all inbound webhooks to `webhook_logs`

**Critical flows:**
```
Xendit VA created → store va_number in orders table
Webhook received → isWebhookDuplicate() check → update order → createEnrollment() → notify()
Snap fallback → return { snapToken } → client-side SnapModal.tsx opens popup
```

---

## Agent 3 — Notification Agent

**Responsibility:** Email (Resend), WhatsApp (Fonnte/Wablas), template rendering, notification logging.

**Owns (write access):**
```
src/lib/notifications/email.ts
src/lib/notifications/whatsapp.ts
src/app/api/notifications/route.ts        # template CRUD (admin)
src/app/api/notifications/test/route.ts   # test send (admin)
```

**Reads (no write):**
```
src/lib/db/notification-templates.queries.ts
src/lib/db/notification-logs.queries.ts
src/lib/db/users.queries.ts
src/lib/db/orders.queries.ts
src/lib/db/lessons.queries.ts
src/types/db.ts
```

**Task list:**
- [ ] `sendEmail(to, templateId, variables)` — fetch template from DB, interpolate `{placeholders}`, send via Resend
- [ ] `sendWhatsApp(to, templateId, variables)` — fetch template, interpolate, POST to Fonnte/Wablas
- [ ] `sendPaymentSuccessNotifications(order)` — email + WA for `PAYMENT_SUCCESS`
- [ ] `sendVAPendingNotifications(order, vaNumber)` — email + WA for `PAYMENT_PENDING_VA`
- [ ] `sendManualTransferPendingNotifications(order)` — for `MANUAL_TRANSFER_PENDING`
- [ ] `sendPaymentRejectedNotification(order, note)` — for `PAYMENT_REJECTED`
- [ ] `sendLiveClassReminder(lesson, enrollment, hoursAhead)` — 24h and 1h
- [ ] Log every send attempt to `notification_logs` (success or failure)
- [ ] Retry logic: on FAILED status, retry up to 2 times with 1-minute backoff
- [ ] `GET /api/notifications` — list templates (admin)
- [ ] `PUT /api/notifications/[id]` — update template (admin)
- [ ] `POST /api/notifications/test` — test send to a specified recipient (admin)
- [ ] Cron endpoint `GET /api/cron/reminders` — query lessons with `reminder_sent_24h = false` where `live_class_datetime` is within 24h; send WA; mark flag

**Template interpolation:**
```typescript
function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
}
```

---

## Agent 4 — Landing Page & SEO Agent

**Responsibility:** Public landing page, SEO metadata, all public-facing marketing sections.

**Owns (write access):**
```
src/app/(public)/page.tsx
src/app/(public)/layout.tsx
src/components/landing/HeroSection.tsx
src/components/landing/ProblemSection.tsx
src/components/landing/MethodSection.tsx
src/components/landing/VideoPreviewSection.tsx
src/components/landing/InstructorSection.tsx
src/components/landing/TestimonialSection.tsx
src/components/landing/PricingSection.tsx
src/components/landing/FaqSection.tsx
src/components/landing/FinalCtaSection.tsx
src/components/layout/PublicNavbar.tsx
src/components/layout/PublicFooter.tsx
```

**Reads (no write):**
```
src/lib/db/courses.queries.ts            # listPublishedCourses()
src/lib/db/payment-methods.queries.ts    # getActivePaymentMethods()
src/lib/redis.ts                         # cacheGet, cacheSet, CACHE_KEYS
src/types/db.ts
```

**Task list:**
- [ ] `LandingPage` — SSR, no `"use client"` at page level
- [ ] Parallel `Promise.all` for courses + payment methods
- [ ] Redis cache for published courses (5 min TTL)
- [ ] `generateMetadata()` — title, description, OG image, canonical URL
- [ ] `HeroSection` — headline, sub-headline, two CTAs (anchor scroll)
- [ ] `ProblemSection` — 4 pain points with icons
- [ ] `MethodSection` — Tab toggle Online/Live (client island for tab state only)
- [ ] `VideoPreviewSection` — YouTube public teaser embed (public video only)
- [ ] `InstructorSection` — instructor cards from static props or DB
- [ ] `TestimonialSection` — static testimonial data (or from DB if managed)
- [ ] `PricingSection` — dynamic course cards from DB; "Buy Now" → `/checkout?courseId=x`
- [ ] `FaqSection` — accordion (client island for open/close state)
- [ ] `FinalCtaSection` — last-chance conversion banner
- [ ] `PublicNavbar` — "Log in Member" → `/auth/signin?callbackUrl=/dashboard`; no admin link
- [ ] `PublicFooter` — links, social, legal
- [ ] Smooth scroll to anchors
- [ ] `robots.txt` — disallow `/${ADMIN_PATH}`, allow everything else
- [ ] `sitemap.xml` — include landing page + published course slugs
- [ ] Structured data (JSON-LD) for course schema

**Performance target:** LCP < 2s, CLS = 0

---

## Agent 5 — Checkout & Registration Agent

**Responsibility:** Multi-step checkout, inline registration, payment method selection, Snap modal integration.

**Owns (write access):**
```
src/app/(public)/checkout/page.tsx
src/components/checkout/CheckoutStepper.tsx
src/components/checkout/PaymentMethodPicker.tsx
src/components/checkout/OrderSummary.tsx
src/components/checkout/ProofUpload.tsx
src/components/checkout/SnapModal.tsx
src/components/checkout/VAInstructions.tsx
src/components/checkout/SuccessPage.tsx
src/app/(public)/checkout/success/page.tsx
```

**Reads (no write):**
```
src/lib/db/courses.queries.ts
src/lib/db/payment-methods.queries.ts
src/lib/db/payment-instructions.queries.ts
src/app/api/orders/route.ts            # calls this via fetch
src/app/api/orders/[id]/pay/route.ts   # calls this via fetch
src/types/db.ts
src/types/api.ts
```

**Task list:**
- [ ] `CheckoutStepper` — `"use client"`, 4-step state machine:
  - Step 1: Course summary
  - Step 2: Register / SSO login
  - Step 3: Payment method picker (loads from `/api/payment-methods`)
  - Step 4: Payment instructions + action button
- [ ] `PaymentMethodPicker` — grouped by type (e-wallet, VA, QR, manual)
- [ ] `OrderSummary` — course name, price, fee, total, coupon input
- [ ] `VAInstructions` — show VA number after Xendit/Midtrans Core API responds
- [ ] `SnapModal` — inject Midtrans JS, open Snap on `snapToken` received
  ```html
  <script src="https://app.sandbox.midtrans.com/snap/snap.js"
          data-client-key={clientKey} />
  ```
- [ ] `ProofUpload` — file picker → `POST /api/upload?folder=proofs` → `POST /api/payment-proofs`
- [ ] `SuccessPage` — server-rendered; show order summary from DB by `orderNumber` query param
- [ ] Redirect from `/checkout?courseId=x` → if already enrolled → `/dashboard/courses/x`
- [ ] Inline registration: name, email, WhatsApp number, optional password
- [ ] "Continue with Google" SSO in Step 2 (saves `checkout_intent` in session)
- [ ] Coupon validation: `POST /api/coupons/validate` before placing order

---

## Agent 6 — Member Dashboard Agent

**Responsibility:** Learner-facing dashboard — home, my courses, lesson player, progress, profile.

**Owns (write access):**
```
src/app/dashboard/layout.tsx
src/app/dashboard/page.tsx
src/app/dashboard/courses/page.tsx
src/app/dashboard/courses/[courseId]/page.tsx
src/app/dashboard/courses/[courseId]/[lessonId]/page.tsx
src/app/dashboard/profile/page.tsx
src/components/course/CourseCard.tsx
src/components/course/CoursePlayer.tsx
src/components/course/LiveClassJoin.tsx
src/components/course/LessonList.tsx
src/components/course/ProgressCheckbox.tsx
src/components/layout/DashboardSidebar.tsx
src/app/api/lesson-progress/route.ts
```

**Reads (no write):**
```
src/lib/db/courses.queries.ts
src/lib/db/sections.queries.ts
src/lib/db/lessons.queries.ts
src/lib/db/enrollments.queries.ts
src/lib/db/lesson-progress.queries.ts
src/lib/db/orders.queries.ts
src/types/db.ts
```

**Task list:**
- [ ] Dashboard home — enrolled courses with progress bars; upcoming live classes with countdown
- [ ] My Courses page — list of active enrollments; "Continue Learning" links
- [ ] Course detail page — SSR; enrollment gate (redirect to checkout if not enrolled)
- [ ] Lesson player — split-screen: YouTube iframe (left) + lesson list (right)
- [ ] YouTube iframe: `youtube-nocookie.com`; `youtube_video_id` only delivered after server-side enrollment check
- [ ] `LiveClassJoin` (`"use client"`) — countdown timer; "Join" button unlocked ≤ 30 min before; `live_class_url` only server-rendered if within window
- [ ] `ProgressCheckbox` (`"use client"`) — marks lesson done via `PATCH /api/lesson-progress`
- [ ] `PATCH /api/lesson-progress` — update `is_completed`, `last_position`; recalculate course `progress_pct` in enrollments
- [ ] Profile page — edit name, avatar upload → `POST /api/upload?folder=avatars`; transaction history
- [ ] DashboardSidebar — nav links; current user avatar + name (server-side)
- [ ] `revalidatePath("/dashboard")` after progress update

---

## Agent 7 — Instructor Dashboard Agent

**Responsibility:** Instructor-facing tools — course CRUD, curriculum editor, lesson form, analytics.

**Owns (write access):**
```
src/app/instructor/layout.tsx
src/app/instructor/page.tsx
src/app/instructor/courses/page.tsx
src/app/instructor/courses/new/page.tsx
src/app/instructor/courses/[courseId]/page.tsx
src/app/instructor/courses/[courseId]/curriculum/page.tsx
src/app/instructor/analytics/page.tsx
src/components/instructor/CurriculumEditor.tsx
src/components/instructor/SortableSection.tsx
src/components/instructor/SortableLesson.tsx
src/components/instructor/LessonForm.tsx
src/components/instructor/CourseForm.tsx
src/components/layout/InstructorSidebar.tsx
src/app/api/sections/route.ts
src/app/api/sections/[id]/route.ts
src/app/api/sections/reorder/route.ts
src/app/api/lessons/route.ts
src/app/api/lessons/[id]/route.ts
src/app/api/lessons/reorder/route.ts
```

**Reads (no write):**
```
src/lib/db/courses.queries.ts
src/lib/db/sections.queries.ts
src/lib/db/lessons.queries.ts
src/lib/db/enrollments.queries.ts
src/lib/db/orders.queries.ts
src/lib/blob.ts                       # thumbnail upload
src/types/db.ts
src/components/editor/RichTextEditor.tsx
src/components/charts/RevenueChart.tsx
```

**Task list:**
- [ ] Instructor home — total revenue, total enrolled, active courses stat cards
- [ ] Course list — only instructor's own courses; status badges
- [ ] Create course — `CourseForm` with TipTap description; thumbnail upload
- [ ] Edit course — same form, pre-populated
- [ ] Curriculum page — `CurriculumEditor` (dnd-kit): drag sections + drag lessons within section
- [ ] `SortableSection` — expand/collapse; add lesson; delete section
- [ ] `SortableLesson` — show lesson type badge; edit button
- [ ] `LessonForm` — content_type selector; conditional fields:
  - `youtube_video`: URL input + preview; auto-extract video ID
  - `live_class`: datetime picker; platform selector (Zoom/GMeet); URL input
  - `document`: file upload to Vercel Blob
  - `text`: TipTap editor
- [ ] URL validation: YouTube regex, Zoom/GMeet regex (client-side + server-side)
- [ ] `PATCH /api/sections/reorder` — accept `{ courseId, order: [id, ...] }`; update `sort_order`
- [ ] `PATCH /api/lessons/reorder` — same pattern within a section
- [ ] Analytics page — `RevenueChart` (monthly), enrollment count per course (BarChart)
- [ ] Revenue split display: instructor share vs platform fee

---

## Agent 8 — Admin Panel Agent

**Responsibility:** Full platform management — courses, instructors, users, payments, payment method config, notifications, audit log.

**Owns (write access):**
```
src/app/[adminPath]/layout.tsx
src/app/[adminPath]/page.tsx                        # KPI dashboard
src/app/[adminPath]/courses/page.tsx
src/app/[adminPath]/instructors/page.tsx
src/app/[adminPath]/users/page.tsx
src/app/[adminPath]/payments/page.tsx
src/app/[adminPath]/payments/verify/page.tsx
src/app/[adminPath]/payments/methods/page.tsx
src/app/[adminPath]/notifications/page.tsx
src/components/admin/StatCard.tsx
src/components/admin/DataTable.tsx
src/components/admin/TransactionRow.tsx
src/components/admin/ProofViewer.tsx
src/components/admin/PaymentMethodToggle.tsx
src/components/layout/AdminSidebar.tsx
src/app/api/admin/stats/route.ts
src/app/api/admin/courses/route.ts
src/app/api/admin/courses/[id]/route.ts
src/app/api/admin/users/route.ts
src/app/api/admin/users/[id]/route.ts
src/app/api/admin/users/[id]/enroll/route.ts
src/app/api/payment-methods/route.ts
src/app/api/payment-methods/[id]/route.ts
src/app/api/coupons/route.ts
src/app/api/coupons/[id]/route.ts
```

**Reads (no write):**
```
src/lib/db/*.queries.ts             # all of them
src/lib/redis.ts
src/types/db.ts
src/components/charts/
src/components/ui/DataTable.tsx
```

**Task list:**
- [ ] KPI dashboard — cards: today's revenue, total revenue, active learners, pending verifications, live classes today
- [ ] All courses table — filter by status/instructor/category; approve/reject/feature toggles
- [ ] All instructors — add (by email whitelist), deactivate, revenue share editor
- [ ] All users — filter; manual enrollment add/remove; deactivate
- [ ] All transactions — `DataTable` with filter (status, method, date range, course); paginated
- [ ] Manual transfer verification queue — `ProofViewer` (image/PDF inline preview); Confirm / Reject with note
- [ ] On confirm: `updateOrderStatus → 'paid'` + `createEnrollment` + `sendPaymentSuccessNotifications`
- [ ] On reject: `updateOrderStatus → 'rejected'` (add field) + `sendPaymentRejectedNotification`
- [ ] Payment method config — `PaymentMethodToggle` per method; edit display name, logo URL, fees, sort order
- [ ] Add/edit bank account details for manual transfer methods
- [ ] Notification template editor — TipTap for email HTML; plain textarea for WA; test send
- [ ] Audit log viewer — table of all admin actions; filter by action/entity/date
- [ ] `GET /api/admin/stats` — revenue totals, learner count, etc.
- [ ] All write actions logged to `audit_logs` via `logAdminAction(adminId, action, entityType, entityId, before, after)`

---

## Agent 9 — Auth & Middleware Agent

**Responsibility:** NextAuth config, Google OAuth, session/token management, middleware route protection.

**Owns (write access):**
```
src/lib/auth.ts
src/middleware.ts
src/app/auth/signin/page.tsx
src/app/auth/error/page.tsx
src/app/api/auth/[...nextauth]/route.ts
src/app/api/users/route.ts                  # GET /api/users/me
src/app/api/users/[id]/route.ts             # PATCH (self-update only)
```

**Reads (no write):**
```
src/lib/db/users.queries.ts
src/lib/redis.ts                    # ratelimit on /api/auth/*
src/types/db.ts
```

**Task list:**
- [ ] `src/lib/auth.ts` — NextAuth v5 config: Google provider, `signIn`, `jwt`, `session` callbacks
- [ ] On first Google login: `getUserByEmail` → not found → `createUser` with role `'user'`
- [ ] JWT callback: attach `id` and `role` from DB to token
- [ ] Session callback: expose `session.user.id` and `session.user.role`
- [ ] `src/middleware.ts`:
  - Protect `/dashboard/*` → require any authenticated user
  - Protect `/instructor/*` → require `role = 'instructor'`
  - Protect `/${ADMIN_PATH}/*` → require `role = 'admin'` AND email in `ADMIN_EMAILS`
  - Preserve `?callbackUrl` on redirect to sign-in
- [ ] Sign-in page — "Continue with Google" button; clean UI; no username/password form visible
- [ ] Error page — friendly error for auth failures (e.g., role mismatch)
- [ ] `GET /api/users/me` — return current user from DB (used by client components that need user data)
- [ ] `PATCH /api/users/[id]` — self-update: name, avatar only; cannot change role or email
- [ ] Rate limit on `/api/auth/*`: max 10 req/min per IP

---

## Agent 10 — Export & Reporting Agent

**Responsibility:** XLSX transaction export, PDF receipt generation, admin report downloads.

**Owns (write access):**
```
src/app/api/export/transactions/route.ts
src/app/api/export/report/route.ts
src/app/api/export/enrollment-report/route.ts
```

**Reads (no write):**
```
src/lib/db/orders.queries.ts          # listOrdersForExport()
src/lib/db/enrollments.queries.ts
src/lib/db/courses.queries.ts
src/types/db.ts
```

**Task list:**
- [ ] `GET /api/export/transactions` — admin only; XLSX with filters (status, method, date, courseId); columns: order number, buyer, course, method, provider, amount, status, paid date
- [ ] `GET /api/export/report?order=FH-xxx` — user can download their own receipt as PDF; admin can download any
- [ ] `GET /api/export/enrollment-report` — admin only; per-course enrollment count + progress stats; XLSX
- [ ] All exports stream binary response (no temp files on disk)
- [ ] Enforce auth + role on every route
- [ ] Include generation timestamp in filename: `transactions-20260911.xlsx`

---

## Dependency Graph (Who Blocks Whom)

```
Agent 1 (DB)
    └── unblocks ALL other agents (types + query functions)

Agent 9 (Auth)
    └── unblocks Agents 4, 5, 6, 7, 8 (middleware + session)

Agent 2 (Payment)
    └── unblocks Agent 5 (Checkout uses payment API)
    └── unblocks Agent 8 (Admin reads payment logs)

Agent 3 (Notifications)
    └── is called by Agent 2 (payment success)
    └── is called by Agent 8 (manual payment verify)

Agent 4 (Landing)       ← depends on Agent 1, Agent 9
Agent 5 (Checkout)      ← depends on Agent 1, Agent 2, Agent 9
Agent 6 (Member)        ← depends on Agent 1, Agent 9
Agent 7 (Instructor)    ← depends on Agent 1, Agent 9
Agent 8 (Admin)         ← depends on Agent 1, Agent 2, Agent 3, Agent 9
Agent 10 (Export)       ← depends on Agent 1, Agent 9
```

**Recommended parallel start order:**
```
Phase 1 (unblock all):  Agent 1, Agent 9
Phase 2 (core flows):   Agent 2, Agent 3, Agent 4
Phase 3 (UX):           Agent 5, Agent 6, Agent 7
Phase 4 (management):   Agent 8, Agent 10
```

---

## Shared Contracts (Never Modified Without Consensus)

### `src/types/db.ts` — row types (Agent 1 owns, all read)

```typescript
// Example subset — Agent 1 writes the full file
export interface User {
  id:               number;
  googleId:         string | null;
  name:             string;
  email:            string;
  whatsappNumber:   string | null;
  passwordHash:     string | null;
  role:             "user" | "instructor" | "admin";
  avatarUrl:        string | null;
  isActive:         boolean;
  revenueSharePct:  string;        // numeric from DB comes as string
  lastLoginAt:      Date | null;
  createdAt:        Date;
  updatedAt:        Date;
  deletedAt:        Date | null;
}

export interface Order {
  id:                    number;
  userId:                number;
  courseId:              number;
  paymentMethodId:       number | null;
  orderNumber:           string;
  gatewayTransactionId:  string | null;
  gatewayPaymentUrl:     string | null;
  vaNumber:              string | null;
  status:                "pending" | "awaiting_payment" | "pending_verification"
                         | "paid" | "failed" | "expired" | "refunded" | "cancelled";
  subtotal:              string;
  adminFee:              string;
  discountAmount:        string;
  totalAmount:           string;
  currency:              string;
  couponCode:            string | null;
  instructorRevenue:     string | null;
  platformRevenue:       string | null;
  paidAt:                Date | null;
  expiresAt:             Date | null;
  notes:                 string | null;
  createdAt:             Date;
  updatedAt:             Date;
}

// ... all other tables
```

### `src/types/api.ts` — request/response shapes (Agent 1 + each agent extends their own)

```typescript
export interface ApiResponse<T> {
  data:  T;
  error?: never;
}
export interface ApiError {
  error: string | Record<string, unknown>;
  data?:  never;
}
export type ApiResult<T> = ApiResponse<T> | ApiError;

// Pagination
export interface PaginatedResponse<T> {
  data:   T[];
  total:  number;
  page:   number;
  limit:  number;
}
```

---

## File Ownership Summary

| File / Directory | Owner Agent |
|-----------------|-------------|
| `src/lib/db/**` | Agent 1 |
| `src/types/db.ts` | Agent 1 |
| `drizzle/**` | Agent 1 |
| `src/lib/payment/**` | Agent 2 |
| `src/app/api/webhooks/**` | Agent 2 |
| `src/app/api/orders/**` | Agent 2 |
| `src/app/api/payment-proofs/**` | Agent 2 |
| `src/lib/notifications/**` | Agent 3 |
| `src/app/api/notifications/**` | Agent 3 |
| `src/app/(public)/page.tsx` + `src/components/landing/**` | Agent 4 |
| `src/app/(public)/checkout/**` + `src/components/checkout/**` | Agent 5 |
| `src/app/dashboard/**` + `src/components/course/**` | Agent 6 |
| `src/app/instructor/**` + `src/components/instructor/**` | Agent 7 |
| `src/app/[adminPath]/**` + `src/components/admin/**` | Agent 8 |
| `src/lib/auth.ts` + `src/middleware.ts` | Agent 9 |
| `src/app/api/export/**` | Agent 10 |
| `src/components/ui/**` | Shared — any agent can add, no agent deletes |
| `src/components/editor/**` | Shared — Agent 7 creates, others read |
| `src/components/charts/**` | Shared — Agent 7 creates, Agent 8 reads |
| `src/lib/redis.ts` | Agent 9 creates — others read only |
| `src/lib/blob.ts` | Agent 2 creates — others read only |
| `src/lib/utils/**` | Agent 1 creates — all read |

---

*AGENTS.md v1.0 — Update this file whenever a new agent is added or ownership boundaries change.*
