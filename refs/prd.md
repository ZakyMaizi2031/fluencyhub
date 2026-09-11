# 📋 Product Requirements Document (PRD)
## FluencyHub — Online Learning Platform

**Version:** 1.0.0
**Date:** 2026-09-11
**Status:** Draft — Ready for Development
**Product Owner:** FluencyHub Team

---

## 1. Executive Summary

FluencyHub is a SaaS-based online learning platform focused on Applied English courses for STEM professionals and career advancement. Its architecture is modelled after Udemy but with a more personal learning experience, live class support via Zoom/Google Meet, and Indonesian local payment methods (Midtrans, Xendit, manual bank transfer).

The platform is built in a **single monorepo** with three primary roles: **User/Learner**, **Instructor**, and **Administrator**. All authentication uses **Google OAuth2 SSO**, with the admin endpoint never exposed in public navigation.

---

## 2. Goals & Objectives

| Goal | Success Metric |
|------|---------------|
| High landing page conversion | Checkout CTR ≥ 8% of unique visitors |
| Fast onboarding | User can access a course within < 5 minutes of payment |
| Instructor retention | ≥ 90% of instructors upload content monthly |
| Verified revenue | 0% unresolved payment disputes within 48 hours |
| Real-time notifications | Email + WhatsApp delivery rate ≥ 97% |

---

## 3. Scope

### 3.1 In Scope (MVP)

- Public landing page with high-conversion copywriting
- Multi-gateway checkout system (Midtrans, Xendit, Manual Bank Transfer)
- User registration integrated into the checkout flow
- Automated email and WhatsApp notifications
- Member dashboard for accessing video content (YouTube Unlisted) and live classes
- Instructor dashboard for managing course content
- Full admin panel for platform management
- Google SSO Login for all roles
- Single repository (monorepo)

### 3.2 Out of Scope (Post-MVP)

- Native mobile apps (iOS/Android)
- Automated digital certificates
- Forum/community system
- Referral/affiliate program
- Proprietary video streaming (non-YouTube)

---

## 4. User Personas

### 4.1 Persona 1 — Sarah, STEM Professional (User/Learner)

> **"I'm an engineer at a multinational company. My English is passive. I need a practical way to handle international presentations and meetings."**

- **Age:** 25–40
- **Devices:** Desktop (at work) + Mobile (commute)
- **Needs:** On-demand video access, join live sessions from laptop
- **Pain point:** Doesn't want friction when signing up — wants to pay and access immediately

### 4.2 Persona 2 — Budi, English Instructor

> **"I have unlisted YouTube content and a weekly Zoom live class schedule. I need a clean platform to monetise it."**

- **Age:** 28–50
- **Needs:** Add video URLs (YouTube), schedule live classes, monitor enrollments
- **Pain point:** Doesn't want to deal with technical overhead — focus is on content

### 4.3 Persona 3 — FluencyHub Admin

> **"I need full control: verify manual payments, activate/deactivate courses, and monitor all transactions."**

- **Needs:** Centralised dashboard, manage manual payments, manage users & instructors
- **Access:** Only via hidden URL + Google SSO (role-based)

---

## 5. Feature Requirements

---

### 5.1 FEATURE 1 — Landing Page (Public)

**Priority:** P0 — Critical

#### 5.1.1 Objective

Convert general visitors into buyers using persuasive copywriting, social proof, and clear calls-to-action.

#### 5.1.2 Page Structure

```
[Navbar]
├── FluencyHub Logo
├── Nav Links: Root Problem | Method | Class Videos | Instructor | Testimonials
├── Secondary CTA: "Log in Member" (Google SSO)
└── Primary CTA: "Start Free Trial / View Courses"

[SECTION 1 — Hero]
├── Headline: "Master English for Career & STEM"
├── Sub-headline: Problem agitation + promise
├── Primary CTA: "View Course Options" → anchor #pricing
├── Secondary CTA: "How the Hybrid Method Works" → anchor #method
└── Visual: Dashboard illustration/mockup

[SECTION 2 — Problem Agitation]
├── "Why is your English still stuck?"
└── 3–4 pain points with icons (grammar memorisation, lack of context, etc.)

[SECTION 3 — Methodology]
├── Tabs: Online vs Live Class (Offline)
└── Curriculum breakdown per phase

[SECTION 4 — Class Video Preview]
├── YouTube embed (unlisted/public teaser)
└── CTA: "Sign Up for Full Access"

[SECTION 5 — Instructor Authority]
├── Photo, name, short bio
└── Credentials & experience

[SECTION 6 — Testimonials]
├── 6–9 testimonials with photo, name, profession
└── Star ratings

[SECTION 7 — Pricing]
├── Available course cards (loaded from DB)
├── Crossed-out original price + promo price
├── Urgency badge (countdown / limited slots)
└── CTA: "Buy Now" → triggers checkout modal

[SECTION 8 — FAQ]
└── 6–8 accordion questions

[SECTION 9 — Final CTA]
└── Last-chance conversion banner

[FOOTER]
├── Navigation links
├── Social media
└── Privacy policy & terms
```

#### 5.1.3 Copywriting Requirements

- Headline formula: **Specific Outcome + Target Audience + Without The Main Obstacle**
- Sub-headline: Problem → Agitation → Solution (PAS Framework)
- Testimonials: STAR format (Situation, Task, Action, Result)
- Pricing section: anchor pricing with crossed-out original price
- "Best Seller" / "Limited Slots" badge on popular courses
- Countdown timer for time-limited promotions

#### 5.1.4 Acceptance Criteria

- [ ] Page loads in < 3 seconds (LCP)
- [ ] All CTA anchors work with smooth scroll
- [ ] Course cards are rendered dynamically from the database
- [ ] Fully responsive: mobile, tablet, desktop
- [ ] SEO: meta title, description, and OG tags are set
- [ ] "Log in Member" nav button only shows the Google SSO popup

---

### 5.2 FEATURE 2 — Checkout & Integrated Registration

**Priority:** P0 — Critical

#### 5.2.1 Checkout Flow

```
User clicks "Buy Now" on the landing page
    │
    ▼
[Checkout Modal / Page]
    ├── Step 1: Select Course (if not yet selected)
    ├── Step 2: Registration Form (if not logged in)
    │           ├── Full Name
    │           ├── Email
    │           ├── WhatsApp Number (required)
    │           ├── Password (optional if using SSO)
    │           └── OR: "Continue with Google" (SSO)
    ├── Step 3: Select Payment Method
    │           ├── 💳 Midtrans (credit card, GoPay, OVO, Dana, etc.)
    │           ├── 🏦 Xendit (VA BCA, BNI, Mandiri, BRI, QRIS)
    │           └── 🏧 Manual Bank Transfer (admin-configured account)
    ├── Step 4: Order Review + Confirmation
    └── Step 5: Payment

[After Payment]
    ├── Midtrans/Xendit: Redirect to success page (automatic webhook)
    ├── Manual Transfer: Transfer instructions page + proof upload
    └── Notification: Email + WhatsApp sent automatically
```

#### 5.2.2 Payment Methods

**Midtrans Integration**
- Payment types: `credit_card`, `gopay`, `shopeepay`, `qris`, `bank_transfer` (BCA, BNI, BRI, Mandiri, Permata)
- Mode: Snap.js popup or redirect
- Webhook: `POST /api/webhooks/midtrans` (signature verification)
- Status mapping: `settlement` → activate access, `expire` → cancel order

**Xendit Integration**
- Payment types: Virtual Account (BCA, BNI, Mandiri, BRI), QRIS, E-Wallet (Dana, OVO, LinkAja)
- Webhook: `POST /api/webhooks/xendit` (x-callback-token verification)
- Status mapping: `PAID` → activate access, `EXPIRED` → cancel order

**Manual Bank Transfer**
- Admin defines the destination bank account (bank name, account number, account holder)
- User uploads proof of transfer (photo/PDF)
- Status flow: `pending_verification` → admin review → `confirmed` or `rejected`
- Admin notification: email to admin@fluencyhub.id when new proof is uploaded
- Verification SLA: 1×24 business hours

#### 5.2.3 Notification System

**Email (via SMTP / Resend / Mailgun)**

| Trigger | Recipient | Content |
|---------|-----------|---------|
| Order created | User | Order confirmation + payment instructions |
| Payment confirmed (auto gateway) | User | Welcome + course access link |
| Manual payment confirmed | User | Course access now active |
| Manual payment rejected | User | Rejection reason + retry guidance |
| Live class reminder | Enrolled user | Day-before and 1 hour before |
| New instructor joined | Admin | Review notification |
| Transfer proof uploaded | Admin | Verification request |

**WhatsApp (via WhatsApp Business API / Fonnte / Wablas)**

| Trigger | Message |
|---------|---------|
| Payment confirmed | "Hi [Name]! Access to [Course Name] is now active. Click: [link]" |
| Manual transfer pending | "Thank you [Name]! Your payment is being verified (1×24 hrs)" |
| Live class reminder (day before) | "Don't forget! Live class tomorrow at [time]. Link: [zoom/gmeet url]" |
| Live class reminder (1 hour) | "Your live class starts in 1 hour! Click to join: [url]" |

#### 5.2.4 Acceptance Criteria

- [ ] Checkout can be completed without a pre-existing account (inline registration)
- [ ] Google SSO can be used at the registration step
- [ ] Midtrans Snap.js integrated and working in sandbox + production
- [ ] Xendit VA and QRIS working
- [ ] Manual transfer displays correct bank account details
- [ ] Transfer proof upload (max 5MB, jpg/png/pdf)
- [ ] Midtrans and Xendit webhook signatures are verified
- [ ] Email delivered within < 2 minutes of the event trigger
- [ ] WhatsApp delivered within < 1 minute of the event trigger
- [ ] Success page shows a purchase summary
- [ ] Course access is activated automatically after payment webhook is received

---

### 5.3 FEATURE 3 — Instructor Dashboard

**Priority:** P1 — High

#### 5.3.1 Access & Authentication

- Login via Google SSO
- The `instructor` role is assigned by an admin (cannot be self-assigned)
- URL: `/instructor` or `/dashboard/instructor`
- Redirects to an access request page if the Google account has not been whitelisted as an instructor

#### 5.3.2 Instructor Modules

**A. Course Management**

```
My Courses List
    ├── Create New Course
    │       ├── Course title
    │       ├── Description (rich text)
    │       ├── Category / Tags
    │       ├── Thumbnail (image upload)
    │       ├── Price (IDR)
    │       ├── Status: Draft | Published | Archived
    │       └── Curriculum order (drag-and-drop sections + lessons)
    │
    └── Edit Existing Course
            ├── Update all fields above
            └── Add / remove / reorder lessons
```

**B. Lesson Content Management**

Each lesson contains:

| Field | Type | Description |
|-------|------|-------------|
| `title` | text | Lesson title |
| `content_type` | varchar | `youtube_video` \| `live_class` \| `document` \| `text` |
| `youtube_url` | text | YouTube URL (unlisted allowed) |
| `live_class_url` | text | Zoom or Google Meet URL |
| `live_class_datetime` | timestamp | Live class scheduled date and time |
| `live_class_platform` | varchar | `zoom` \| `gmeet` |
| `description` | text | Lesson description |
| `duration_minutes` | integer | Estimated duration |
| `is_free_preview` | boolean | Whether accessible without purchase |
| `sort_order` | integer | Display order |

**C. Course Statistics**

- Total enrollments per course
- Total revenue (before platform fee deduction)
- Learner completion rate
- Upcoming live class dates

#### 5.3.3 Acceptance Criteria

- [ ] Instructors can only view/edit their own courses
- [ ] YouTube URL format is validated (youtube.com/watch?v= or youtu.be/)
- [ ] Zoom/GMeet URL format is validated
- [ ] Live class datetime is required when `content_type = live_class`
- [ ] Draft status = not shown on the landing page
- [ ] Published status = shown on the landing page (after admin approval if the flow requires it)
- [ ] Thumbnail is automatically resized to 16:9 (1280×720)
- [ ] Lessons can be reordered via drag-and-drop
- [ ] WhatsApp notification automatically sent to enrolled users 24 hours before a live class

---

### 5.4 FEATURE 4 — User / Member Dashboard

**Priority:** P0 — Critical

#### 5.4.1 Access & Authentication

- Login via Google SSO ("Log in Member" button in the landing page navbar)
- If email already registered → log in directly
- If new email → redirect to checkout or course browse page

#### 5.4.2 Member Dashboard Modules

**A. Home**
- Courses in progress (progress bar per course)
- Upcoming live classes (countdown + join button)
- Recent notifications

**B. My Courses Page**
- List of purchased courses
- Status: `active` | `expired` (if access has an expiry)
- "Continue Learning" button

**C. Course Detail / Player Page**

```
Split-Screen Layout
├── Left: Video Player / Live Class Info
│       ├── YouTube embed (iframe via youtube-nocookie.com)
│       ├── OR: Large "Join Live Class" button → opens URL in new tab
│       └── Info: Schedule, platform, duration
│
└── Right: Syllabus / Lesson List
        ├── Sections with lessons inside
        ├── Completion checkbox (mark as done)
        ├── Lock icon for lessons not yet accessible (if sequential)
        └── "LIVE" badge on today's live class
```

**D. My Profile**
- Edit name and profile photo
- Change password (non-SSO only)
- Transaction history (orders + payment status)
- Logout button

#### 5.4.3 Content Access Control

- Users can only access courses they have purchased with a `paid` status
- Lessons with `is_free_preview = true` are accessible without purchase
- If a user attempts to access an unpurchased course → redirect to the checkout page
- YouTube unlisted URLs are never exposed directly in the frontend HTML (served via a server-side component or an auth-protected API endpoint)

#### 5.4.4 Acceptance Criteria

- [ ] Only fully paid courses can be accessed
- [ ] YouTube iframe does not leak the URL to unauthorised users
- [ ] Live class URL (Zoom/GMeet) only appears ≤ 30 minutes before the scheduled start
- [ ] Progress is saved per lesson (localStorage + server sync)
- [ ] Page works well on mobile (responsive video player)
- [ ] "Join Live Class" button opens in a new tab
- [ ] Live class countdown timer is accurate (WIB/WITA/WIT timezone)

---

### 5.5 FEATURE 5 — Administrator Panel

**Priority:** P0 — Critical

#### 5.5.1 Access & Security

- **Admin URL is NOT exposed in any public navigation**
- URL: `/secret-admin-panel` or configured via the env variable `ADMIN_PATH`
- Login: Google SSO with email whitelist (env variable `ADMIN_EMAILS`)
- Double-layer: Google OAuth + database role check (`role = 'admin'`)
- Session timeout: 4 hours idle

#### 5.5.2 Admin Modules

**A. Overview Dashboard**
```
KPI Cards:
├── Total Revenue (today / this month / all time)
├── Active Learners
├── Total Published Courses
├── Pending Payment Verifications
└── Live Classes Today
```

**B. Course Management**
- View all courses from all instructors
- Filter by status, instructor, category, date
- Approve/Reject new courses (optional, can be disabled)
- Edit course metadata (title, price, status)
- Feature/unfeature a course on the landing page
- Delete course (soft delete)

**C. Instructor Management**
- View the full instructor list
- Add a new instructor (whitelist Google email)
- Deactivate an instructor (revoke access without deleting data)
- View courses per instructor
- Set revenue share percentage per instructor

**D. User / Learner Management**
- View all registered users
- Filter by registration date, purchased courses, status
- Manually add/remove course access
- Reset password (non-SSO only)
- Deactivate account

**E. Payment Management**

```
Payment Management
├── All Transactions
│       ├── Filter: status, method, date, course
│       ├── Export to CSV/Excel
│       └── Transaction detail view (webhook log, transfer proof)
│
├── Manual Transfer Verification
│       ├── Pending verification queue
│       ├── Inline proof preview (image/PDF)
│       ├── Actions: Confirm ✓ | Reject ✗
│       ├── Rejection reason input
│       └── Auto-send email + WhatsApp notification to user
│
└── Payment Method Configuration
        ├── Toggle active/inactive per method (Midtrans / Xendit / Manual Transfer)
        ├── Update manual transfer bank account (bank, account number, holder name)
        ├── Set Midtrans API key (sandbox/production)
        └── Set Xendit API key (sandbox/production)
```

**F. Notification Configuration**
- Preview and edit email templates (HTML editor)
- Preview WhatsApp message templates
- Send a test notification to a specific email/WhatsApp number
- Toggle active/inactive per notification type

**G. Logs & Audit**
- Log all admin actions (who, what, when)
- Log incoming webhooks (Midtrans/Xendit) with status and payload
- Log notification delivery (sent/failed)

#### 5.5.3 Acceptance Criteria

- [ ] Admin URL does not appear in the sitemap, robots.txt, or any public frontend code
- [ ] Only emails in the `ADMIN_EMAILS` whitelist can log in
- [ ] Confirming a manual payment immediately activates the user's course access
- [ ] Rejecting a manual payment sends a notification with the stated reason
- [ ] All admin actions are recorded in the audit log
- [ ] Transaction CSV export works with active filters
- [ ] Toggling a payment method takes effect in checkout immediately (no server restart required)

---

### 5.6 FEATURE 6 — Authentication & Google SSO

**Priority:** P0 — Critical

#### 5.6.1 Login Architecture

```
All roles use Google OAuth2 (SSO)

Flow:
User clicks "Login with Google"
    │
    ▼
Google OAuth2 Consent Screen
    │
    ▼
Callback: /auth/google/callback
    │
    ▼
Server: checks email in database
    ├── Email exists + role = 'admin'      → redirect to /admin
    ├── Email exists + role = 'instructor' → redirect to /instructor
    ├── Email exists + role = 'user'       → redirect to /dashboard
    ├── Email exists + checkout_intent     → redirect to checkout step 3
    └── New email                          → create new user account → redirect to /dashboard or checkout
```

#### 5.6.2 Login Entry Points

| Entry Point | Location | Destination |
|-------------|----------|-------------|
| User/Member login | Landing page navbar ("Log in Member") | `/dashboard` |
| Checkout login | Checkout modal step 2 | Continue checkout |
| Admin login | `/secret-admin-panel` (hidden) | `/admin` |
| Instructor login | `/instructor/login` (hidden from public) | `/instructor` |

#### 5.6.3 Security Requirements

- OAuth `state` parameter for CSRF protection
- JWT session token (httpOnly cookie, Secure, SameSite=Strict)
- Refresh token rotation
- Rate limiting on `/auth/*` endpoints (max 10 req/minute per IP)
- Admin URL: never in any `<a>` tag on public pages

---

## 6. Technical Architecture (Recommended)

### 6.1 Tech Stack

```
Monorepo Structure:
fluencyhub/
├── apps/
│   ├── web/          # Next.js 14+ (App Router)
│   └── api/          # (optional: separate backend, or unified via Next.js API routes)
├── packages/
│   ├── db/           # Prisma schema + migrations (PostgreSQL)
│   ├── emails/       # React Email templates
│   └── config/       # Shared config (env types, constants)
└── infrastructure/
    └── docker-compose.yml

Frontend:   Next.js 14 (App Router) + Tailwind CSS
Backend:    Next.js API Routes or Express.js
Database:   PostgreSQL (BigSerial PKs, no UUID, no ENUM)
ORM:        Prisma
Auth:       NextAuth.js v5 (Google Provider)
Payment:    Midtrans Node SDK + Xendit Node SDK
Email:      Resend (or Mailgun)
WhatsApp:   Fonnte API / Wablas / WhatsApp Business Cloud API
Storage:    Cloudflare R2 or AWS S3 (transfer proofs)
Cache:      Redis (session, rate limiting)
Hosting:    Vercel (frontend) + Railway/Render (backend + DB)
```

### 6.2 Routing Structure

```
/                          → Landing Page (public)
/checkout                  → Checkout Flow (public)
/auth/google               → OAuth start
/auth/google/callback      → OAuth callback
/dashboard                 → Member Dashboard (protected: user)
/dashboard/courses/[id]    → Course Detail + Player (protected: user + enrolled)
/instructor                → Instructor Dashboard (protected: instructor)
/[ADMIN_PATH]              → Admin Panel (protected: admin, URL from env var)
/api/*                     → API Endpoints
/api/webhooks/midtrans     → Midtrans webhook
/api/webhooks/xendit       → Xendit webhook
```

---

## 7. Non-Functional Requirements

### 7.1 Performance
- First Contentful Paint (FCP) < 1.5 seconds
- Largest Contentful Paint (LCP) < 3 seconds
- API response time < 200ms (P95)
- Database query time < 50ms (P95)

### 7.2 Security
- HTTPS enforced (HSTS)
- SQL injection prevention (Prisma ORM parameterized queries)
- XSS prevention (CSP headers, React auto-escaping)
- Webhook signature verification (Midtrans + Xendit)
- File uploads: type whitelist + virus scan
- Sensitive env vars: never committed to the repository

### 7.3 Scalability
- Stateless API (horizontal scaling ready)
- Database connection pooling (PgBouncer or Prisma Accelerate)
- CDN for static assets and images
- Background job queue (BullMQ + Redis) for email/WhatsApp notifications

### 7.4 Availability
- Uptime target: 99.5% (< 44 hours downtime/year)
- Database backup: daily automated backup, 30-day retention
- Zero-downtime deployment

---

## 8. Notification Templates

### 8.1 Email: Payment Confirmed

**Subject:** ✅ Payment Confirmed — Access to [Course Name] is Now Active!

```
Hi [Full Name],

Great news! Your payment for the following course has been confirmed:

📚 Course      : [Course Name]
💰 Amount Paid : Rp [Amount]
💳 Method      : [Payment Method]
📅 Date        : [Date & Time]
🔖 Order ID    : [Transaction ID]

Access your course now:
👉 https://fluencyhub.id/dashboard

Happy learning!
The FluencyHub Team
```

### 8.2 WhatsApp: Live Class Reminder

```
🎓 *FluencyHub — Live Class Reminder*

Hi *[Name]*! Don't forget, your live class is coming up soon:

📚 *[Course Name] — [Session Title]*
📅 Schedule : [Day, Date] at [Time] WIB
🖥️ Platform : [Zoom/Google Meet]

Click the link below to join:
🔗 [Live Class URL]

See you there! 👋
— The FluencyHub Team
```

---

## 9. MVP Acceptance Checklist

### Phase 1 — Foundation (Sprint 1–2)
- [ ] Monorepo setup (Next.js + PostgreSQL + Prisma)
- [ ] Google OAuth2 SSO working for all roles
- [ ] Role-based access control (user/instructor/admin)
- [ ] Database schema created with realistic seed data

### Phase 2 — Landing Page & Checkout (Sprint 3–4)
- [ ] Responsive landing page with all sections
- [ ] Multi-step checkout modal/page
- [ ] Midtrans Snap.js integration (sandbox)
- [ ] Xendit integration (sandbox)
- [ ] Manual transfer flow (proof upload)
- [ ] Inline registration at checkout
- [ ] Email notifications working (Resend/Mailgun)
- [ ] WhatsApp notifications working

### Phase 3 — User & Instructor Dashboards (Sprint 5–6)
- [ ] Member dashboard with course list
- [ ] Video player (protected YouTube embed)
- [ ] Live class URL display (time-locked)
- [ ] Per-lesson progress tracking
- [ ] Instructor dashboard: course + lesson CRUD
- [ ] YouTube & Zoom/GMeet URL validation

### Phase 4 — Admin Panel (Sprint 7–8)
- [ ] Admin panel at hidden URL
- [ ] Manage all courses + instructors
- [ ] Manual transfer verification (approve/reject)
- [ ] Payment method configuration
- [ ] Transaction CSV export
- [ ] Audit log

### Phase 5 — Hardening & Launch (Sprint 9–10)
- [ ] Security audit (basic penetration test)
- [ ] Performance optimisation (LCP < 3s)
- [ ] Production Midtrans + Xendit webhooks
- [ ] Monitoring & alerting (Sentry + Uptime)
- [ ] User acceptance testing (UAT)

---

## 10. Glossary

| Term | Definition |
|------|------------|
| SSO | Single Sign-On using Google OAuth2 |
| YouTube Unlisted | A YouTube video accessible only via its direct URL |
| Webhook | An HTTP callback from a payment gateway to the FluencyHub server |
| Live Class | A real-time learning session via Zoom or Google Meet |
| Manual Bank Transfer | A direct bank payment without an automatic payment gateway |
| Enrolled | Status of a user who has purchased and has active access to a course |
| Lesson | The smallest unit of content within a course |
| Section | A grouping of several lessons into one chapter |
| Platform Fee | The percentage of each sale retained by FluencyHub |

---

*This document was prepared based on FluencyHub v1.0 requirements analysis. Revisions may be made as sprints progress and stakeholder feedback is received.*
