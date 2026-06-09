-- ============================================================
-- EduOS Security RLS — النسخة الشاملة v3
-- التاريخ: 2026-06-09
-- الحل: 4 خطوات في ملف واحد
--   STEP 1: إنشاء كل الجداول المفقودة (CREATE TABLE IF NOT EXISTS)
--   STEP 2: تفعيل RLS على كل الجداول
--   STEP 3: حذف كل السياسات القديمة المفتوحة
--   STEP 4: إنشاء سياسات آمنة جديدة
-- ملاحظة: بدون auth functions — لا يحتاج صلاحيات خاصة
-- ============================================================

-- ============================================================
-- STEP 1A: جداول Sprint H (المنظومات الجديدة)
-- ============================================================

CREATE TABLE IF NOT EXISTS school_events (
  id           BIGSERIAL PRIMARY KEY,
  title        TEXT NOT NULL,
  event_date   DATE NOT NULL,
  event_type   TEXT DEFAULT 'school',
  description  TEXT,
  created_by   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS broadcasts (
  id             BIGSERIAL PRIMARY KEY,
  title          TEXT NOT NULL,
  content        TEXT NOT NULL,
  broadcast_type TEXT DEFAULT 'all',
  priority       TEXT DEFAULT 'normal',
  channels       TEXT[] DEFAULT ARRAY['app'],
  is_sent        BOOLEAN DEFAULT FALSE,
  sent_at        TIMESTAMPTZ,
  created_by     TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS budget_entries (
  id          BIGSERIAL PRIMARY KEY,
  category    TEXT NOT NULL,
  entry_type  TEXT NOT NULL,
  amount      NUMERIC(10,2) NOT NULL,
  entry_date  DATE NOT NULL,
  description TEXT,
  created_by  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS library_books (
  id               BIGSERIAL PRIMARY KEY,
  title            TEXT NOT NULL,
  author           TEXT,
  category         TEXT DEFAULT 'story',
  grade_level      TEXT DEFAULT 'all',
  total_copies     INTEGER DEFAULT 1,
  available_copies INTEGER DEFAULT 1,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS library_loans (
  id            BIGSERIAL PRIMARY KEY,
  book_id       BIGINT REFERENCES library_books(id) ON DELETE SET NULL,
  student_name  TEXT NOT NULL,
  class_name    TEXT,
  borrowed_date DATE DEFAULT CURRENT_DATE,
  due_date      DATE NOT NULL,
  returned_date DATE,
  status        TEXT DEFAULT 'borrowed',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nursing_visits (
  id               BIGSERIAL PRIMARY KEY,
  student_name     TEXT NOT NULL,
  class_name       TEXT,
  visit_date       DATE DEFAULT CURRENT_DATE,
  visit_time       TIME DEFAULT CURRENT_TIME,
  complaint        TEXT,
  action_taken     TEXT,
  is_special_needs BOOLEAN DEFAULT FALSE,
  parent_notified  BOOLEAN DEFAULT FALSE,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cafeteria_items (
  id           BIGSERIAL PRIMARY KEY,
  item_name    TEXT NOT NULL,
  category     TEXT DEFAULT 'snack',
  price        NUMERIC(6,2) NOT NULL,
  is_healthy   BOOLEAN DEFAULT FALSE,
  is_available BOOLEAN DEFAULT TRUE,
  day_of_week  TEXT[] DEFAULT ARRAY['sun','mon','tue','wed','thu'],
  calories     INTEGER,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STEP 1B: جداول المنظومات (systems_tables.sql)
-- ============================================================

CREATE TABLE IF NOT EXISTS security_authorized_pickups (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name    TEXT NOT NULL,
  class_name      TEXT,
  authorized_name TEXT NOT NULL,
  id_number       TEXT NOT NULL,
  relation        TEXT DEFAULT 'ولي أمر',
  phone           TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  notes           TEXT,
  created_by      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nurse_visits (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name TEXT NOT NULL,
  class_name   TEXT,
  grade_level  TEXT,
  visit_date   DATE DEFAULT CURRENT_DATE,
  visit_time   TIME DEFAULT CURRENT_TIME,
  symptoms     TEXT,
  action_taken TEXT,
  outcome      TEXT DEFAULT 'راحة',
  medicine_given TEXT,
  notes        TEXT,
  nurse_name   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_health_records (
  id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name       TEXT NOT NULL,
  class_name         TEXT,
  allergies          TEXT,
  chronic_conditions TEXT,
  medications        TEXT,
  emergency_contact  TEXT,
  blood_type         TEXT,
  notes              TEXT,
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maintenance_requests (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title           TEXT NOT NULL,
  location        TEXT NOT NULL,
  category        TEXT DEFAULT 'كهرباء',
  priority        TEXT DEFAULT 'عادي',
  status          TEXT DEFAULT 'مفتوح',
  description     TEXT,
  reported_by     TEXT,
  assigned_to     TEXT,
  estimated_hours NUMERIC(5,1),
  completed_at    TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cafeteria_transactions (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name     TEXT,
  staff_name       TEXT,
  item_name        TEXT NOT NULL,
  quantity         INTEGER DEFAULT 1,
  unit_price       NUMERIC(6,2) NOT NULL,
  total_price      NUMERIC(8,2) NOT NULL,
  payment_method   TEXT DEFAULT 'نقد',
  transaction_date DATE DEFAULT CURRENT_DATE,
  transaction_time TIME DEFAULT CURRENT_TIME,
  cashier_name     TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cafeteria_menu (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name         TEXT NOT NULL,
  category     TEXT DEFAULT 'وجبة رئيسية',
  price        NUMERIC(6,2) NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  calories     INTEGER,
  is_healthy   BOOLEAN DEFAULT FALSE,
  image_emoji  TEXT DEFAULT '🍽️',
  sort_order   INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS financial_records (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type           TEXT NOT NULL,
  category       TEXT NOT NULL,
  amount         NUMERIC(10,2) NOT NULL,
  description    TEXT,
  reference_no   TEXT,
  payment_method TEXT DEFAULT 'تحويل بنكي',
  date           DATE DEFAULT CURRENT_DATE,
  approved_by    TEXT,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS social_cases (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name     TEXT NOT NULL,
  class_name       TEXT,
  case_type        TEXT NOT NULL,
  priority         TEXT DEFAULT 'متوسط',
  status           TEXT DEFAULT 'مفتوح',
  description      TEXT,
  interventions    TEXT,
  parent_contacted BOOLEAN DEFAULT FALSE,
  next_followup    DATE,
  closed_at        TIMESTAMPTZ,
  worker_name      TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inclusion_plans (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name    TEXT NOT NULL,
  class_name      TEXT,
  disability_type TEXT,
  support_level   TEXT DEFAULT 'متوسط',
  plan_goals      TEXT,
  accommodations  TEXT,
  progress_notes  TEXT,
  next_review     DATE,
  specialist_name TEXT,
  status          TEXT DEFAULT 'نشط',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exam_schedule (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_name    TEXT NOT NULL,
  subject      TEXT NOT NULL,
  grade_level  TEXT NOT NULL,
  class_name   TEXT,
  exam_date    DATE NOT NULL,
  start_time   TIME,
  duration_min INTEGER DEFAULT 60,
  location     TEXT DEFAULT 'القاعة الرئيسية',
  supervisor   TEXT,
  exam_type    TEXT DEFAULT 'نهائي',
  max_score    NUMERIC(5,2) DEFAULT 100,
  notes        TEXT,
  status       TEXT DEFAULT 'مجدول',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exam_results (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id      UUID REFERENCES exam_schedule(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  class_name   TEXT,
  score        NUMERIC(5,2),
  grade_letter TEXT,
  is_absent    BOOLEAN DEFAULT FALSE,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exam_id, student_name)
);

-- ============================================================
-- STEP 1C: جداول الدروس والإعدادات
-- ============================================================

CREATE TABLE IF NOT EXISTS school_config (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_name   TEXT NOT NULL DEFAULT 'روضة ومدرسة الجود',
  academic_year TEXT DEFAULT '2025-2026',
  setup_complete BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS school_themes (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id   TEXT NOT NULL DEFAULT 'aljood',
  theme_key   TEXT NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  is_special  BOOLEAN NOT NULL DEFAULT false,
  label_ar    TEXT,
  activated_by TEXT,
  note        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lesson_plans (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade            TEXT NOT NULL,
  section_label    TEXT,
  subject          TEXT NOT NULL,
  topic            TEXT NOT NULL,
  duration_minutes INT,
  student_count    INT,
  model            TEXT,
  plan_json        JSONB NOT NULL DEFAULT '{}',
  created_by       TEXT DEFAULT 'teacher',
  status           TEXT DEFAULT 'draft',
  academic_year    TEXT DEFAULT '2025-2026',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lesson_sessions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_plan_id UUID REFERENCES lesson_plans(id),
  session_code   TEXT UNIQUE NOT NULL,
  grade          TEXT,
  section_label  TEXT,
  subject        TEXT,
  status         TEXT DEFAULT 'waiting',
  current_phase  INT DEFAULT 0,
  teacher_id     TEXT,
  started_at     TIMESTAMPTZ,
  ended_at       TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_lesson_progress (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID REFERENCES lesson_sessions(id),
  student_name    TEXT NOT NULL,
  student_id      TEXT,
  current_phase   INT DEFAULT 0,
  phases_done     INT[] DEFAULT '{}',
  answers         JSONB DEFAULT '{}',
  self_assessment INT,
  completed       BOOLEAN DEFAULT false,
  last_active     TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STEP 1D: جداول الاستبيانات
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS surveys (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id     TEXT DEFAULT 'aljood',
  title         TEXT NOT NULL,
  description   TEXT,
  target_roles  TEXT[] DEFAULT '{}',
  status        TEXT NOT NULL DEFAULT 'draft',
  allow_anon    BOOLEAN DEFAULT FALSE,
  created_by    TEXT,
  academic_year TEXT DEFAULT '2025-2026',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS survey_questions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id     UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  order_num     INTEGER NOT NULL DEFAULT 1,
  type          TEXT NOT NULL DEFAULT 'single',
  question_text TEXT DEFAULT '',
  options       JSONB DEFAULT '[]',
  required      BOOLEAN DEFAULT FALSE,
  section_title TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS survey_responses (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id        UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  school_id        TEXT DEFAULT 'aljood',
  respondent_name  TEXT,
  respondent_role  TEXT,
  respondent_id    TEXT,
  submitted_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS survey_answers (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  response_id  UUID NOT NULL REFERENCES survey_responses(id) ON DELETE CASCADE,
  question_id  UUID NOT NULL REFERENCES survey_questions(id) ON DELETE CASCADE,
  answer_value JSONB,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STEP 1E: جدول سجل الإشعارات
-- ============================================================

CREATE TABLE IF NOT EXISTS notification_log (
  id              BIGSERIAL PRIMARY KEY,
  recipient_id    TEXT NOT NULL,
  recipient_name  TEXT NOT NULL,
  channel         TEXT NOT NULL,
  message         TEXT NOT NULL,
  status          TEXT DEFAULT 'sent',
  reference_id    BIGINT,
  reference_table TEXT,
  sent_at         TIMESTAMPTZ DEFAULT NOW(),
  error_message   TEXT
);

-- ============================================================
-- STEP 2: تفعيل RLS على كل الجداول
-- ============================================================
ALTER TABLE IF EXISTS student_grades              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS weekly_results              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS stream_progress_g3          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS stream_progress_g4          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS student_semester_summary    ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS grade_records               ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS grade_assessment_defs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lesson_truth_log            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lesson_exit_log             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lesson_results_w5           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lesson_results_w8           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lesson_plans                ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lesson_sessions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS student_lesson_progress     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS staff_profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS staff_evaluations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS staff_annual_grades         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS staff_pdp                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS staff_evidence              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS staff_attendance            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS staff_checkin_log           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS staff_daily_attendance      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS staff_device_registry       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS staff_notifications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS attendance_qr_log           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gate_entry_log              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS vark_results                ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS app_settings                ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS backups_log                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS backup_requests             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS schedule_swaps              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS period_swaps                ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS permanent_swap_log          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS substitute_log              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS substitute_assignments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS duty_schedule               ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS facility_bookings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS school_events               ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS school_config               ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS school_themes               ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS student_intent_log          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS social_cases                ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS inclusion_plans             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS student_health_records      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS nurse_visits                ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS nursing_visits              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS security_authorized_pickups ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS maintenance_requests        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS financial_records           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS budget_entries              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS library_books               ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS library_loans               ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cafeteria_items             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cafeteria_menu              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cafeteria_transactions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS exam_schedule               ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS exam_results                ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS broadcasts                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS surveys                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS survey_questions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS survey_responses            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS survey_answers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notification_log            ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 3: حذف كل السياسات القديمة (تنظيف شامل)
-- ============================================================
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END$$;

-- ============================================================
-- STEP 4: سياسات آمنة جديدة 100%
-- القاعدة: SELECT = authenticated فقط | WRITE = service_role فقط
-- ============================================================

-- ─── 📚 جداول الدرجات ──────────────────────────────────────
CREATE POLICY "grades_select_auth" ON student_grades
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "grades_write_service" ON student_grades
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "weekly_select_auth" ON weekly_results
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "weekly_write_service" ON weekly_results
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "sg3_select_auth" ON stream_progress_g3
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "sg3_write_service" ON stream_progress_g3
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "sg4_select_auth" ON stream_progress_g4
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "sg4_write_service" ON stream_progress_g4
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "sss_select_auth" ON student_semester_summary
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "sss_write_service" ON student_semester_summary
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "gr_select_auth" ON grade_records
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "gr_write_service" ON grade_records
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "gad_select_auth" ON grade_assessment_defs
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "gad_write_service" ON grade_assessment_defs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── 📝 جداول الدروس ───────────────────────────────────────
CREATE POLICY "ltl_select_auth" ON lesson_truth_log
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "ltl_write_service" ON lesson_truth_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "lel_select_auth" ON lesson_exit_log
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "lel_write_service" ON lesson_exit_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "lrw5_select_auth" ON lesson_results_w5
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "lrw5_write_service" ON lesson_results_w5
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "lrw8_select_auth" ON lesson_results_w8
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "lrw8_write_service" ON lesson_results_w8
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "lp_select_auth" ON lesson_plans
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "lp_write_service" ON lesson_plans
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "ls_select_auth" ON lesson_sessions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "ls_insert_auth" ON lesson_sessions
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "ls_write_service" ON lesson_sessions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "slp_select_auth" ON student_lesson_progress
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "slp_insert_auth" ON student_lesson_progress
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "slp_write_service" ON student_lesson_progress
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── 👩‍🏫 جداول الموظفين ─────────────────────────────────────
CREATE POLICY "sp_select_auth" ON staff_profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "sp_write_service" ON staff_profiles
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "sev_select_auth" ON staff_evaluations
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "sev_write_service" ON staff_evaluations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "sag_select_auth" ON staff_annual_grades
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "sag_write_service" ON staff_annual_grades
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "spdp_select_auth" ON staff_pdp
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "spdp_write_service" ON staff_pdp
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "sevi_select_auth" ON staff_evidence
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "sevi_write_service" ON staff_evidence
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── 📋 جداول الحضور ───────────────────────────────────────
CREATE POLICY "sa_select_auth" ON staff_attendance
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "sa_write_service" ON staff_attendance
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "scl_select_auth" ON staff_checkin_log
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "scl_insert_anon" ON staff_checkin_log
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "scl_write_service" ON staff_checkin_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "sda_select_auth" ON staff_daily_attendance
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "sda_write_service" ON staff_daily_attendance
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "sdr_select_auth" ON staff_device_registry
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "sdr_write_service" ON staff_device_registry
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "sn_select_auth" ON staff_notifications
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "sn_write_service" ON staff_notifications
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- QR الحضور: القراءة للمصادقين، الإدخال لـ anon (تابلت البوابة)
CREATE POLICY "aql_select_auth" ON attendance_qr_log
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "aql_insert_anon" ON attendance_qr_log
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "aql_write_service" ON attendance_qr_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- البوابة: القراءة للمصادقين، الإدخال لـ anon
CREATE POLICY "gel_select_auth" ON gate_entry_log
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "gel_insert_anon" ON gate_entry_log
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "gel_write_service" ON gate_entry_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── ⚙️ إعدادات التطبيق (بدون مفتاح Gemini للـ anon) ──────
CREATE POLICY "as_select_auth" ON app_settings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "as_write_service" ON app_settings
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── 🧠 VARK ────────────────────────────────────────────────
CREATE POLICY "vark_select_auth" ON vark_results
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "vark_insert_auth" ON vark_results
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "vark_write_service" ON vark_results
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── 💾 النسخ الاحتياطية ────────────────────────────────────
CREATE POLICY "bl_select_auth" ON backups_log
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "bl_write_service" ON backups_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "br_select_auth" ON backup_requests
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "br_insert_auth" ON backup_requests
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "br_write_service" ON backup_requests
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── 🔄 جداول التبديل ───────────────────────────────────────
CREATE POLICY "ss_select_auth" ON schedule_swaps
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "ss_insert_auth" ON schedule_swaps
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "ss_write_service" ON schedule_swaps
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "ps_select_auth" ON period_swaps
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "ps_insert_auth" ON period_swaps
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "ps_write_service" ON period_swaps
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "psl_select_auth" ON permanent_swap_log
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "psl_write_service" ON permanent_swap_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "subl_select_auth" ON substitute_log
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "subl_write_service" ON substitute_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "suba_select_auth" ON substitute_assignments
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "suba_write_service" ON substitute_assignments
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── 📅 الواجب والمرافق ─────────────────────────────────────
CREATE POLICY "ds_select_auth" ON duty_schedule
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "ds_insert_auth" ON duty_schedule
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "ds_write_service" ON duty_schedule
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "fb_select_auth" ON facility_bookings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "fb_insert_auth" ON facility_bookings
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "fb_write_service" ON facility_bookings
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── 📆 التقويم ─────────────────────────────────────────────
CREATE POLICY "se_select_auth" ON school_events
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "se_write_service" ON school_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── ⚙️ إعدادات المدرسة والثيمات ────────────────────────────
CREATE POLICY "sc_select_auth" ON school_config
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "sc_write_service" ON school_config
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "sth_select_auth" ON school_themes
  FOR SELECT USING (true);
CREATE POLICY "sth_write_service" ON school_themes
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── 📊 سجل نوايا الطلاب ────────────────────────────────────
CREATE POLICY "sil_select_auth" ON student_intent_log
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "sil_write_service" ON student_intent_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── 🤲 الأخصائية الاجتماعية ────────────────────────────────
CREATE POLICY "soc_select_auth" ON social_cases
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "soc_write_service" ON social_cases
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── ♿ الدمج والتعليم الخاص ─────────────────────────────────
CREATE POLICY "inc_select_auth" ON inclusion_plans
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "inc_write_service" ON inclusion_plans
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── 🏥 الصحة والتمريض ──────────────────────────────────────
CREATE POLICY "shr_select_auth" ON student_health_records
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "shr_write_service" ON student_health_records
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "nv_select_auth" ON nurse_visits
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "nv_write_service" ON nurse_visits
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "nvv_select_auth" ON nursing_visits
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "nvv_write_service" ON nursing_visits
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── 🔒 الأمن ───────────────────────────────────────────────
CREATE POLICY "sap_select_auth" ON security_authorized_pickups
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "sap_write_service" ON security_authorized_pickups
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── 🔧 الصيانة ─────────────────────────────────────────────
CREATE POLICY "mr_select_auth" ON maintenance_requests
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "mr_insert_auth" ON maintenance_requests
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "mr_write_service" ON maintenance_requests
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── 💰 المالية ─────────────────────────────────────────────
CREATE POLICY "fr_select_auth" ON financial_records
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "fr_write_service" ON financial_records
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "be_select_auth" ON budget_entries
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "be_write_service" ON budget_entries
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── 📚 المكتبة ─────────────────────────────────────────────
CREATE POLICY "lb_select_auth" ON library_books
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "lb_write_service" ON library_books
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "ll_select_auth" ON library_loans
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "ll_insert_auth" ON library_loans
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "ll_write_service" ON library_loans
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── 🍽️ المقصف ──────────────────────────────────────────────
CREATE POLICY "ci_select_auth" ON cafeteria_items
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "ci_write_service" ON cafeteria_items
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "cm_select_auth" ON cafeteria_menu
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "cm_write_service" ON cafeteria_menu
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "ct_select_auth" ON cafeteria_transactions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "ct_insert_auth" ON cafeteria_transactions
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "ct_write_service" ON cafeteria_transactions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── 📝 الاختبارات ──────────────────────────────────────────
CREATE POLICY "es_select_auth" ON exam_schedule
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "es_write_service" ON exam_schedule
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "er_select_auth" ON exam_results
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "er_write_service" ON exam_results
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── 📢 البث والإعلانات ─────────────────────────────────────
CREATE POLICY "bc_select_auth" ON broadcasts
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "bc_write_service" ON broadcasts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── 📊 الاستبيانات ─────────────────────────────────────────
CREATE POLICY "sv_select_auth" ON surveys
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "sv_write_service" ON surveys
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "sq_select_auth" ON survey_questions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "sq_write_service" ON survey_questions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "sr_select_auth" ON survey_responses
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "sr_insert_anon" ON survey_responses
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "sr_write_service" ON survey_responses
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "sa2_select_auth" ON survey_answers
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "sa2_insert_anon" ON survey_answers
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "sa2_write_service" ON survey_answers
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── 🔔 سجل الإشعارات ───────────────────────────────────────
CREATE POLICY "nl_select_auth" ON notification_log
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "nl_write_service" ON notification_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- ✅ التحقق النهائي — يجب أن لا تظهر سياسات تفتح للـ anon
-- ============================================================
SELECT 
  tablename,
  policyname,
  roles,
  CASE 
    WHEN roles::text LIKE '%public%' AND cmd != 'SELECT' THEN '🔴 PUBLIC WRITE - خطر!'
    WHEN roles::text LIKE '%anon%' AND cmd NOT IN ('SELECT','INSERT') THEN '⚠️ ANON UPDATE/DELETE - مشبوه'
    WHEN roles::text LIKE '%service_role%' THEN '✅ service_role - آمن'
    WHEN roles::text LIKE '%authenticated%' THEN '✅ authenticated - آمن'
    WHEN roles::text LIKE '%anon%' THEN '🔵 anon - مقبول للعمليات المحدودة'
    ELSE '🔍 ' || roles::text
  END as security_status
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
