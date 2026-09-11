import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { PAYMENT_INSTRUCTIONS_SEED, PAYMENT_METHODS_SEED } from "./payment-seed-data";

config({ path: ".env.local" });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const sql = neon(databaseUrl);

async function seed() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? process.env.ADMIN_EMAILS?.split(",")[0]?.trim() ?? "admin@fluencyhub.id";

  await sql`
    INSERT INTO users (id, google_id, name, email, role, is_active, revenue_share_pct)
    VALUES (1, 'google_admin_001', 'FluencyHub Admin', ${adminEmail}, 'admin', TRUE, 0.00)
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      role = 'admin',
      is_active = TRUE
  `;

  await sql`
    INSERT INTO users (id, google_id, name, email, whatsapp_number, role, is_active, revenue_share_pct) VALUES
    (2, 'google_instr_001', 'Dr. Anindya Kusuma, M.Sc.', 'anindya@fluencyhub.id', '6281234567801', 'instructor', TRUE, 70.00),
    (3, 'google_instr_002', 'Rizky Pratama, M.Hum.', 'rizky@fluencyhub.id', '6281234567802', 'instructor', TRUE, 70.00),
    (4, 'google_instr_003', 'Sarah Maharani, B.Ed.', 'sarah@fluencyhub.id', '6281234567803', 'instructor', TRUE, 65.00)
    ON CONFLICT (id) DO NOTHING
  `;

  await sql`
    INSERT INTO users (id, google_id, name, email, whatsapp_number, role, is_active) VALUES
    (5, 'google_user_001', 'Budi Santoso', 'budi.santoso@gmail.com', '6281111110001', 'user', TRUE)
    ON CONFLICT (id) DO NOTHING
  `;

  await sql`SELECT setval('users_id_seq', GREATEST((SELECT MAX(id) FROM users), 20))`;

  await sql`
    INSERT INTO categories (id, name, slug, icon, sort_order) VALUES
    (1, 'Applied English for STEM', 'applied-english-stem', 'flask', 1),
    (2, 'Business Communication', 'business-communication', 'handshake', 2),
    (3, 'Presentation & Public Speaking', 'presentation-public-speaking', 'presentation', 3),
    (4, 'Technical Writing', 'technical-writing', 'pencil-line', 4),
    (5, 'Interview Preparation', 'interview-preparation', 'user-check', 5),
    (6, 'Academic English', 'academic-english', 'graduation-cap', 6)
    ON CONFLICT (slug) DO NOTHING
  `;
  await sql`SELECT setval('categories_id_seq', 10)`;

  for (const [id, code, name, logoUrl, type, provider, sortOrder] of PAYMENT_METHODS_SEED) {
    await sql`
      INSERT INTO payment_methods (
        id, code, name, logo_url, type, provider,
        admin_fee_flat, admin_fee_pct, is_active, is_redirect, sort_order
      ) VALUES (
        ${id}, ${code}, ${name}, ${logoUrl}, ${type}, ${provider},
        0, 0.00, TRUE, FALSE, ${sortOrder}
      )
      ON CONFLICT (code) DO UPDATE SET
        name = EXCLUDED.name,
        logo_url = EXCLUDED.logo_url,
        type = EXCLUDED.type,
        provider = EXCLUDED.provider,
        admin_fee_flat = EXCLUDED.admin_fee_flat,
        admin_fee_pct = EXCLUDED.admin_fee_pct,
        is_active = TRUE,
        is_redirect = EXCLUDED.is_redirect,
        sort_order = EXCLUDED.sort_order
    `;
  }
  await sql`SELECT setval('payment_methods_id_seq', 40)`;

  await sql`DELETE FROM payment_instructions`;
  for (const [methodId, title, content, sortOrder] of PAYMENT_INSTRUCTIONS_SEED) {
    await sql`
      INSERT INTO payment_instructions (payment_method_id, title, content, sort_order)
      VALUES (${methodId}, ${title}, ${content}, ${sortOrder})
    `;
  }

  await sql`
    INSERT INTO courses (
      id, instructor_id, category_id, title, slug, short_description,
      price, original_price, status, is_featured, level,
      enrollment_count, platform_fee_pct, published_at, thumbnail_url
    ) VALUES
    (1, 2, 1, 'Applied English for STEM Professionals', 'applied-english-stem-professionals',
     'Master technical English for data presentations, research, and international collaboration.',
     1499000, 2499000, 'published', TRUE, 'intermediate', 0, 30.00, NOW(),
     'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80'),
    (2, 2, 2, 'Business English Masterclass: Negotiation & Meetings', 'business-english-masterclass',
     'Communicate confidently in international meetings, contract negotiations, and boardroom presentations.',
     1799000, 2799000, 'published', TRUE, 'intermediate', 0, 30.00, NOW(),
     'https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=800&q=80'),
    (3, 3, 3, 'Public Speaking in English: Zero to Confident', 'public-speaking-english-zero-confident',
     'From speaking anxiety to delivering compelling English presentations in front of any audience.',
     999000, 1699000, 'published', FALSE, 'beginner', 0, 30.00, NOW(),
     'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80'),
    (4, 4, 5, 'English Interview Prep: Tech & Multinational Companies', 'english-interview-prep-tech',
     'Ace HRD and user interviews at multinational and tech companies with confidence.',
     1299000, 1999000, 'published', TRUE, 'all_levels', 0, 30.00, NOW(),
     'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80')
    ON CONFLICT (slug) DO NOTHING
  `;
  await sql`SELECT setval('courses_id_seq', 10)`;

  await sql`
    INSERT INTO sections (id, course_id, title, sort_order) VALUES
    (1, 1, 'Module 1: Foundation — Scientific Communication', 1),
    (2, 1, 'Module 2: Technical Presentation Skills', 2),
    (3, 1, 'Module 3: Live Collaboration Sessions', 3),
    (4, 2, 'Module 1: Business Meeting Essentials', 1),
    (5, 3, 'Part 1: Overcoming Speaking Anxiety', 1),
    (6, 4, 'HRD Interview Preparation', 1)
    ON CONFLICT (id) DO NOTHING
  `;
  await sql`SELECT setval('sections_id_seq', 20)`;

  await sql`
    INSERT INTO lessons (
      id, section_id, title, content_type, youtube_url, youtube_video_id,
      description, duration_minutes, is_free_preview, sort_order
    ) VALUES
    (1, 1, 'Welcome & Program Overview', 'youtube_video',
     'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ',
     'Introduction to the program.', 8, TRUE, 1),
    (2, 1, 'The 3 Pillars of Scientific Communication', 'youtube_video',
     'https://www.youtube.com/watch?v=xvFZjo5PgG0', 'xvFZjo5PgG0',
     'Clarity, Precision, and Brevity.', 22, FALSE, 2),
    (3, 2, 'Data Presentation Vocabulary', 'youtube_video',
     'https://www.youtube.com/watch?v=Ks-_Mh1QhMc', 'Ks-_Mh1QhMc',
     'Phrases for charts and trends.', 25, FALSE, 1),
    (11, 4, 'Welcome to Business English', 'youtube_video',
     'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ',
     'Course preview.', 8, TRUE, 1),
    (12, 5, 'Welcome to Public Speaking', 'youtube_video',
     'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ',
     'Course preview.', 8, TRUE, 1),
    (13, 6, 'Welcome to Interview Prep', 'youtube_video',
     'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ',
     'Course preview.', 8, TRUE, 1)
    ON CONFLICT (id) DO NOTHING
  `;
  await sql`SELECT setval('lessons_id_seq', 30)`;

  await sql`
    INSERT INTO coupons (code, description, discount_type, discount_value, is_active)
    VALUES
    ('STEMFLUENT', '20% off any course', 'percentage', 20, TRUE),
    ('WELCOME2026', '20% welcome discount', 'percentage', 20, TRUE)
    ON CONFLICT (code) DO NOTHING
  `;

  await sql`
    INSERT INTO notification_templates (event_trigger, channel, message_content, is_active) VALUES
    ('PAYMENT_SUCCESS', 'WHATSAPP', 'Hi {name}! Payment confirmed for {course_title}.', TRUE),
    ('MANUAL_TRANSFER_PENDING', 'WHATSAPP', 'Hi {name}, we received your transfer proof for {course_title}.', TRUE),
    ('PAYMENT_REJECTED', 'WHATSAPP', 'Hi {name}, we could not verify your proof. {rejection_note}', TRUE)
    ON CONFLICT (event_trigger, channel) DO NOTHING
  `;

  console.log(`Seed complete. Admin email: ${adminEmail}`);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
