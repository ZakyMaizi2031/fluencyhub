# 🗄️ Entity Relationship Document (ERD)
## FluencyHub — PostgreSQL Database Schema

**Version:** 2.0.0
**Database:** PostgreSQL 15+
**Updated:** 2026-09-11 — Payment & notification tables merged from production schema
**Conventions:**
- Primary Keys: `BIGSERIAL` (no UUID)
- Enumerations: `VARCHAR` with CHECK constraints (no ENUM type)
- All timestamps: `TIMESTAMPTZ` (timezone-aware, stored as UTC)
- Soft deletes via `deleted_at TIMESTAMPTZ NULL`
- All table and column names in `snake_case`
- All foreign keys explicitly defined and indexed


---

## 1. Entity Relationship Diagram (Visual)

```
┌──────────────┐     ┌────────────────────┐     ┌──────────────────┐
│    users     │     │    enrollments     │     │     courses      │
│──────────────│     │────────────────────│     │──────────────────│
│ id (PK)      │◄────│ user_id (FK)       │     │ id (PK)          │
│ name         │     │ course_id (FK) ────│────►│ instructor_id(FK)│
│ email        │     │ order_id (FK)      │     │ title / slug     │
│ whatsapp     │     │ status             │     │ price            │
│ role         │     │ progress_pct       │     │ status           │
│ google_id    │     └────────────────────┘     └──────────────────┘
│ is_active    │                                        │
└──────────────┘                               ┌────────┴────────┐
       │                                       │    sections     │
       │                                       │─────────────────│
       │                                       │ id (PK)         │
       │                                       │ course_id (FK)  │
       │                                       │ title           │
       │                                       └────────┬────────┘
       │                                                │
       │                                       ┌────────┴────────┐
       │                                       │    lessons      │
       │                                       │─────────────────│
       │                                       │ id (PK)         │
       │                                       │ section_id (FK) │
       │                                       │ content_type    │
       │                                       │ youtube_url     │
       │                                       │ live_class_url  │
       │                                       └─────────────────┘
       │
       │    ┌─────────────────────┐     ┌───────────────────────┐
       └───►│       orders        │     │    payment_methods    │
            │─────────────────────│     │───────────────────────│
            │ id (PK)             │     │ id (PK)               │
            │ user_id (FK)        │     │ code (UNIQUE)         │
            │ course_id (FK)      │     │ name                  │
            │ payment_method_id──►│────►│ type / provider       │
            │ order_number        │     │ admin_fee_flat/pct    │
            │ status              │     │ is_active             │
            │ total_amount        │     │ sort_order            │
            └──────────┬──────────┘     └───────────────────────┘
          ┌────────────┼─────────────┐
          │            │             │
┌─────────▼──────┐ ┌──▼──────────┐ ┌▼──────────────────┐
│ payment_proofs │ │webhook_logs │ │   payment_logs    │
│────────────────│ │─────────────│ │───────────────────│
│ id (PK)        │ │ id (PK)     │ │ id (PK)           │
│ order_id (FK)  │ │ order_id(FK)│ │ order_number      │
│ file_url       │ │ provider    │ │ endpoint          │
│ status         │ │ payload_json│ │ request_payload   │
│ verified_by(FK)│ │ status      │ │ response_payload  │
└────────────────┘ └─────────────┘ │ http_status       │
                                    └───────────────────┘

┌─────────────────────────┐     ┌───────────────────────────┐
│  payment_instructions   │     │  notification_templates   │
│─────────────────────────│     │───────────────────────────│
│ id (PK)                 │     │ id (PK)                   │
│ payment_method_id (FK)  │     │ event_trigger (UNIQUE)    │
│ title                   │     │ channel                   │
│ content (HTML)          │     │ message_content           │
│ sort_order              │     │ is_active                 │
└─────────────────────────┘     └──────────────┬────────────┘
                                               │
                                 ┌─────────────▼────────────┐
                                 │    notification_logs     │
                                 │──────────────────────────│
                                 │ id (PK)                  │
                                 │ template_id (FK)         │
                                 │ order_number             │
                                 │ recipient                │
                                 │ channel / status         │
                                 │ request/response payload │
                                 └──────────────────────────┘
```

---

## 2. Schema Definition (PostgreSQL DDL)

---

### 2.1 Table: `users`

Stores all platform users: learners, instructors, and admins.

```sql
CREATE TABLE users (
    id                  BIGSERIAL PRIMARY KEY,
    google_id           VARCHAR(255) UNIQUE,
    name                VARCHAR(255) NOT NULL,
    email               VARCHAR(255) NOT NULL UNIQUE,
    whatsapp_number     VARCHAR(20),
    password_hash       VARCHAR(255),                          -- NULL if SSO-only
    role                VARCHAR(50) NOT NULL DEFAULT 'user'
                            CHECK (role IN ('user', 'instructor', 'admin')),
    avatar_url          TEXT,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    revenue_share_pct   NUMERIC(5,2) DEFAULT 70.00,           -- Instructors only
    last_login_at       TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ
);

CREATE INDEX idx_users_email        ON users (email)           WHERE deleted_at IS NULL;
CREATE INDEX idx_users_google_id    ON users (google_id)       WHERE google_id IS NOT NULL;
CREATE INDEX idx_users_role         ON users (role)            WHERE deleted_at IS NULL;
CREATE INDEX idx_users_whatsapp     ON users (whatsapp_number) WHERE whatsapp_number IS NOT NULL;
```

---

### 2.2 Table: `categories`

Course categories for filtering and navigation.

```sql
CREATE TABLE categories (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    slug        VARCHAR(100) NOT NULL UNIQUE,
    icon        VARCHAR(50),
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_slug ON categories (slug);
```

---

### 2.3 Table: `courses`

Main course entity. Each course belongs to one instructor.

```sql
CREATE TABLE courses (
    id                  BIGSERIAL PRIMARY KEY,
    instructor_id       BIGINT NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    category_id         BIGINT REFERENCES categories (id) ON DELETE SET NULL,
    title               VARCHAR(255) NOT NULL,
    slug                VARCHAR(255) NOT NULL UNIQUE,
    short_description   VARCHAR(500),
    description         TEXT,
    thumbnail_url       TEXT,
    promo_video_url     TEXT,
    price               NUMERIC(12,2) NOT NULL DEFAULT 0,
    original_price      NUMERIC(12,2),                        -- Crossed-out price on landing page
    status              VARCHAR(50) NOT NULL DEFAULT 'draft'
                            CHECK (status IN ('draft', 'published', 'archived')),
    is_featured         BOOLEAN NOT NULL DEFAULT FALSE,
    is_free             BOOLEAN NOT NULL DEFAULT FALSE,
    total_duration_min  INTEGER NOT NULL DEFAULT 0,
    enrollment_count    INTEGER NOT NULL DEFAULT 0,            -- Denormalized counter
    max_students        INTEGER,                               -- NULL = unlimited
    language            VARCHAR(10) NOT NULL DEFAULT 'id',
    level               VARCHAR(50) NOT NULL DEFAULT 'beginner'
                            CHECK (level IN ('beginner', 'intermediate', 'advanced', 'all_levels')),
    platform_fee_pct    NUMERIC(5,2) NOT NULL DEFAULT 30.00,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at        TIMESTAMPTZ,
    deleted_at          TIMESTAMPTZ
);

CREATE INDEX idx_courses_instructor_id  ON courses (instructor_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_courses_category_id    ON courses (category_id)   WHERE deleted_at IS NULL;
CREATE INDEX idx_courses_status         ON courses (status)        WHERE deleted_at IS NULL;
CREATE INDEX idx_courses_slug           ON courses (slug)          WHERE deleted_at IS NULL;
CREATE INDEX idx_courses_featured       ON courses (is_featured)   WHERE is_featured = TRUE AND deleted_at IS NULL;
```

---

### 2.4 Table: `sections`

Groups lessons into chapters within a course.

```sql
CREATE TABLE sections (
    id          BIGSERIAL PRIMARY KEY,
    course_id   BIGINT NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sections_course_sort ON sections (course_id, sort_order);
```

---

### 2.5 Table: `lessons`

Individual lesson units: video, live class, document, or text.

```sql
CREATE TABLE lessons (
    id                      BIGSERIAL PRIMARY KEY,
    section_id              BIGINT NOT NULL REFERENCES sections (id) ON DELETE CASCADE,
    title                   VARCHAR(255) NOT NULL,
    content_type            VARCHAR(50) NOT NULL DEFAULT 'youtube_video'
                                CHECK (content_type IN (
                                    'youtube_video', 'live_class', 'document', 'text'
                                )),
    youtube_url             TEXT,
    youtube_video_id        VARCHAR(20),                       -- Extracted for iframe embed
    live_class_url          TEXT,                              -- Zoom or Google Meet URL
    live_class_datetime     TIMESTAMPTZ,
    live_class_platform     VARCHAR(20)
                                CHECK (live_class_platform IN ('zoom', 'gmeet', NULL)),
    live_class_duration_min INTEGER,
    document_url            TEXT,
    text_content            TEXT,
    description             TEXT,
    duration_minutes        INTEGER DEFAULT 0,
    is_free_preview         BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order              INTEGER NOT NULL DEFAULT 0,
    reminder_sent_24h       BOOLEAN NOT NULL DEFAULT FALSE,
    reminder_sent_1h        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at              TIMESTAMPTZ
);

CREATE INDEX idx_lessons_section_sort   ON lessons (section_id, sort_order)    WHERE deleted_at IS NULL;
CREATE INDEX idx_lessons_content_type   ON lessons (content_type)              WHERE deleted_at IS NULL;
CREATE INDEX idx_lessons_live_class_dt  ON lessons (live_class_datetime)
                                        WHERE content_type = 'live_class'
                                        AND deleted_at IS NULL;
CREATE INDEX idx_lessons_reminder_24h   ON lessons (live_class_datetime, reminder_sent_24h)
                                        WHERE content_type = 'live_class'
                                        AND reminder_sent_24h = FALSE;
CREATE INDEX idx_lessons_reminder_1h    ON lessons (live_class_datetime, reminder_sent_1h)
                                        WHERE content_type = 'live_class'
                                        AND reminder_sent_1h = FALSE;
```

---

### 2.6 Table: `payment_methods`

Admin-managed list of all active payment channels (Midtrans, Xendit, manual transfer).
Replaces the old `payment_gateway_configs` and `bank_accounts` tables.

```sql
CREATE TABLE payment_methods (
    id                  BIGSERIAL PRIMARY KEY,
    code                VARCHAR(50)  NOT NULL UNIQUE,          -- e.g. 'GOPAY', 'XENDIT_VA_BCA', 'MANUAL_BCA'
    name                VARCHAR(100) NOT NULL,                 -- Display name shown at checkout
    logo_url            VARCHAR(255),
    type                VARCHAR(50)  NOT NULL
                            CHECK (type IN (
                                'e_wallet', 'va', 'qr_code',
                                'credit_card', 'retail_outlet', 'manual_transfer'
                            )),
    provider            VARCHAR(50)  NOT NULL
                            CHECK (provider IN ('midtrans', 'xendit', 'manual')),
    admin_fee_flat      BIGINT       NOT NULL DEFAULT 0,       -- Flat fee in IDR (e.g. 4000)
    admin_fee_pct       NUMERIC(5,2) NOT NULL DEFAULT 0.00,   -- Percentage fee (e.g. 0.70)
    is_active           BOOLEAN      NOT NULL DEFAULT TRUE,
    is_redirect         BOOLEAN      NOT NULL DEFAULT FALSE,   -- TRUE if checkout redirects to gateway page
    sort_order          INTEGER      NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_methods_active   ON payment_methods (is_active, sort_order) WHERE is_active = TRUE;
CREATE INDEX idx_payment_methods_provider ON payment_methods (provider);
CREATE INDEX idx_payment_methods_type     ON payment_methods (type);
```

---

### 2.7 Table: `payment_instructions`

Step-by-step HTML payment instructions per payment method, shown to users on the checkout page.

```sql
CREATE TABLE payment_instructions (
    id                  BIGSERIAL PRIMARY KEY,
    payment_method_id   BIGINT       NOT NULL REFERENCES payment_methods (id) ON DELETE CASCADE,
    title               VARCHAR(255) NOT NULL,                 -- e.g. 'Pay via GoPay App'
    content             TEXT         NOT NULL,                 -- HTML ordered list of steps
    sort_order          INTEGER      NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_instructions_method ON payment_instructions (payment_method_id, sort_order);
```

---

### 2.8 Table: `orders`

Purchase transactions. One order = one course purchase by one user.

```sql
CREATE TABLE orders (
    id                      BIGSERIAL PRIMARY KEY,
    user_id                 BIGINT          NOT NULL REFERENCES users (id)           ON DELETE RESTRICT,
    course_id               BIGINT          NOT NULL REFERENCES courses (id)         ON DELETE RESTRICT,
    payment_method_id       BIGINT          REFERENCES payment_methods (id)          ON DELETE SET NULL,
    order_number            VARCHAR(50)     NOT NULL UNIQUE,   -- Format: FH-YYYYMMDD-XXXXXX
    gateway_transaction_id  VARCHAR(255)    UNIQUE,            -- ID returned by Midtrans/Xendit
    gateway_payment_url     TEXT,                              -- Snap URL or VA instructions page
    va_number               VARCHAR(50),                       -- Virtual account number (if applicable)
    status                  VARCHAR(50)     NOT NULL DEFAULT 'pending'
                                CHECK (status IN (
                                    'pending',
                                    'awaiting_payment',
                                    'pending_verification',    -- Manual transfer proof uploaded
                                    'paid',
                                    'failed',
                                    'expired',
                                    'refunded',
                                    'cancelled'
                                )),
    subtotal                NUMERIC(12,2)   NOT NULL,
    admin_fee               NUMERIC(12,2)   NOT NULL DEFAULT 0,
    discount_amount         NUMERIC(12,2)   NOT NULL DEFAULT 0,
    total_amount            NUMERIC(12,2)   NOT NULL,
    currency                VARCHAR(3)      NOT NULL DEFAULT 'IDR',
    coupon_code             VARCHAR(50),
    instructor_revenue      NUMERIC(12,2),                     -- Set when status → paid
    platform_revenue        NUMERIC(12,2),
    paid_at                 TIMESTAMPTZ,
    expires_at              TIMESTAMPTZ,                       -- Payment window expiry for VA/retail
    notes                   TEXT,                              -- Admin notes
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- High-traffic indexes
CREATE INDEX idx_orders_user_id         ON orders (user_id);
CREATE INDEX idx_orders_course_id       ON orders (course_id);
CREATE INDEX idx_orders_status          ON orders (status);
CREATE INDEX idx_orders_order_number    ON orders (order_number);
CREATE INDEX idx_orders_gateway_txn_id  ON orders (gateway_transaction_id)
                                        WHERE gateway_transaction_id IS NOT NULL;
CREATE INDEX idx_orders_paid_at         ON orders (paid_at DESC)           WHERE paid_at IS NOT NULL;
CREATE INDEX idx_orders_pending_manual  ON orders (created_at DESC)
                                        WHERE status = 'pending_verification';
CREATE INDEX idx_orders_status_paid     ON orders (status, paid_at DESC);
-- Prevent duplicate active purchase for same user+course
CREATE UNIQUE INDEX idx_orders_user_course_active
    ON orders (user_id, course_id)
    WHERE status IN ('pending', 'awaiting_payment', 'pending_verification', 'paid');
```

---

### 2.9 Table: `payment_proofs`

Manual transfer proof uploads from users (image/PDF).

```sql
CREATE TABLE payment_proofs (
    id                  BIGSERIAL PRIMARY KEY,
    order_id            BIGINT          NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    file_url            TEXT            NOT NULL,              -- S3/R2 object URL
    file_name           VARCHAR(255),
    file_size_bytes     INTEGER,
    mime_type           VARCHAR(100),                          -- image/jpeg, application/pdf
    status              VARCHAR(50)     NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'approved', 'rejected')),
    verified_by         BIGINT          REFERENCES users (id)  ON DELETE SET NULL,
    verified_at         TIMESTAMPTZ,
    rejection_note      TEXT,
    uploaded_at         TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_proofs_order_id    ON payment_proofs (order_id);
CREATE INDEX idx_payment_proofs_status      ON payment_proofs (status)      WHERE status = 'pending';
CREATE INDEX idx_payment_proofs_verified_by ON payment_proofs (verified_by) WHERE verified_by IS NOT NULL;
```

---

### 2.10 Table: `payment_logs`

Raw HTTP request/response log for every call made to or received from a payment gateway.
Used for debugging, audit, and dispute resolution.

```sql
CREATE TABLE payment_logs (
    id                  BIGSERIAL PRIMARY KEY,
    order_number        VARCHAR(50)     NOT NULL,              -- References orders.order_number (no FK for append-only performance)
    endpoint            VARCHAR(255),                          -- Full URL called or received
    log_type            VARCHAR(50)
                            CHECK (log_type IN (
                                'payment_request',             -- Outbound: charge API call
                                'payment_callback',            -- Inbound: gateway webhook
                                'status_check',                -- Outbound: status inquiry
                                'refund_request'               -- Outbound: refund API call
                            )),
    request_payload     TEXT,                                  -- JSON body sent
    response_payload    TEXT,                                  -- JSON body received
    http_status         INTEGER,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_logs_order_number ON payment_logs (order_number);
CREATE INDEX idx_payment_logs_created_at   ON payment_logs (created_at DESC);
CREATE INDEX idx_payment_logs_log_type     ON payment_logs (log_type);
```

---

### 2.11 Table: `enrollments`

Tracks user access to a course. Created automatically when an order reaches `paid` status.

```sql
CREATE TABLE enrollments (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES users (id)   ON DELETE RESTRICT,
    course_id       BIGINT          NOT NULL REFERENCES courses (id) ON DELETE RESTRICT,
    order_id        BIGINT          NOT NULL REFERENCES orders (id)  ON DELETE RESTRICT,
    status          VARCHAR(50)     NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'expired', 'revoked')),
    progress_pct    NUMERIC(5,2)    NOT NULL DEFAULT 0.00,
    completed_at    TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ,                               -- NULL = lifetime access
    enrolled_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_enrollments_user_course  ON enrollments (user_id, course_id);
CREATE INDEX idx_enrollments_course_id           ON enrollments (course_id);
CREATE INDEX idx_enrollments_user_active         ON enrollments (user_id, status) WHERE status = 'active';
```

---

### 2.12 Table: `lesson_progress`

Tracks per-lesson completion state for each enrolled user.

```sql
CREATE TABLE lesson_progress (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES users (id)       ON DELETE CASCADE,
    lesson_id       BIGINT          NOT NULL REFERENCES lessons (id)     ON DELETE CASCADE,
    enrollment_id   BIGINT          NOT NULL REFERENCES enrollments (id) ON DELETE CASCADE,
    is_completed    BOOLEAN         NOT NULL DEFAULT FALSE,
    last_position   INTEGER         DEFAULT 0,                 -- Video resume position in seconds
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_lesson_progress_user_lesson ON lesson_progress (user_id, lesson_id);
CREATE INDEX idx_lesson_progress_enrollment         ON lesson_progress (enrollment_id);
```

---

### 2.13 Table: `notification_templates`

Admin-managed message templates for all platform notification events.
One unique template per event_trigger + channel combination.

```sql
CREATE TABLE notification_templates (
    id              BIGSERIAL PRIMARY KEY,
    event_trigger   VARCHAR(100)    NOT NULL UNIQUE,
    channel         VARCHAR(20)     NOT NULL
                        CHECK (channel IN ('WHATSAPP', 'EMAIL')),
    message_content TEXT            NOT NULL,                  -- Supports {placeholders}
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- event_trigger values used by FluencyHub:
-- PAYMENT_SUCCESS         → order paid (auto gateway or admin confirmed)
-- PAYMENT_PENDING_VA      → VA/QRIS created, awaiting user payment
-- PAYMENT_EXPIRED         → payment window closed without payment
-- PAYMENT_REJECTED        → admin rejected manual transfer proof
-- MANUAL_TRANSFER_PENDING → user uploaded proof, awaiting admin review
-- LIVE_CLASS_REMINDER_24H → 24h before live class starts
-- LIVE_CLASS_REMINDER_1H  → 1h before live class starts
-- ENROLLMENT_ACTIVATED    → admin manually activates enrollment
-- WELCOME_NEW_USER        → first login / first enrollment

CREATE UNIQUE INDEX idx_notif_templates_trigger ON notification_templates (event_trigger);
```

---

### 2.14 Table: `notification_logs`

Immutable log of every notification dispatched (WhatsApp or email).

```sql
CREATE TABLE notification_logs (
    id                  BIGSERIAL PRIMARY KEY,
    template_id         BIGINT          REFERENCES notification_templates (id) ON DELETE SET NULL,
    order_number        VARCHAR(50),                           -- Soft reference to orders.order_number
    user_id             BIGINT          REFERENCES users (id)  ON DELETE SET NULL,
    lesson_id           BIGINT          REFERENCES lessons (id) ON DELETE SET NULL,
    recipient           VARCHAR(150)    NOT NULL,              -- Phone number or email address
    channel             VARCHAR(20)     NOT NULL
                            CHECK (channel IN ('WHATSAPP', 'EMAIL')),
    request_payload     TEXT,                                  -- JSON sent to provider
    response_payload    TEXT,                                  -- JSON received from provider
    status              VARCHAR(20)     NOT NULL DEFAULT 'QUEUED'
                            CHECK (status IN ('QUEUED', 'SUCCESS', 'FAILED', 'BOUNCED')),
    error_message       TEXT,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    sent_at             TIMESTAMPTZ
);

CREATE INDEX idx_notif_logs_template_id  ON notification_logs (template_id)  WHERE template_id IS NOT NULL;
CREATE INDEX idx_notif_logs_order_number ON notification_logs (order_number)  WHERE order_number IS NOT NULL;
CREATE INDEX idx_notif_logs_user_id      ON notification_logs (user_id)       WHERE user_id IS NOT NULL;
CREATE INDEX idx_notif_logs_status       ON notification_logs (status, created_at DESC);
CREATE INDEX idx_notif_logs_channel      ON notification_logs (channel, status);
```

---

### 2.15 Table: `webhook_logs`

Records every inbound webhook from Midtrans and Xendit for idempotency and audit.

```sql
CREATE TABLE webhook_logs (
    id                  BIGSERIAL PRIMARY KEY,
    order_number        VARCHAR(50),                           -- Derived from webhook payload
    provider            VARCHAR(50)     NOT NULL
                            CHECK (provider IN ('midtrans', 'xendit')),
    event_type          VARCHAR(100),                          -- e.g. 'payment.succeeded'
    gateway_txn_id      VARCHAR(255),
    payload_json        JSONB           NOT NULL,
    signature_valid     BOOLEAN         NOT NULL DEFAULT FALSE,
    processing_status   VARCHAR(50)     NOT NULL DEFAULT 'received'
                            CHECK (processing_status IN (
                                'received', 'processed', 'failed', 'duplicate'
                            )),
    error_message       TEXT,
    received_at         TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    processed_at        TIMESTAMPTZ
);

CREATE INDEX idx_webhook_logs_order_number  ON webhook_logs (order_number)   WHERE order_number IS NOT NULL;
CREATE INDEX idx_webhook_logs_gateway_txn   ON webhook_logs (gateway_txn_id) WHERE gateway_txn_id IS NOT NULL;
CREATE INDEX idx_webhook_logs_provider      ON webhook_logs (provider);
CREATE INDEX idx_webhook_logs_status        ON webhook_logs (processing_status) WHERE processing_status = 'failed';
CREATE INDEX idx_webhook_logs_received_at   ON webhook_logs (received_at DESC);
```

---

### 2.16 Table: `audit_logs`

Immutable log of all admin actions.

```sql
CREATE TABLE audit_logs (
    id              BIGSERIAL PRIMARY KEY,
    admin_id        BIGINT          NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    action          VARCHAR(100)    NOT NULL,
    entity_type     VARCHAR(100),
    entity_id       BIGINT,
    old_value_json  JSONB,
    new_value_json  JSONB,
    ip_address      VARCHAR(45),
    user_agent      TEXT,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_admin_id   ON audit_logs (admin_id);
CREATE INDEX idx_audit_logs_entity     ON audit_logs (entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at DESC);
```

---

### 2.17 Table: `coupons`

Discount codes for promotional campaigns.

```sql
CREATE TABLE coupons (
    id                      BIGSERIAL PRIMARY KEY,
    code                    VARCHAR(50)     NOT NULL UNIQUE,
    description             VARCHAR(255),
    discount_type           VARCHAR(20)     NOT NULL DEFAULT 'percentage'
                                CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value          NUMERIC(10,2)   NOT NULL,
    max_uses                INTEGER,                           -- NULL = unlimited
    used_count              INTEGER         NOT NULL DEFAULT 0,
    min_purchase_amount     NUMERIC(12,2)   DEFAULT 0,
    applicable_course_id    BIGINT          REFERENCES courses (id) ON DELETE CASCADE,
    is_active               BOOLEAN         NOT NULL DEFAULT TRUE,
    valid_from              TIMESTAMPTZ,
    valid_until             TIMESTAMPTZ,
    created_by              BIGINT          REFERENCES users (id) ON DELETE SET NULL,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_coupons_code      ON coupons (code)                  WHERE is_active = TRUE;
CREATE INDEX idx_coupons_valid     ON coupons (is_active, valid_until) WHERE is_active = TRUE;
CREATE INDEX idx_coupons_course_id ON coupons (applicable_course_id)  WHERE applicable_course_id IS NOT NULL;
```

---

## 3. Foreign Key Dependency Map

```
users
  ├── courses.instructor_id              → users.id
  ├── orders.user_id                     → users.id
  ├── enrollments.user_id                → users.id
  ├── payment_proofs.verified_by         → users.id
  ├── audit_logs.admin_id                → users.id
  ├── notification_logs.user_id          → users.id
  └── coupons.created_by                 → users.id

categories
  └── courses.category_id                → categories.id

courses
  ├── sections.course_id                 → courses.id
  ├── enrollments.course_id              → courses.id
  ├── orders.course_id                   → courses.id
  └── coupons.applicable_course_id       → courses.id

sections
  └── lessons.section_id                 → sections.id

lessons
  ├── lesson_progress.lesson_id          → lessons.id
  └── notification_logs.lesson_id        → lessons.id

payment_methods
  ├── payment_instructions.payment_method_id → payment_methods.id
  └── orders.payment_method_id           → payment_methods.id

orders
  ├── enrollments.order_id               → orders.id
  ├── payment_proofs.order_id            → orders.id
  └── (soft ref) payment_logs.order_number
      (soft ref) notification_logs.order_number
      (soft ref) webhook_logs.order_number

enrollments
  └── lesson_progress.enrollment_id      → enrollments.id

notification_templates
  └── notification_logs.template_id      → notification_templates.id
```

---

## 4. Seed Data

### 4.1 Categories

```sql
INSERT INTO categories (name, slug, icon, sort_order) VALUES
('Applied English for STEM',          'applied-english-stem',          'flask',            1),
('Business Communication',            'business-communication',        'handshake',        2),
('Presentation & Public Speaking',    'presentation-public-speaking',  'presentation',     3),
('Technical Writing',                 'technical-writing',             'pencil-line',      4),
('Interview Preparation',             'interview-preparation',         'user-check',       5),
('Academic English',                  'academic-english',              'graduation-cap',   6);
```

---

### 4.2 Users

```sql
-- Admin
INSERT INTO users (id, google_id, name, email, role, is_active, revenue_share_pct) VALUES
(1, 'google_admin_001', 'FluencyHub Admin', 'admin@fluencyhub.id', 'admin', TRUE, 0.00);

-- Instructors
INSERT INTO users (id, google_id, name, email, whatsapp_number, role, avatar_url, is_active, revenue_share_pct) VALUES
(2, 'google_instr_001', 'Dr. Anindya Kusuma, M.Sc.', 'anindya@fluencyhub.id', '6281234567801',
    'instructor', 'https://cdn.fluencyhub.id/avatars/anindya.jpg', TRUE, 70.00),
(3, 'google_instr_002', 'Rizky Pratama, M.Hum.',    'rizky@fluencyhub.id',   '6281234567802',
    'instructor', 'https://cdn.fluencyhub.id/avatars/rizky.jpg',   TRUE, 70.00),
(4, 'google_instr_003', 'Sarah Maharani, B.Ed.',    'sarah@fluencyhub.id',   '6281234567803',
    'instructor', 'https://cdn.fluencyhub.id/avatars/sarah.jpg',   TRUE, 65.00);

-- Learners
INSERT INTO users (id, google_id, name, email, whatsapp_number, role, is_active) VALUES
(5,  'google_user_001', 'Budi Santoso',      'budi.santoso@gmail.com',    '6281111110001', 'user', TRUE),
(6,  'google_user_002', 'Dewi Rahayu',       'dewi.rahayu@gmail.com',     '6281111110002', 'user', TRUE),
(7,  'google_user_003', 'Fajar Nugroho',     'fajar.nugroho@outlook.com', '6281111110003', 'user', TRUE),
(8,  'google_user_004', 'Indah Permatasari', 'indah.permata@yahoo.com',   '6281111110004', 'user', TRUE),
(9,  'google_user_005', 'Kevin Wijaya',      'kevin.wijaya@gmail.com',    '6281111110005', 'user', TRUE),
(10, 'google_user_006', 'Lestari Ningsih',   'lestari.ningsih@gmail.com', '6281111110006', 'user', TRUE),
(11, 'google_user_007', 'Muhammad Ihsan',    'm.ihsan@perusahaan.co.id',  '6281111110007', 'user', TRUE),
(12, 'google_user_008', 'Nadia Citra',       'nadia.citra@gmail.com',     '6281111110008', 'user', TRUE);

SELECT setval('users_id_seq', 20);
```

---

### 4.3 Payment Methods

Full list derived from the production schema, adapted to the FluencyHub learning platform context.

```sql
INSERT INTO payment_methods (
    id, code, name, logo_url, type, provider,
    admin_fee_flat, admin_fee_pct, is_active, is_redirect, sort_order
) VALUES
-- ── Midtrans ────────────────────────────────────────────────────────────────
(1,  'MIDTRANS_QRIS_GOPAY',    'QRIS Dynamic (GoPay)',
     'https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_QRIS.svg',
     'qr_code',      'midtrans', 0, 0.00, TRUE,  FALSE, 1),

(2,  'MIDTRANS_BNI_VA',        'BNI Virtual Account',
     'https://cdn.fluencyhub.id/logos/bni.png',
     'va',           'midtrans', 0, 0.00, TRUE,  FALSE, 2),

(3,  'MIDTRANS_GOPAY',         'GoPay',
     'https://cdn.fluencyhub.id/logos/gopay.png',
     'e_wallet',     'midtrans', 0, 0.00, TRUE,  FALSE, 3),

(4,  'MIDTRANS_MANDIRI_VA',    'Mandiri Virtual Account',
     'https://cdn.fluencyhub.id/logos/mandiri.png',
     'va',           'midtrans', 0, 0.00, TRUE,  FALSE, 4),

(5,  'MIDTRANS_PERMATA_VA',    'PermataBank Virtual Account',
     'https://cdn.fluencyhub.id/logos/permata.png',
     'va',           'midtrans', 0, 0.00, TRUE,  FALSE, 5),

(6,  'MIDTRANS_SHOPEEPAY',     'ShopeePay',
     'https://upload.wikimedia.org/wikipedia/commons/f/fe/Shopee.svg',
     'e_wallet',     'midtrans', 0, 0.00, FALSE, FALSE, 6),

(7,  'MIDTRANS_DANA',          'DANA',
     'https://upload.wikimedia.org/wikipedia/commons/7/72/Logo_dana_blue.svg',
     'e_wallet',     'midtrans', 0, 0.00, FALSE, FALSE, 7),

(8,  'MIDTRANS_OVO',           'OVO',
     'https://upload.wikimedia.org/wikipedia/commons/e/eb/Logo_ovo_purple.svg',
     'e_wallet',     'midtrans', 0, 0.00, FALSE, FALSE, 8),

(9,  'MIDTRANS_BCA_VA',        'BCA Virtual Account',
     'https://cdn.fluencyhub.id/logos/bca.png',
     'va',           'midtrans', 0, 0.00, FALSE, FALSE, 9),

(10, 'MIDTRANS_BRI_VA',        'BRI Virtual Account',
     'https://cdn.fluencyhub.id/logos/bri.png',
     'va',           'midtrans', 0, 0.00, FALSE, FALSE, 10),

(11, 'MIDTRANS_BSI_VA',        'BSI Virtual Account',
     'https://upload.wikimedia.org/wikipedia/commons/a/a0/Bank_Syariah_Indonesia.svg',
     'va',           'midtrans', 0, 0.00, FALSE, FALSE, 11),

(12, 'MIDTRANS_CIMB_VA',       'CIMB Niaga Virtual Account',
     'https://cdn.fluencyhub.id/logos/cimb.png',
     'va',           'midtrans', 0, 0.00, FALSE, FALSE, 12),

(13, 'MIDTRANS_DANAMON_VA',    'Danamon Virtual Account',
     'https://upload.wikimedia.org/wikipedia/commons/c/c5/Danamon_logo.svg',
     'va',           'midtrans', 0, 0.00, FALSE, FALSE, 13),

(14, 'MIDTRANS_GOOGLEPAY',     'Google Pay',
     'https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg',
     'e_wallet',     'midtrans', 0, 0.00, FALSE, FALSE, 14),

(15, 'MIDTRANS_CREDITCARD',    'Credit / Debit Card',
     'https://upload.wikimedia.org/wikipedia/commons/a/a4/Mastercard_2019_logo.svg',
     'credit_card',  'midtrans', 0, 0.00, FALSE, FALSE, 15),

-- ── Xendit ──────────────────────────────────────────────────────────────────
(16, 'XENDIT_QRIS',            'QRIS Dynamic (Xendit)',
     'https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_QRIS.svg',
     'qr_code',      'xendit',   0, 0.00, FALSE, FALSE, 16),

(17, 'XENDIT_VA_BCA',          'BCA Virtual Account',
     'https://cdn.fluencyhub.id/logos/bca.png',
     'va',           'xendit',   0, 0.00, FALSE, FALSE, 17),

(18, 'XENDIT_VA_MANDIRI',      'Mandiri Virtual Account',
     'https://cdn.fluencyhub.id/logos/mandiri.png',
     'va',           'xendit',   0, 0.00, FALSE, FALSE, 18),

(19, 'XENDIT_VA_BSI',          'BSI Virtual Account',
     'https://upload.wikimedia.org/wikipedia/commons/a/a0/Bank_Syariah_Indonesia.svg',
     'va',           'xendit',   0, 0.00, FALSE, FALSE, 19),

(20, 'XENDIT_VA_BRI',          'BRI Virtual Account',
     'https://cdn.fluencyhub.id/logos/bri.png',
     'va',           'xendit',   0, 0.00, FALSE, FALSE, 20),

(21, 'XENDIT_VA_BNI',          'BNI Virtual Account',
     'https://cdn.fluencyhub.id/logos/bni.png',
     'va',           'xendit',   0, 0.00, FALSE, FALSE, 21),

(22, 'XENDIT_VA_BJB',          'BJB Virtual Account',
     'https://cdn.fluencyhub.id/logos/bjb.png',
     'va',           'xendit',   0, 0.00, FALSE, FALSE, 22),

(23, 'XENDIT_VA_BNC',          'BNC Virtual Account',
     'https://cdn.fluencyhub.id/logos/bnc.webp',
     'va',           'xendit',   0, 0.00, FALSE, FALSE, 23),

(24, 'XENDIT_VA_CIMB',         'CIMB Niaga Virtual Account',
     'https://cdn.fluencyhub.id/logos/cimb.png',
     'va',           'xendit',   0, 0.00, FALSE, FALSE, 24),

(25, 'XENDIT_VA_MUAMALAT',     'Muamalat Virtual Account',
     'https://cdn.fluencyhub.id/logos/muamalat.png',
     'va',           'xendit',   0, 0.00, FALSE, FALSE, 25),

(26, 'XENDIT_VA_PERMATA',      'Permata Virtual Account',
     'https://cdn.fluencyhub.id/logos/permata.jpg',
     'va',           'xendit',   0, 0.00, FALSE, FALSE, 26),

(27, 'XENDIT_EWALLET_GOPAY',   'GoPay (Xendit)',
     'https://cdn.fluencyhub.id/logos/gopay.png',
     'e_wallet',     'xendit',   0, 0.00, FALSE, FALSE, 27),

(28, 'XENDIT_EWALLET_SHOPEEPAY','ShopeePay (Xendit)',
     'https://upload.wikimedia.org/wikipedia/commons/f/fe/Shopee.svg',
     'e_wallet',     'xendit',   0, 0.00, FALSE, FALSE, 28),

(29, 'XENDIT_EWALLET_DANA',    'DANA (Xendit)',
     'https://upload.wikimedia.org/wikipedia/commons/7/72/Logo_dana_blue.svg',
     'e_wallet',     'xendit',   0, 0.00, FALSE, FALSE, 29),

(30, 'XENDIT_EWALLET_LINKAJA', 'LinkAja',
     'https://cdn.fluencyhub.id/logos/linkaja.png',
     'e_wallet',     'xendit',   0, 0.00, FALSE, FALSE, 30),

(31, 'XENDIT_RETAIL_ALFAMART', 'Alfamart',
     'https://cdn.fluencyhub.id/logos/alfamart.png',
     'retail_outlet','xendit',   0, 0.00, FALSE, FALSE, 31),

(32, 'XENDIT_RETAIL_INDOMARET','Indomaret',
     'https://cdn.fluencyhub.id/logos/indomaret.png',
     'retail_outlet','xendit',   0, 0.00, FALSE, FALSE, 32),

-- ── Manual Transfer ──────────────────────────────────────────────────────────
(33, 'MANUAL_BCA',             'BCA (Manual Transfer)',
     'https://cdn.fluencyhub.id/logos/bca.png',
     'manual_transfer','manual', 0, 0.00, TRUE,  FALSE, 33),

(34, 'MANUAL_MANDIRI',         'Mandiri (Manual Transfer)',
     'https://cdn.fluencyhub.id/logos/mandiri.png',
     'manual_transfer','manual', 0, 0.00, TRUE,  FALSE, 34);

SELECT setval('payment_methods_id_seq', 40);
```

---

### 4.4 Payment Instructions

Step-by-step checkout instructions for each active payment method (HTML content, translated to English).

```sql
INSERT INTO payment_instructions (payment_method_id, title, content, sort_order) VALUES
-- MIDTRANS_QRIS_GOPAY (id=1)
(1,  'Pay via QRIS (Any e-Wallet or Mobile Banking)',
 '<ol><li>Open your preferred payment app (GoPay, OVO, DANA, ShopeePay, LinkAja, BCA Mobile, etc.).</li><li>Select <strong>Scan / Pay QRIS</strong>.</li><li>Scan the QR Code displayed on screen.</li><li>Confirm the merchant name and amount.</li><li>Enter your transaction PIN to complete the payment.</li></ol>', 1),

-- MIDTRANS_BNI_VA (id=2)
(2,  'Pay via BNI Mobile Banking',
 '<ol><li>Open the BNI Mobile Banking app and log in.</li><li>Select <strong>Transfer</strong> &gt; <strong>Virtual Account Billing</strong>.</li><li>Enter the BNI Virtual Account number shown on screen.</li><li>Confirm the payment details and enter your transaction PIN.</li></ol>', 1),
(2,  'Pay via BNI ATM',
 '<ol><li>Insert your BNI ATM card and enter your PIN.</li><li>Select <strong>Other Menu</strong> &gt; <strong>Transfer</strong> &gt; <strong>Virtual Account Billing</strong>.</li><li>Enter the BNI Virtual Account number and press <strong>Correct</strong>.</li><li>Confirm the payment details and complete the transaction.</li></ol>', 2),

-- MIDTRANS_GOPAY (id=3)
(3,  'Pay via GoPay / Gojek App',
 '<ol><li>Click <strong>Pay Now</strong> or wait for the Snap modal to open automatically.</li><li>The Gojek / GoPay app will launch on your phone.</li><li>Review your course purchase details.</li><li>Tap <strong>Pay</strong> and enter your GoPay PIN.</li></ol>', 1),

-- MIDTRANS_MANDIRI_VA (id=4)
(4,  'Pay via Livin'' by Mandiri',
 '<ol><li>Open the Livin'' by Mandiri app and select <strong>Pay / Multi Payment</strong>.</li><li>Select the service provider or enter the company code.</li><li>Enter the Mandiri Virtual Account number shown on screen.</li><li>Confirm the invoice amount and complete with your mPIN.</li></ol>', 1),
(4,  'Pay via Mandiri ATM',
 '<ol><li>Insert your Mandiri ATM card and enter your PIN.</li><li>Select <strong>Pay/Purchase</strong> &gt; <strong>Multi Payment</strong>.</li><li>Enter the company biller code and then the payment code.</li><li>Confirm the invoice details and press <strong>Yes</strong> to proceed.</li></ol>', 2),

-- MIDTRANS_PERMATA_VA (id=5)
(5,  'Pay via PermataMobile X',
 '<ol><li>Open the PermataMobile X app and log in.</li><li>Select <strong>Transfer</strong> &gt; <strong>Virtual Account</strong>.</li><li>Enter the Permata Virtual Account number shown on screen.</li><li>Confirm the payment details and enter your PIN / Response Code.</li></ol>', 1),
(5,  'Pay via Permata ATM / ATM Bersama',
 '<ol><li>Insert your ATM card and enter your PIN.</li><li>Select <strong>Other Transactions</strong> &gt; <strong>Payment</strong> &gt; <strong>Virtual Account</strong>.</li><li>Enter the Permata Virtual Account number and press <strong>Correct</strong>.</li><li>Confirm the payment details and complete the transaction.</li></ol>', 2),

-- XENDIT_QRIS (id=16)
(16, 'Pay via QRIS (Xendit)',
 '<ol><li>Open any e-Wallet or mobile banking app that supports QRIS.</li><li>Select <strong>Scan / Pay QRIS</strong>.</li><li>Scan the QR Code shown on the payment page.</li><li>Verify the merchant and amount, then enter your PIN to confirm.</li></ol>', 1),

-- XENDIT_VA_BCA (id=17)
(17, 'Pay via m-BCA (BCA Mobile)',
 '<ol><li>Open the BCA Mobile app and log in.</li><li>Select <strong>m-Transfer</strong> &gt; <strong>BCA Virtual Account</strong>.</li><li>Enter the BCA Virtual Account number shown on screen and tap <strong>Send</strong>.</li><li>Confirm the invoice details and enter your m-BCA PIN.</li></ol>', 1),
(17, 'Pay via BCA ATM',
 '<ol><li>Insert your BCA ATM card and enter your PIN.</li><li>Select <strong>Other Transactions</strong> &gt; <strong>Transfer</strong> &gt; <strong>To BCA Virtual Account</strong>.</li><li>Enter the BCA Virtual Account number and press <strong>Correct</strong>.</li><li>Confirm the amount and complete the transaction.</li></ol>', 2),

-- XENDIT_VA_MANDIRI (id=18)
(18, 'Pay via Livin'' by Mandiri',
 '<ol><li>Open the Livin'' by Mandiri app and select <strong>Pay / Multi Payment</strong>.</li><li>Select the service provider or enter the company code.</li><li>Enter the Mandiri Virtual Account number shown on screen.</li><li>Confirm the invoice amount and complete with your mPIN.</li></ol>', 1),
(18, 'Pay via Mandiri ATM',
 '<ol><li>Insert your Mandiri ATM card and enter your PIN.</li><li>Select <strong>Pay/Purchase</strong> &gt; <strong>Multi Payment</strong>.</li><li>Enter the company biller code and the payment code.</li><li>Confirm the invoice details and press <strong>Yes</strong> to proceed.</li></ol>', 2),

-- XENDIT_VA_BRI (id=20)
(20, 'Pay via BRImo',
 '<ol><li>Open the BRImo app and log in.</li><li>Select <strong>BRIVA</strong> &gt; <strong>Add New Transaction</strong>.</li><li>Enter the BRI/BRIVA Virtual Account number shown on screen.</li><li>Confirm the payment details and enter your BRImo PIN.</li></ol>', 1),

-- XENDIT_VA_BNI (id=21)
(21, 'Pay via BNI Mobile Banking',
 '<ol><li>Open the BNI Mobile Banking app and log in.</li><li>Select <strong>Transfer</strong> &gt; <strong>Virtual Account Billing</strong>.</li><li>Enter the BNI Virtual Account number shown on screen.</li><li>Confirm the payment details and enter your transaction PIN.</li></ol>', 1),
(21, 'Pay via BNI ATM',
 '<ol><li>Insert your BNI ATM card and enter your PIN.</li><li>Select <strong>Other Menu</strong> &gt; <strong>Transfer</strong> &gt; <strong>Virtual Account Billing</strong>.</li><li>Enter the BNI Virtual Account number and press <strong>Correct</strong>.</li><li>Confirm the payment details and complete the transaction.</li></ol>', 2),

-- XENDIT_VA_BSI (id=19)
(19, 'Pay via BSI Mobile',
 '<ol><li>Open the BSI Mobile app and log in.</li><li>Select <strong>Pay / Transfer</strong> &gt; <strong>Virtual Account / BSI Vault</strong>.</li><li>Enter the BSI Virtual Account number shown on screen.</li><li>Confirm the payment details and enter your BSI Mobile PIN.</li></ol>', 1),

-- XENDIT_RETAIL_ALFAMART (id=31)
(31, 'Pay via Alfamart',
 '<ol><li>Visit the nearest Alfamart, Alfamidi, Dan+Dan, or Lawson outlet.</li><li>Tell the cashier you want to pay via Xendit / show your payment barcode.</li><li>Provide the payment code and confirm the amount is correct.</li><li>You may pay with cash (up to IDR 2.5 million), or combine cash with debit card / e-wallet.</li><li>Keep your receipt as proof of payment.</li></ol>', 1),

-- XENDIT_RETAIL_INDOMARET (id=32)
(32, 'Pay via Indomaret',
 '<ol><li>Visit the nearest Indomaret outlet.</li><li>Tell the cashier you want to make an online payment and show your payment code or barcode.</li><li>Confirm the payment amount shown and proceed with payment.</li><li>Keep your receipt as proof of payment.</li></ol>', 1),

-- MANUAL_BCA (id=33)
(33, 'Manual Transfer — BCA',
 '<ol><li>Transfer the exact amount (match all digits, including the last 3) to:<br><strong>Bank BCA | Account: 1234567890 | Name: PT FluencyHub Edukasi Indonesia</strong></li><li>Save your transfer receipt (screenshot or photo).</li><li>Return to the payment page and upload your proof of payment.</li><li>Your enrollment will be activated within 1×24 business hours after verification.</li></ol>', 1),

-- MANUAL_MANDIRI (id=34)
(34, 'Manual Transfer — Mandiri',
 '<ol><li>Transfer the exact amount to:<br><strong>Bank Mandiri | Account: 9876543210 | Name: PT FluencyHub Edukasi Indonesia</strong></li><li>Save your transfer receipt (screenshot or photo).</li><li>Return to the payment page and upload your proof of payment.</li><li>Your enrollment will be activated within 1×24 business hours after verification.</li></ol>', 1);
```

---

### 4.5 Notification Templates

```sql
INSERT INTO notification_templates (id, event_trigger, channel, message_content, is_active) VALUES
(1, 'PAYMENT_SUCCESS', 'WHATSAPP',
 'Hi {name}! 🎉 Your payment of Rp {amount} via {method} has been confirmed. You now have full access to *{course_title}*. Start learning here: {dashboard_url}',
 TRUE),

(2, 'PAYMENT_PENDING_VA', 'WHATSAPP',
 'Hi {name}, your order for *{course_title}* is waiting for payment. Please transfer Rp {amount} to {method}: *{va_number}* before it expires on {expires_at}. Questions? Reply to this message.',
 TRUE),

(3, 'PAYMENT_EXPIRED', 'WHATSAPP',
 'Hi {name}, your payment window for *{course_title}* has expired. No charge was made. You can place a new order anytime at {checkout_url}.',
 TRUE),

(4, 'MANUAL_TRANSFER_PENDING', 'WHATSAPP',
 'Hi {name}, we received your transfer proof for *{course_title}* (Order: {order_number}). Our team will verify it within 1×24 business hours. We''ll notify you as soon as it''s confirmed. 🙏',
 TRUE),

(5, 'PAYMENT_REJECTED', 'WHATSAPP',
 'Hi {name}, unfortunately we could not verify your transfer proof for *{course_title}*. Reason: {rejection_note}. Please re-upload a clear proof or contact support.',
 TRUE),

(6, 'LIVE_CLASS_REMINDER_24H', 'WHATSAPP',
 '🎓 *FluencyHub — Live Class Reminder*\n\nHi *{name}*! Your live class is tomorrow:\n\n📚 *{course_title} — {lesson_title}*\n📅 {class_date} at {class_time} WIB\n🖥️ Platform: {platform}\n\nJoin link:\n🔗 {live_class_url}\n\nSee you there! 👋',
 TRUE),

(7, 'LIVE_CLASS_REMINDER_1H', 'WHATSAPP',
 '⏰ *FluencyHub — Starting in 1 Hour!*\n\nHi *{name}*, your live class starts in 1 hour:\n\n📚 *{lesson_title}*\n🔗 {live_class_url}\n\nMake sure your connection is stable. See you soon!',
 TRUE),

(8, 'ENROLLMENT_ACTIVATED', 'WHATSAPP',
 'Hi {name}! ✅ Your access to *{course_title}* has been activated by our team. Start learning now: {dashboard_url}',
 TRUE),

(9, 'WELCOME_NEW_USER', 'WHATSAPP',
 'Welcome to FluencyHub, *{name}*! 🚀 We''re excited to have you. Browse available courses here: {courses_url}',
 TRUE),

(10, 'PAYMENT_SUCCESS', 'EMAIL',
 'Subject: ✅ Payment Confirmed — Access to {course_title} is Active!\n\nHi {name},\n\nYour payment has been successfully confirmed:\n\n📚 Course: {course_title}\n💰 Amount: Rp {amount}\n💳 Method: {method}\n📅 Date: {paid_at}\n🔖 Order: {order_number}\n\nAccess your course now:\n👉 {dashboard_url}\n\nHappy learning!\nFluencyHub Team',
 TRUE),

(11, 'MANUAL_TRANSFER_PENDING', 'EMAIL',
 'Subject: 📋 We Received Your Transfer Proof — Pending Verification\n\nHi {name},\n\nThank you for uploading your proof of payment for *{course_title}* (Order: {order_number}).\n\nOur team will verify it within 1×24 business hours on weekdays. You''ll receive a WhatsApp and email notification once confirmed.\n\nFluencyHub Team',
 TRUE);

SELECT setval('notification_templates_id_seq', 20);
```

---

### 4.6 Courses

```sql
INSERT INTO courses (
    id, instructor_id, category_id, title, slug, short_description,
    price, original_price, status, is_featured, level,
    enrollment_count, platform_fee_pct, published_at
) VALUES
(1, 2, 1,
 'Applied English for STEM Professionals',
 'applied-english-stem-professionals',
 'Master technical English for data presentations, research, and international collaboration.',
 1499000, 2499000, 'published', TRUE, 'intermediate', 87, 30.00, NOW() - INTERVAL '45 days'),

(2, 2, 2,
 'Business English Masterclass: Negotiation & Meetings',
 'business-english-masterclass',
 'Communicate confidently in international meetings, contract negotiations, and boardroom presentations.',
 1799000, 2799000, 'published', TRUE, 'intermediate', 54, 30.00, NOW() - INTERVAL '30 days'),

(3, 3, 3,
 'Public Speaking in English: Zero to Confident',
 'public-speaking-english-zero-confident',
 'From speaking anxiety to delivering compelling English presentations in front of any audience.',
 999000, 1699000, 'published', FALSE, 'beginner', 112, 30.00, NOW() - INTERVAL '60 days'),

(4, 4, 5,
 'English Interview Prep: Tech & Multinational Companies',
 'english-interview-prep-tech',
 'Ace HRD and user interviews at multinational and tech companies with confidence.',
 1299000, 1999000, 'published', TRUE, 'all_levels', 68, 30.00, NOW() - INTERVAL '20 days'),

(5, 4, 4,
 'Technical Writing in English: Reports & Documentation',
 'technical-writing-english',
 'Write clear, professional technical reports, SOPs, and documentation in English.',
 899000, 1499000, 'draft', FALSE, 'intermediate', 0, 30.00, NULL);

SELECT setval('courses_id_seq', 10);
```

---

### 4.7 Sections & Lessons

```sql
INSERT INTO sections (id, course_id, title, sort_order) VALUES
(1, 1, 'Module 1: Foundation — Scientific Communication',     1),
(2, 1, 'Module 2: Technical Presentation Skills',             2),
(3, 1, 'Module 3: Research Paper & Report Writing',           3),
(4, 1, 'Module 4: Live Collaboration Sessions',               4),
(5, 2, 'Module 1: Business Meeting Essentials',               1),
(6, 2, 'Module 2: Negotiation Language & Tactics',            2),
(7, 2, 'Module 3: Live Roleplay Sessions',                    3),
(8, 3, 'Part 1: Overcoming Speaking Anxiety',                 1),
(9, 3, 'Part 2: Structure & Delivery',                        2),
(10,4, 'HRD Interview Preparation',                           1),
(11,4, 'Technical & User Interview',                          2);

SELECT setval('sections_id_seq', 20);

INSERT INTO lessons (
    id, section_id, title, content_type, youtube_url, youtube_video_id,
    live_class_url, live_class_datetime, live_class_platform, live_class_duration_min,
    description, duration_minutes, is_free_preview, sort_order
) VALUES
(1,  1, 'Welcome & Program Overview',
     'youtube_video', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ',
     NULL, NULL, NULL, NULL,
     'Introduction to the program, learning outcomes, and how to get the most from this course.', 8, TRUE, 1),

(2,  1, 'The 3 Pillars of Scientific Communication',
     'youtube_video', 'https://www.youtube.com/watch?v=xvFZjo5PgG0', 'xvFZjo5PgG0',
     NULL, NULL, NULL, NULL,
     'Clarity, Precision, and Brevity — the three pillars of effective scientific communication.', 22, FALSE, 2),

(3,  1, 'Common Mistakes Indonesian STEM Professionals Make',
     'youtube_video', 'https://www.youtube.com/watch?v=M7lc1UVf-VE', 'M7lc1UVf-VE',
     NULL, NULL, NULL, NULL,
     'Analysis of the most common errors and how to avoid them.', 18, FALSE, 3),

(4,  2, 'Data Presentation Vocabulary & Phrases',
     'youtube_video', 'https://www.youtube.com/watch?v=Ks-_Mh1QhMc', 'Ks-_Mh1QhMc',
     NULL, NULL, NULL, NULL,
     'Key phrases for describing charts, trends, and statistical data.', 25, FALSE, 1),

(5,  2, 'Structuring a 10-Minute Technical Presentation',
     'youtube_video', 'https://www.youtube.com/watch?v=YbJOTdZBX1g', 'YbJOTdZBX1g',
     NULL, NULL, NULL, NULL,
     'A proven, easy-to-follow template for technical presentations.', 30, FALSE, 2),

(6,  4, 'Live Class #1 — Presentation Simulation & Feedback',
     'live_class', NULL, NULL,
     'https://zoom.us/j/96543210987?pwd=fluencyhub2026',
     NOW() + INTERVAL '7 days', 'zoom', 90,
     'Each participant presents for 5 minutes and receives direct instructor feedback.', 90, FALSE, 1),

(7,  4, 'Live Class #2 — Q&A and Data Discussion Roleplay',
     'live_class', NULL, NULL,
     'https://zoom.us/j/85432198765?pwd=fluencyhub2026b',
     NOW() + INTERVAL '14 days', 'zoom', 90,
     'Roleplay: simulated research data discussion in an international meeting context.', 90, FALSE, 2),

(8,  5, 'Meeting Room English: Opening, Agenda & Minutes',
     'youtube_video', 'https://www.youtube.com/watch?v=oHg5SJYRHA0', 'oHg5SJYRHA0',
     NULL, NULL, NULL, NULL,
     'Phrases for opening meetings, presenting agendas, and writing effective minutes.', 28, TRUE, 1),

(9,  6, 'Negotiation Tactics: Win-Win Language',
     'youtube_video', 'https://www.youtube.com/watch?v=dQw4w9WgXcZ', 'dQw4w9WgXcZ',
     NULL, NULL, NULL, NULL,
     'Language strategies for negotiation: making offers, counter-offers, and closing deals.', 35, FALSE, 1),

(10, 7, 'Live Roleplay: Client Negotiation Simulation',
     'live_class', NULL, NULL,
     'https://meet.google.com/abc-defg-hij',
     NOW() + INTERVAL '10 days', 'gmeet', 120,
     'Direct roleplay: contract negotiation with a fictional client. Session is recorded for review.', 120, FALSE, 1);

SELECT setval('lessons_id_seq', 30);
```

---

### 4.8 Orders

```sql
INSERT INTO orders (
    id, user_id, course_id, payment_method_id, order_number,
    gateway_transaction_id, va_number, status,
    subtotal, admin_fee, discount_amount, total_amount,
    instructor_revenue, platform_revenue, paid_at, created_at
) VALUES
(1, 5, 1, 3,  'FH-20260801-000001', 'midtrans-gopay-txn-001',  NULL,             'paid',
    1499000, 0, 0, 1499000, 1049300, 449700, NOW() - INTERVAL '40 days', NOW() - INTERVAL '40 days'),

(2, 6, 1, 1,  'FH-20260805-000002', 'midtrans-qris-txn-001',   NULL,             'paid',
    1499000, 0, 0, 1499000, 1049300, 449700, NOW() - INTERVAL '38 days', NOW() - INTERVAL '38 days'),

(3, 7, 2, 4,  'FH-20260812-000003', 'midtrans-mandiri-txn-001','8277098765432100','paid',
    1799000, 0, 0, 1799000, 1259300, 539700, NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days'),

(4, 8, 3, 17, 'FH-20260818-000004', 'xendit-bca-txn-001',      '8077081234567890','paid',
    999000, 0, 0, 999000, 699300, 299700, NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),

(5, 9, 1, 20, 'FH-20260821-000005', 'xendit-bri-txn-001',      '8891012345678901','paid',
    1499000, 0, 150000, 1349000, 944300, 404700, NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),

(6, 10, 4, 33,'FH-20260825-000006', NULL,                       NULL,             'paid',
    1299000, 0, 0, 1299000, 844350, 389700, NOW() - INTERVAL '10 days', NOW() - INTERVAL '12 days'),

(7, 11, 2, 34,'FH-20260909-000007', NULL,                       NULL,             'pending_verification',
    1799000, 0, 0, 1799000, NULL, NULL, NULL, NOW() - INTERVAL '2 hours'),

(8, 12, 3, 21,'FH-20260911-000008', 'xendit-bni-txn-002',      '8887051234567891','awaiting_payment',
    999000, 0, 0, 999000, NULL, NULL, NULL, NOW() - INTERVAL '30 minutes'),

(9, 5,  4, 2, 'FH-20260906-000009', 'midtrans-bni-txn-expired','8887059999999999','expired',
    1299000, 0, 0, 1299000, NULL, NULL, NULL, NOW() - INTERVAL '5 days');

SELECT setval('orders_id_seq', 20);
```

---

### 4.9 Payment Proofs

```sql
-- Order 6: approved manual transfer (BCA)
INSERT INTO payment_proofs (order_id, file_url, file_name, file_size_bytes, mime_type, status, verified_by, verified_at) VALUES
(6, 'https://cdn.fluencyhub.id/proofs/FH-20260825-000006-proof.jpg',
    'transfer_bca_aug2026.jpg', 245760, 'image/jpeg', 'approved', 1, NOW() - INTERVAL '9 days');

-- Order 7: pending manual transfer (Mandiri)
INSERT INTO payment_proofs (order_id, file_url, file_name, file_size_bytes, mime_type, status) VALUES
(7, 'https://cdn.fluencyhub.id/proofs/FH-20260909-000007-proof.pdf',
    'transfer_mandiri_sep2026.pdf', 189432, 'application/pdf', 'pending');
```

---

### 4.10 Payment Logs

```sql
INSERT INTO payment_logs (order_number, endpoint, log_type, request_payload, response_payload, http_status) VALUES
-- Midtrans GoPay charge (order 1)
('FH-20260801-000001',
 'https://api.midtrans.com/v2/charge', 'payment_request',
 '{"payment_type":"gopay","transaction_details":{"order_id":"FH-20260801-000001","gross_amount":1499000}}',
 '{"status_code":"201","transaction_status":"pending","actions":[{"name":"generate-qr-code","url":"https://api.sandbox.midtrans.com/v2/gopay/abc/qr-code"}]}',
 201),

-- Midtrans GoPay settlement callback (order 1)
('FH-20260801-000001',
 '/api/webhooks/midtrans', 'payment_callback',
 '{"transaction_status":"settlement","order_id":"FH-20260801-000001","gross_amount":"1499000"}',
 '{"status":"success","message":"Enrollment activated"}',
 200),

-- Xendit VA BCA create (order 4)
('FH-20260818-000004',
 'https://api.xendit.co/v2/virtual_accounts', 'payment_request',
 '{"external_id":"FH-20260818-000004","bank_code":"BCA","name":"Indah Permatasari","expected_amount":999000,"is_closed":true}',
 '{"id":"va-bca-001","external_id":"FH-20260818-000004","bank_code":"BCA","account_number":"8077081234567890","expected_amount":999000,"status":"PENDING"}',
 200),

-- Xendit VA BCA paid callback (order 4)
('FH-20260818-000004',
 '/api/webhooks/xendit', 'payment_callback',
 '{"event":"payment.succeeded","data":{"id":"pymt-001","amount":999000,"status":"SUCCEEDED","reference_id":"FH-20260818-000004"}}',
 '{"status":"success","message":"Enrollment activated"}',
 200),

-- Xendit BNI VA create (order 8 — still awaiting)
('FH-20260911-000008',
 'https://api.xendit.co/v2/virtual_accounts', 'payment_request',
 '{"external_id":"FH-20260911-000008","bank_code":"BNI","name":"Nadia Citra","expected_amount":999000,"is_closed":true}',
 '{"id":"va-bni-002","external_id":"FH-20260911-000008","bank_code":"BNI","account_number":"8887051234567891","expected_amount":999000,"status":"PENDING"}',
 200);
```

---

### 4.11 Notification Logs

```sql
INSERT INTO notification_logs (template_id, order_number, user_id, recipient, channel, request_payload, response_payload, status, sent_at) VALUES
-- Payment success WA (order 1, user 5 = Budi)
(1, 'FH-20260801-000001', 5, '6281111110001', 'WHATSAPP',
 '{"target":"6281111110001","message":"Hi Budi Santoso! Your payment of Rp 1.499.000 via GoPay has been confirmed. You now have full access to Applied English for STEM Professionals. Start learning here: https://fluencyhub.id/dashboard","countryCode":"62"}',
 '{"status":true,"detail":"message sent successfully","process":"1 messages sent"}',
 'SUCCESS', NOW() - INTERVAL '40 days'),

-- VA pending WA (order 8, user 12 = Nadia)
(2, 'FH-20260911-000008', 12, '6281111110008', 'WHATSAPP',
 '{"target":"6281111110008","message":"Hi Nadia Citra, your order for Public Speaking in English: Zero to Confident is waiting for payment. Please transfer Rp 999.000 to BNI Virtual Account: 8887051234567891 before it expires.","countryCode":"62"}',
 '{"status":true,"detail":"message sent successfully"}',
 'SUCCESS', NOW() - INTERVAL '29 minutes'),

-- Manual transfer pending WA (order 7, user 11 = Ihsan)
(4, 'FH-20260909-000007', 11, '6281111110007', 'WHATSAPP',
 '{"target":"6281111110007","message":"Hi Muhammad Ihsan, we received your transfer proof for Business English Masterclass. Our team will verify it within 1x24 business hours.","countryCode":"62"}',
 '{"status":true,"detail":"message sent successfully"}',
 'SUCCESS', NOW() - INTERVAL '1 hour 55 minutes'),

-- Payment success email (order 1, user 5 = Budi)
(10, 'FH-20260801-000001', 5, 'budi.santoso@gmail.com', 'EMAIL',
 '{"to":"budi.santoso@gmail.com","subject":"Payment Confirmed — Applied English for STEM Professionals","html":"..."}',
 '{"id":"email-resend-001","status":"sent"}',
 'SUCCESS', NOW() - INTERVAL '40 days'),

-- Failed WA notification (order 3, user 7 = Fajar — device offline)
(1, 'FH-20260812-000003', 7, '6281111110003', 'WHATSAPP',
 '{"target":"6281111110003","message":"Hi Fajar Nugroho! Your payment of Rp 1.799.000 via Mandiri Virtual Account has been confirmed...","countryCode":"62"}',
 '{"reason":"request invalid on disconnected device","requestid":469813137,"status":false}',
 'FAILED', NULL),

-- Live class reminder 24h (lesson 6, user 5 = Budi)
(6, NULL, 5, '6281111110001', 'WHATSAPP',
 '{"target":"6281111110001","message":"FluencyHub Live Class Reminder — Hi Budi! Your live class is tomorrow: Live Class #1 — Presentation Simulation & Feedback. Join link: https://zoom.us/j/96543210987","countryCode":"62"}',
 '{"status":true,"detail":"message sent successfully"}',
 'SUCCESS', NOW() - INTERVAL '6 days');
```

---

### 4.12 Enrollments & Lesson Progress

```sql
INSERT INTO enrollments (id, user_id, course_id, order_id, status, progress_pct, enrolled_at) VALUES
(1, 5,  1, 1, 'active', 45.00, NOW() - INTERVAL '40 days'),
(2, 6,  1, 2, 'active', 20.00, NOW() - INTERVAL '38 days'),
(3, 7,  2, 3, 'active', 60.00, NOW() - INTERVAL '25 days'),
(4, 8,  3, 4, 'active', 85.00, NOW() - INTERVAL '20 days'),
(5, 9,  1, 5, 'active', 10.00, NOW() - INTERVAL '15 days'),
(6, 10, 4, 6, 'active',  5.00, NOW() - INTERVAL '10 days');

SELECT setval('enrollments_id_seq', 10);

INSERT INTO lesson_progress (user_id, lesson_id, enrollment_id, is_completed, last_position, completed_at) VALUES
(5, 1, 1, TRUE,  0,   NOW() - INTERVAL '39 days'),
(5, 2, 1, TRUE,  0,   NOW() - INTERVAL '37 days'),
(5, 3, 1, FALSE, 742, NULL),
(8, 8, 4, TRUE,  0,   NOW() - INTERVAL '19 days'),
(8, 9, 4, TRUE,  0,   NOW() - INTERVAL '17 days'),
(7, 8, 3, TRUE,  0,   NOW() - INTERVAL '24 days'),
(7, 9, 3, FALSE, 312, NULL);
```

---

### 4.13 Coupons

```sql
INSERT INTO coupons (code, description, discount_type, discount_value, max_uses, is_active, valid_until, created_by) VALUES
('LAUNCH50',    'Early adopter 50% discount',           'percentage', 50.00,  100, FALSE, NOW() - INTERVAL '1 day', 1),
('STEMFLUENT',  'IDR 150,000 off STEM courses',         'fixed',      150000,  50, TRUE,  NOW() + INTERVAL '30 days', 1),
('WELCOME2026', 'Welcome — 20% off all courses',        'percentage', 20.00,  200, TRUE,  NOW() + INTERVAL '60 days', 1);
```

---

### 4.14 Audit Logs

```sql
INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, old_value_json, new_value_json, ip_address) VALUES
(1, 'approve_payment_proof', 'payment_proofs', 1,
    '{"status":"pending"}', '{"status":"approved","verified_by":1}', '180.241.10.55'),
(1, 'create_course',         'courses', 5,
    NULL, '{"title":"Technical Writing in English","status":"draft"}', '180.241.10.55'),
(1, 'toggle_payment_method', 'payment_methods', 2,
    '{"is_active":false}', '{"is_active":true}', '180.241.10.55'),
(1, 'reject_payment_proof',  'payment_proofs', 2,
    '{"status":"pending"}', '{"status":"rejected","rejection_note":"Proof image too blurry, please re-upload."}', '180.241.10.55');
```

---

## 5. Useful Reference Queries

### Revenue Report by Month

```sql
SELECT
    DATE_TRUNC('month', o.paid_at)   AS month,
    COUNT(*)                          AS total_orders,
    SUM(o.total_amount)               AS gross_revenue,
    SUM(o.platform_revenue)           AS platform_revenue,
    SUM(o.instructor_revenue)         AS instructor_revenue,
    pm.provider
FROM orders o
JOIN payment_methods pm ON pm.id = o.payment_method_id
WHERE o.status = 'paid'
  AND o.paid_at >= NOW() - INTERVAL '12 months'
GROUP BY 1, pm.provider
ORDER BY 1 DESC;
```

### Pending Manual Transfers (Admin Queue)

```sql
SELECT
    o.order_number,
    u.name               AS buyer_name,
    u.email,
    u.whatsapp_number,
    c.title              AS course_title,
    pm.name              AS payment_method,
    o.total_amount,
    o.created_at         AS order_time,
    pp.file_url          AS proof_url,
    pp.uploaded_at
FROM orders o
JOIN users u             ON u.id = o.user_id
JOIN courses c           ON c.id = o.course_id
JOIN payment_methods pm  ON pm.id = o.payment_method_id
JOIN payment_proofs pp   ON pp.order_id = o.id AND pp.status = 'pending'
WHERE o.status = 'pending_verification'
ORDER BY pp.uploaded_at ASC;
```

### Live Class Reminder Cron (Next 48 Hours)

```sql
SELECT
    l.id                 AS lesson_id,
    l.title              AS lesson_title,
    l.live_class_url,
    l.live_class_platform,
    l.live_class_datetime,
    l.reminder_sent_24h,
    l.reminder_sent_1h,
    c.title              AS course_title,
    u.name               AS learner_name,
    u.whatsapp_number,
    u.email
FROM lessons l
JOIN sections s      ON s.id = l.section_id
JOIN courses c       ON c.id = s.course_id
JOIN enrollments e   ON e.course_id = c.id AND e.status = 'active'
JOIN users u         ON u.id = e.user_id
WHERE l.content_type = 'live_class'
  AND l.live_class_datetime BETWEEN NOW() AND NOW() + INTERVAL '48 hours'
  AND l.deleted_at IS NULL
ORDER BY l.live_class_datetime, u.id;
```

### Content Access Gate (Returns TRUE if user is enrolled)

```sql
SELECT EXISTS (
    SELECT 1
    FROM enrollments e
    WHERE e.user_id   = $1  -- :user_id
      AND e.course_id = $2  -- :course_id
      AND e.status    = 'active'
      AND (e.expires_at IS NULL OR e.expires_at > NOW())
) AS has_access;
```

### Failed Notifications — Retry Queue

```sql
SELECT
    nl.id,
    nl.channel,
    nl.recipient,
    nl.order_number,
    nt.event_trigger,
    nl.error_message,
    nl.created_at
FROM notification_logs nl
JOIN notification_templates nt ON nt.id = nl.template_id
WHERE nl.status = 'FAILED'
  AND nl.created_at >= NOW() - INTERVAL '24 hours'
ORDER BY nl.created_at ASC;
```

### Payment Gateway Debug — Full Log for One Order

```sql
SELECT
    pl.log_type,
    pl.endpoint,
    pl.http_status,
    pl.request_payload,
    pl.response_payload,
    pl.created_at,
    wl.provider            AS webhook_provider,
    wl.signature_valid,
    wl.processing_status   AS webhook_status
FROM payment_logs pl
FULL OUTER JOIN webhook_logs wl ON wl.order_number = pl.order_number
WHERE pl.order_number = 'FH-20260801-000001'
   OR wl.order_number = 'FH-20260801-000001'
ORDER BY COALESCE(pl.created_at, wl.received_at);
```

---

## 6. Index Summary (High-Traffic Optimization)

| Table | Index | Purpose |
|-------|-------|---------|
| `users` | `idx_users_email` | Login lookup on every SSO callback |
| `users` | `idx_users_google_id` | Google OAuth2 user resolution |
| `courses` | `idx_courses_status` | Landing page course listing |
| `courses` | `idx_courses_featured` | Homepage featured section |
| `payment_methods` | `idx_payment_methods_active` | Checkout page: load active methods + sort |
| `orders` | `idx_orders_gateway_txn_id` | Webhook processing — find order by gateway ID |
| `orders` | `idx_orders_status` | Admin dashboard filtering |
| `orders` | `idx_orders_pending_manual` | Admin pending verification queue |
| `orders` | `idx_orders_user_course_active` | Prevent duplicate active purchase |
| `enrollments` | `idx_enrollments_user_course` | "My Courses" dashboard load |
| `enrollments` | `idx_enrollments_user_active` | Content access gate on every lesson view |
| `lessons` | `idx_lessons_live_class_dt` | Live class reminder scheduling |
| `lessons` | `idx_lessons_reminder_24h/1h` | Cron job: find lessons needing reminder |
| `lesson_progress` | `idx_lesson_progress_user_lesson` | Save/load progress per lesson |
| `payment_logs` | `idx_payment_logs_order_number` | Debug all API calls for one order |
| `webhook_logs` | `idx_webhook_logs_gateway_txn` | Idempotent webhook deduplication |
| `notification_logs` | `idx_notif_logs_status` | Failed notification retry queue |
| `notification_logs` | `idx_notif_logs_order_number` | Audit: all notifications for one order |

---

## 7. Design Notes

1. **`payment_methods` replaces `payment_gateway_configs` + `bank_accounts`** — The attachment introduced a production-grade, granular per-method table that handles all three provider types (Midtrans, Xendit, manual) in one place. This is the canonical source for checkout display and fee calculation.
2. **`payment_instructions` replaces inline help text** — Each payment method has one or more ordered HTML instruction blocks. The frontend renders them on the checkout page after a method is selected.
3. **`payment_logs` is append-only** — It uses a soft `order_number` reference instead of a FK to allow logging even for malformed/unmatched webhooks without violating constraints.
4. **`notification_templates` drives all messages** — The `event_trigger` is the contract between the application code and the notification system. Adding a new event = insert one row, no code change needed.
5. **`notification_logs.order_number`** — Intentionally a soft VARCHAR reference (no FK) to allow logging notifications triggered by non-order events (live class reminders, welcome messages).
6. **No UUID, no ENUM** — All PKs are `BIGSERIAL`; all categorical fields are `VARCHAR` with `CHECK` constraints to allow schema evolution without table rewrites.
8. **All timestamps are `TIMESTAMPTZ`** — Stored as UTC, displayed in WIB (UTC+7) at the application layer.

---

*ERD v2.0 — Schema, seed data, and queries for FluencyHub. TRD (Technical Requirements Document) to be authored separately.*
